import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { FLOOR_3D_SOURCE_ID } from '../src/extrude';
import {
  buildStyle,
  buildStyleLayers,
  defaultKindColor,
  FLOOR_SOURCE_ID,
  LAYER_IDS,
  venueHeights,
} from '../src/style';

const layer = (layers: LayerSpecification[], id: string) => {
  const found = layers.find((l) => l.id === id);
  if (!found) throw new Error(`layer ${id} tidak ada`);
  return found;
};

describe('buildStyleLayers', () => {
  const layers = buildStyleLayers();

  it('layer 2D dari source lantai, layer 3D dari source 3D', () => {
    expect(layers.map((l) => [l.id, l.type])).toEqual([
      [LAYER_IDS.flat, 'fill'],
      [LAYER_IDS.rooms, 'fill'],
      [LAYER_IDS.roomOutline, 'line'],
      [LAYER_IDS.vacantOutline, 'line'],
      [LAYER_IDS.walls, 'line'],
      [LAYER_IDS.extrusion, 'fill-extrusion'],
      [LAYER_IDS.extrusionEdges, 'fill-extrusion'],
      [LAYER_IDS.points, 'circle'],
      [LAYER_IDS.facilities, 'symbol'],
    ]);
    for (const l of layers) {
      const expected = l.type === 'fill-extrusion' ? FLOOR_3D_SOURCE_ID : FLOOR_SOURCE_ID;
      expect('source' in l && l.source).toBe(expected);
    }
  });

  it('3D tersembunyi secara default (mode awal 2D)', () => {
    expect(layer(layers, LAYER_IDS.extrusion).layout).toEqual({ visibility: 'none' });
    expect(layer(layers, LAYER_IDS.extrusionEdges).layout).toEqual({ visibility: 'none' });
  });

  it('tinggi ekstrusi dari data 3D; default 05-desain-ui.md digabung dengan tinggi venue', () => {
    const paint = JSON.stringify(layer(layers, LAYER_IDS.extrusion).paint);
    expect(paint).toContain('"fill-extrusion-height":["get","extrude"]');
    expect(venueHeights({})).toMatchObject({ unit: 4, wall: 5, stairs: 4 });
    expect(venueHeights({ heights: { unit: 6, corridor: 1 } })).toMatchObject({
      unit: 6,
      corridor: 1,
      wall: 5,
    });
  });

  it('warna dari display_settings venue menimpa default di 2D dan 3D, termasuk dinding dan pintu', () => {
    const custom = buildStyleLayers({
      colors: { unit: '#ffe9a8', wall: '#222222', door: '#0000ff' },
    });
    expect(JSON.stringify(layer(custom, LAYER_IDS.extrusion).paint)).toContain('"unit","#ffe9a8"');
    expect(JSON.stringify(layer(custom, LAYER_IDS.extrusion).paint)).toContain('#222222');
    expect(JSON.stringify(layer(custom, LAYER_IDS.rooms).paint)).toContain('#ffe9a8');
    expect(JSON.stringify(layer(custom, LAYER_IDS.walls).paint)).toContain('#222222');
    expect(JSON.stringify(layer(custom, LAYER_IDS.points).paint)).toContain('"door","#0000ff"');
  });

  it('warna bawaan per jenis untuk formulir tampilan', () => {
    expect(defaultKindColor('unit')).toBe('#ffffff');
    expect(defaultKindColor('wall')).toBe('#8a929b');
    expect(defaultKindColor('exit')).toBe('#1b7f4b');
    expect(defaultKindColor('facility')).toBe('#ffffff');
    expect(defaultKindColor('outdoor_area')).toBe('#e6e3da');
  });

  it('unit kosong memakai isi terang dan garis putus-putus', () => {
    expect(JSON.stringify(layer(layers, LAYER_IDS.rooms).paint)).toContain('#f7f7f4');
    const vacant = layer(layers, LAYER_IDS.vacantOutline);
    expect(vacant.type === 'line' && vacant.paint?.['line-dasharray']).toEqual([2, 2]);
  });

  it('fasilitas tampil sebagai ikon jenisnya, bukan titik; tanpa jenis memakai ikon pengganti', () => {
    const facilities = layer(layers, LAYER_IDS.facilities);
    expect(facilities.type).toBe('symbol');
    expect(JSON.stringify('filter' in facilities && facilities.filter)).toContain('"facility"');
    const layout = facilities.type === 'symbol' ? facilities.layout : undefined;
    expect(layout?.['icon-image']).toEqual([
      'concat',
      'facility-',
      ['coalesce', ['get', 'facilityTypeId'], 'unknown'],
    ]);
    expect(layout?.['icon-allow-overlap']).toBe(true);
    const points = layer(layers, LAYER_IDS.points);
    expect(JSON.stringify('filter' in points && points.filter)).not.toContain('facility');
  });

  it('dinding garis 2 px', () => {
    const walls = layer(layers, LAYER_IDS.walls);
    expect(walls.type === 'line' && walls.paint?.['line-width']).toBe(2);
  });
});

describe('buildStyle', () => {
  it('tanpa tile, sprite, atau font dari internet', () => {
    const style = buildStyle();
    expect(Object.values(style.sources).map((s) => s.type)).toEqual(['geojson', 'geojson']);
    expect(style.glyphs).toBeUndefined();
    expect(style.sprite).toBeUndefined();
    expect(JSON.stringify(style)).not.toMatch(/https?:\/\//);
  });
});

describe('gaya per jenis (T-109)', () => {
  const layers = buildStyleLayers();
  const paintOf = (id: string) => {
    const found = layers.find((l) => l.id === id);
    return JSON.stringify(found && 'paint' in found ? found.paint : {});
  };

  it('Area Luar dibedakan per subjenis: jalan, taman, parkir', () => {
    const flat = paintOf(LAYER_IDS.flat);
    for (const color of ['#e6e3da', '#d5e8c8', '#e3e5e8']) expect(flat).toContain(color);
  });

  it('pintu keluar berbeda warna dan ukuran dari pintu', () => {
    const points = paintOf(LAYER_IDS.points);
    expect(points).toContain('"exit",4.5');
    expect(points).toContain('#1b7f4b');
  });

  it('3D: cahaya lembut dan tepi atas ruang terang', () => {
    const style = buildStyle();
    expect(style.light).toMatchObject({ anchor: 'viewport', intensity: 0.32 });
    const edges = style.layers.find((l) => l.id === LAYER_IDS.extrusionEdges);
    expect(edges?.type === 'fill-extrusion' ? edges.paint?.['fill-extrusion-color'] : null).toBe(
      '#f7f8fa',
    );
  });
});
