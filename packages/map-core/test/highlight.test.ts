import type { LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import {
  FLOOR_3D_SOURCE_ID,
  FLOOR_SOURCE_ID,
  HIGHLIGHT_CAP_M,
  HIGHLIGHT_COLORS,
  highlightLayers,
  hitAt,
  LABEL_HIT_PX,
  LABEL_LAYER_ID,
  LAYER_IDS,
  modeVisibility,
  setHighlight,
} from '../src';

const paint = (layer: LayerSpecification | undefined) =>
  (layer && 'paint' in layer ? layer.paint : {}) as Record<string, unknown>;
const listed = (ids: string[]) => ['in', ['get', 'id'], ['literal', ids]];

describe('layer sorotan Visitor', () => {
  const entries = highlightLayers(['u1', 'f1']);
  const layer = (id: string) => entries.find((e) => e.layer.id === id);

  it('unit terpilih: isi --signal-soft dan garis --ink 2 px dari source lantai', () => {
    const fill = layer(LAYER_IDS.highlightFill)?.layer;
    const line = layer(LAYER_IDS.highlightLine)?.layer;
    expect(fill && 'source' in fill && fill.source).toBe(FLOOR_SOURCE_ID);
    expect(paint(fill)['fill-color']).toBe(HIGHLIGHT_COLORS.fill);
    expect(paint(line)).toMatchObject({ 'line-color': HIGHLIGHT_COLORS.line, 'line-width': 2 });
    expect(fill && 'filter' in fill && fill.filter).toEqual([
      'all',
      ['match', ['geometry-type'], ['Polygon', 'MultiPolygon'], true, false],
      listed(['u1', 'f1']),
    ]);
  });

  it('di 3D atap tipis di atas ekstrusi, tanpa pemisah tepi', () => {
    const cap = layer(LAYER_IDS.highlightCap)?.layer;
    expect(cap && 'source' in cap && cap.source).toBe(FLOOR_3D_SOURCE_ID);
    expect(cap && 'filter' in cap && cap.filter).toEqual([
      'all',
      ['!', ['has', 'edge']],
      listed(['u1', 'f1']),
    ]);
    expect(paint(cap)).toMatchObject({
      'fill-extrusion-color': HIGHLIGHT_COLORS.fill,
      'fill-extrusion-base': ['get', 'extrude'],
      'fill-extrusion-height': ['+', ['get', 'extrude'], HIGHLIGHT_CAP_M],
    });
  });

  it('titik fasilitas diberi lingkaran di bawah layer label', () => {
    const ring = layer(LAYER_IDS.highlightRing);
    expect(ring?.before).toBe(LABEL_LAYER_ID);
    expect(ring?.layer.type).toBe('circle');
    expect(layer(LAYER_IDS.highlightFill)?.before).toBe(LAYER_IDS.walls);
  });

  it('isi dan garis hanya di 2D, atap hanya di 3D, lingkaran di keduanya', () => {
    expect(modeVisibility(LAYER_IDS.highlightFill, '3d')).toBe('none');
    expect(modeVisibility(LAYER_IDS.highlightLine, '2d')).toBe('visible');
    expect(modeVisibility(LAYER_IDS.highlightCap, '2d')).toBe('none');
    expect(modeVisibility(LAYER_IDS.highlightCap, '3d')).toBe('visible');
    expect(modeVisibility(LAYER_IDS.highlightRing, '3d')).toBe('visible');
  });
});

/** Peta tiruan secukupnya untuk setHighlight dan hitAt (tanpa WebGL). */
function fakeMap(options: {
  layers?: string[];
  pitch?: number;
  rendered?: (layers: string[], box: boolean) => { properties: Record<string, unknown> }[];
}) {
  const layers = new Map<string, LayerSpecification>(
    (options.layers ?? []).map((id) => [id, { id } as LayerSpecification]),
  );
  const added: { layer: LayerSpecification; before: string | undefined }[] = [];
  const filters = new Map<string, unknown>();
  const map = {
    getPitch: () => options.pitch ?? 0,
    getLayer: (id: string) => layers.get(id),
    addLayer: (layer: LayerSpecification, before?: string) => {
      layers.set(layer.id, layer);
      added.push({ layer, before });
    },
    setFilter: (id: string, filter: unknown) => filters.set(id, filter),
    queryRenderedFeatures: (geometry: unknown, query: { layers: string[] }) =>
      options.rendered?.(query.layers, Array.isArray((geometry as unknown[])[0])) ?? [],
  };
  return { map: map as unknown as MapLibreMap, added, filters };
}

describe('setHighlight', () => {
  it('layer dibuat sekali dengan visibilitas mode sekarang, lalu hanya filternya diganti', () => {
    const { map, added, filters } = fakeMap({
      layers: [LAYER_IDS.walls, LAYER_IDS.points, LABEL_LAYER_ID],
      pitch: 50,
    });
    setHighlight(map, ['u1']);
    expect(added.map((a) => [a.layer.id, a.before])).toEqual([
      [LAYER_IDS.highlightFill, LAYER_IDS.walls],
      [LAYER_IDS.highlightLine, LAYER_IDS.points],
      [LAYER_IDS.highlightCap, LAYER_IDS.points],
      [LAYER_IDS.highlightRing, LABEL_LAYER_ID],
    ]);
    const visibility = (id: string) =>
      (added.find((a) => a.layer.id === id)?.layer as { layout?: { visibility?: string } })?.layout
        ?.visibility;
    expect(visibility(LAYER_IDS.highlightFill)).toBe('none');
    expect(visibility(LAYER_IDS.highlightCap)).toBe('visible');

    setHighlight(map, []);
    expect(added).toHaveLength(4);
    expect(filters.get(LAYER_IDS.highlightRing)).toEqual([
      'all',
      ['==', ['geometry-type'], 'Point'],
      listed([]),
    ]);
  });

  it('tanpa layer acuan, layer sorotan ditaruh paling atas', () => {
    const { map, added } = fakeMap({});
    setHighlight(map, ['u1']);
    expect(added.every((a) => a.before === undefined)).toBe(true);
  });
});

describe('hitAt', () => {
  const allLayers = [LABEL_LAYER_ID, LAYER_IDS.rooms, LAYER_IDS.extrusion];

  it('label lokasi dan ikon fasilitas didahulukan, dengan toleransi beberapa piksel', () => {
    let boxQueried = false;
    const { map } = fakeMap({
      layers: allLayers,
      rendered: (layers, box) => {
        if (layers.includes(LABEL_LAYER_ID)) {
          boxQueried = box;
          return [{ properties: { kind: 'location', id: 'loc-1' } }];
        }
        return [{ properties: { id: 'unit-1' } }];
      },
    });
    expect(hitAt(map, { x: 100, y: 100 })).toEqual({ kind: 'location', id: 'loc-1' });
    expect(boxQueried).toBe(true);
    expect(LABEL_HIT_PX).toBeGreaterThan(0);

    const facility = fakeMap({
      layers: allLayers,
      rendered: (layers) =>
        layers.includes(LABEL_LAYER_ID) ? [{ properties: { kind: 'facility', id: 'f-1' } }] : [],
    });
    expect(hitAt(facility.map, { x: 1, y: 1 })).toEqual({ kind: 'feature', id: 'f-1' });
  });

  it('tanpa label, ruang di bawah titik sentuh', () => {
    const { map } = fakeMap({
      layers: allLayers,
      rendered: (layers) =>
        layers.includes(LABEL_LAYER_ID) ? [] : [{ properties: { id: 'unit-1' } }],
    });
    expect(hitAt(map, { x: 1, y: 1 })).toEqual({ kind: 'feature', id: 'unit-1' });
  });

  it('tidak mengenai apa pun', () => {
    expect(hitAt(fakeMap({ layers: allLayers }).map, { x: 1, y: 1 })).toBeNull();
    expect(hitAt(fakeMap({}).map, { x: 1, y: 1 })).toBeNull();
  });
});
