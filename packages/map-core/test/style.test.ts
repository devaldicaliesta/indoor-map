import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { buildStyle, buildStyleLayers, FLOOR_SOURCE_ID, LAYER_IDS } from '../src/style';

const layer = (layers: LayerSpecification[], id: string) => {
  const found = layers.find((l) => l.id === id);
  if (!found) throw new Error(`layer ${id} tidak ada`);
  return found;
};

describe('buildStyleLayers', () => {
  const layers = buildStyleLayers();

  it('membuat layer 2D (fill, line) dan 3D (fill-extrusion) dari satu source', () => {
    expect(layers.map((l) => [l.id, l.type])).toEqual([
      [LAYER_IDS.flat, 'fill'],
      [LAYER_IDS.rooms, 'fill'],
      [LAYER_IDS.roomOutline, 'line'],
      [LAYER_IDS.vacantOutline, 'line'],
      [LAYER_IDS.walls, 'line'],
      [LAYER_IDS.extrusion, 'fill-extrusion'],
      [LAYER_IDS.points, 'circle'],
    ]);
    for (const l of layers) expect('source' in l && l.source).toBe(FLOOR_SOURCE_ID);
  });

  it('3D tersembunyi secara default (mode awal 2D)', () => {
    expect(layer(layers, LAYER_IDS.extrusion).layout).toEqual({ visibility: 'none' });
  });

  it('tinggi default mengikuti 05-desain-ui.md dan override per fitur didahulukan', () => {
    const paint = JSON.stringify(layer(layers, LAYER_IDS.extrusion).paint);
    expect(paint).toContain('["coalesce",["get","height"]');
    expect(paint).toContain('"unit",4');
    expect(paint).toContain('"stairs",4');
  });

  it('warna dan tinggi dari display_settings venue menimpa default', () => {
    const custom = buildStyleLayers({ colors: { unit: '#ffe9a8' }, heights: { unit: 6 } });
    const paint = JSON.stringify(layer(custom, LAYER_IDS.extrusion).paint);
    expect(paint).toContain('"unit","#ffe9a8"');
    expect(paint).toContain('"unit",6');
    expect(JSON.stringify(layer(custom, LAYER_IDS.rooms).paint)).toContain('#ffe9a8');
  });

  it('unit kosong memakai isi terang dan garis putus-putus', () => {
    expect(JSON.stringify(layer(layers, LAYER_IDS.rooms).paint)).toContain('#f7f7f4');
    const vacant = layer(layers, LAYER_IDS.vacantOutline);
    expect(vacant.type === 'line' && vacant.paint?.['line-dasharray']).toEqual([2, 2]);
  });

  it('dinding garis 2 px', () => {
    const walls = layer(layers, LAYER_IDS.walls);
    expect(walls.type === 'line' && walls.paint?.['line-width']).toBe(2);
  });
});

describe('buildStyle', () => {
  it('tanpa tile, sprite, atau font dari internet', () => {
    const style = buildStyle();
    expect(Object.values(style.sources).map((s) => s.type)).toEqual(['geojson']);
    expect(style.glyphs).toBeUndefined();
    expect(style.sprite).toBeUndefined();
    expect(JSON.stringify(style)).not.toMatch(/https?:\/\//);
  });
});
