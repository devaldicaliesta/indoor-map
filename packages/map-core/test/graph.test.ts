import type { FeatureCollection } from 'geojson';
import type { LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { graphCollection, setGraphVisibility } from '../src/layers/graph';
import {
  HATCH_IMAGE_IDS,
  HATCH_PIXEL_RATIO,
  hatchDisc,
  hatchTile,
} from '../src/layers/graph-hatch';
import {
  GRAPH_LAYER_IDS,
  GRAPH_PICK_LAYERS,
  GRAPH_STATUS_COLORS,
  GRAPH_VISIBILITY_GROUPS,
  graphLayers,
} from '../src/layers/graph-style';

const layers = graphLayers();
const layer = (id: string) => layers.find((l) => l.id === id) as LayerSpecification;
const prop = (l: LayerSpecification, key: 'paint' | 'layout') =>
  ((key in l ? l[key as keyof LayerSpecification] : {}) ?? {}) as Record<string, unknown>;
const filterOf = (l: LayerSpecification) => ('filter' in l ? l.filter : undefined);
const closedFilter = ['==', ['get', 'closed'], true];
function pixel(image: { width: number; data: Uint8Array }, x: number, y: number): number[] {
  const i = (y * image.width + x) * 4;
  return [...image.data.slice(i, i + 4)];
}

describe('gaya graf', () => {
  it('edge tidak aksesibel putus-putus, edge aksesibel utuh, keduanya bisa diklik', () => {
    const solid = layer(GRAPH_LAYER_IDS.edges);
    const dashed = layer(GRAPH_LAYER_IDS.edgesInaccessible);
    expect(prop(solid, 'paint')['line-dasharray']).toBeUndefined();
    expect(prop(dashed, 'paint')['line-dasharray']).toEqual([3, 2]);
    expect(filterOf(solid)).toContainEqual(['==', ['get', 'accessible'], true]);
    expect(filterOf(dashed)).toContainEqual(['!', ['==', ['get', 'accessible'], true]]);
    expect(GRAPH_PICK_LAYERS).toEqual([
      GRAPH_LAYER_IDS.nodes,
      GRAPH_LAYER_IDS.edges,
      GRAPH_LAYER_IDS.edgesInaccessible,
    ]);
  });

  it('edge tertutup merah di atas pita arsir; node tertutup di atas lingkaran berarsir', () => {
    for (const id of [GRAPH_LAYER_IDS.edges, GRAPH_LAYER_IDS.edgesInaccessible]) {
      expect(prop(layer(id), 'paint')['line-color']).toEqual([
        'case',
        closedFilter,
        GRAPH_STATUS_COLORS.closed,
        '#111418',
      ]);
    }
    const band = layer(GRAPH_LAYER_IDS.edgesClosed);
    expect(prop(band, 'paint')['line-pattern']).toBe(HATCH_IMAGE_IDS.line);
    expect(filterOf(band)).toContainEqual(closedFilter);
    const disc = layer(GRAPH_LAYER_IDS.nodesClosed);
    expect(prop(disc, 'layout')['icon-image']).toBe(HATCH_IMAGE_IDS.node);
    expect(prop(disc, 'layout')['icon-allow-overlap']).toBe(true);
    expect(filterOf(disc)).toContainEqual(closedFilter);
  });

  it('node terisolasi bercincin --warn tanpa isi', () => {
    const ring = layer(GRAPH_LAYER_IDS.nodesIsolated);
    expect(prop(ring, 'paint')['circle-stroke-color']).toBe(GRAPH_STATUS_COLORS.isolated);
    expect(prop(ring, 'paint')['circle-opacity']).toBe(0);
    expect(filterOf(ring)).toContainEqual(['==', ['get', 'isolated'], true]);
  });

  it('tanda status digambar di bawah node dan edge yang bisa diklik', () => {
    const order = layers.map((l) => l.id);
    const below = (a: string, b: string) => expect(order.indexOf(a)).toBeLessThan(order.indexOf(b));
    below(GRAPH_LAYER_IDS.edgesClosed, GRAPH_LAYER_IDS.edgesSelected);
    below(GRAPH_LAYER_IDS.edgesSelected, GRAPH_LAYER_IDS.edges);
    below(GRAPH_LAYER_IDS.nodesIsolated, GRAPH_LAYER_IDS.nodes);
    below(GRAPH_LAYER_IDS.nodesClosed, GRAPH_LAYER_IDS.nodes);
  });

  it('sakelar tampil mencakup semua layer node dan edge, tidak pratinjau dan saran', () => {
    const grouped = [...GRAPH_VISIBILITY_GROUPS.nodes, ...GRAPH_VISIBILITY_GROUPS.edges];
    expect(new Set(grouped).size).toBe(grouped.length);
    const rest = Object.values(GRAPH_LAYER_IDS).filter((id) => !grouped.some((g) => g === id));
    expect(rest.sort()).toEqual([
      GRAPH_LAYER_IDS.previewEdges,
      GRAPH_LAYER_IDS.previewNodes,
      GRAPH_LAYER_IDS.suggestionLinks,
      GRAPH_LAYER_IDS.suggestionPoints,
    ]);
    expect(layers.map((l) => l.id).sort()).toEqual(Object.values(GRAPH_LAYER_IDS).sort());
  });
});

describe('graphCollection', () => {
  it('status bawaan tidak tertutup dan tidak terisolasi', () => {
    const collection = graphCollection(
      [{ id: 'n', coordinates: [106.8, -6.2], role: 'path', isolated: true }],
      [{ id: 'e', from: [106.8, -6.2], to: [106.81, -6.2], accessible: false }],
    );
    const props = collection.features.map((f) => f.properties);
    expect(props).toEqual([
      { id: 'e', element: 'edge', accessible: false, closed: false },
      { id: 'n', element: 'node', role: 'path', closed: false, isolated: true },
    ]);
  });
});

describe('gambar arsir', () => {
  it('ubin garis: arsir merah 40% di atas transparan, berulang tanpa sambungan', () => {
    const tile = hatchTile();
    expect(tile.data).toHaveLength(tile.width * tile.height * 4);
    expect(pixel(tile, 0, 0)).toEqual([0xc8, 0x32, 0x1e, 102]);
    expect(pixel(tile, 6, 0)).toEqual([0, 0, 0, 0]);
    const half = tile.width / 2;
    for (let y = 0; y < tile.height; y++) {
      for (let x = 0; x < half; x++) expect(pixel(tile, x + half, y)).toEqual(pixel(tile, x, y));
    }
  });

  it('lingkaran node: cincin merah, isi berarsir di atas putih, luar transparan', () => {
    const disc = hatchDisc(18);
    const size = 18 * HATCH_PIXEL_RATIO;
    expect(disc.width).toBe(size);
    expect(pixel(disc, 0, 0)[3]).toBe(0);
    expect(pixel(disc, size / 2, 1)).toEqual([0xc8, 0x32, 0x1e, 255]);
    const inside = new Set<string>();
    for (let x = 8; x < size - 8; x++) inside.add(pixel(disc, x, size / 2).join());
    expect(inside).toEqual(new Set(['255,255,255,255', '233,173,165,255']));
  });
});

describe('setGraphVisibility', () => {
  it('menyembunyikan node atau edge lewat visibility layer', () => {
    const visibility = new Map<string, unknown>();
    const sources = new Map<string, FeatureCollection>();
    const images = new Set<string>();
    const fake = {
      getSource: (id: string) => sources.get(id),
      addSource: (id: string) => sources.set(id, { type: 'FeatureCollection', features: [] }),
      getStyle: () => ({ layers: [] }),
      addLayer: () => undefined,
      hasImage: (id: string) => images.has(id),
      addImage: (id: string) => images.add(id),
      setLayoutProperty: (id: string, _key: string, value: unknown) => visibility.set(id, value),
    } as unknown as MapLibreMap;

    setGraphVisibility(fake, { nodes: false, edges: true });
    expect(images).toEqual(new Set(Object.values(HATCH_IMAGE_IDS)));
    for (const id of GRAPH_VISIBILITY_GROUPS.nodes) expect(visibility.get(id)).toBe('none');
    for (const id of GRAPH_VISIBILITY_GROUPS.edges) expect(visibility.get(id)).toBe('visible');
  });
});
