import type { Feature, FeatureCollection } from 'geojson';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { LngLat } from '../georef';
import { ensureHatchImages } from './graph-hatch';
import {
  GRAPH_LAYER_IDS,
  GRAPH_PICK_LAYERS,
  GRAPH_SOURCE_ID,
  GRAPH_VISIBILITY_GROUPS,
  type GraphVisibility,
  graphLayers,
  isEdge,
  isNode,
  PREVIEW_SOURCE_ID,
  SUGGESTION_SOURCE_ID,
} from './graph-style';

export interface GraphNodeView {
  id: string;
  coordinates: LngLat;
  role: string;
  /** Tidak bisa dilewati karena penutupan yang sedang berlaku. */
  closed?: boolean;
  /** Tidak terhubung ke komponen terbesar graf venue. */
  isolated?: boolean;
}

export interface GraphEdgeView {
  id: string;
  from: LngLat;
  to: LngLat;
  accessible: boolean;
  closed?: boolean;
}

export type GraphElement = { kind: 'node' | 'edge'; id: string };

/** Saran sambungan (misalnya titik masuk): dari titik baru ke titik di jalur. */
export interface GraphSuggestionView {
  from: LngLat;
  to: LngLat;
  active: boolean;
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

/** Node dan edge sebagai GeoJSON; properti `element` membedakan keduanya untuk layer dan klik. */
export function graphCollection(
  nodes: readonly GraphNodeView[],
  edges: readonly GraphEdgeView[],
): FeatureCollection {
  const features: Feature[] = [
    ...edges.map(
      (edge): Feature => ({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [edge.from, edge.to] },
        properties: {
          id: edge.id,
          element: 'edge',
          accessible: edge.accessible,
          closed: edge.closed ?? false,
        },
      }),
    ),
    ...nodes.map(
      (node): Feature => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: node.coordinates },
        properties: {
          id: node.id,
          element: 'node',
          role: node.role,
          closed: node.closed ?? false,
          isolated: node.isolated ?? false,
        },
      }),
    ),
  ];
  return { type: 'FeatureCollection', features };
}

/**
 * Source dan layer graf dibuat saat pertama dipakai, di bawah lapisan terra-draw (`td-*`) agar
 * garis yang sedang digambar tetap terlihat di atas jalur yang ada.
 */
function ensureGraphLayers(map: MapLibreMap): void {
  if (map.getSource(GRAPH_SOURCE_ID)) return;
  ensureHatchImages(map);
  map.addSource(GRAPH_SOURCE_ID, { type: 'geojson', data: EMPTY });
  map.addSource(PREVIEW_SOURCE_ID, { type: 'geojson', data: EMPTY });
  map.addSource(SUGGESTION_SOURCE_ID, { type: 'geojson', data: EMPTY });
  const before = map.getStyle().layers.find((layer) => layer.id.startsWith('td-'))?.id;
  for (const layer of graphLayers()) map.addLayer(layer, before);
}

export function setGraphData(
  map: MapLibreMap,
  nodes: readonly GraphNodeView[],
  edges: readonly GraphEdgeView[],
): void {
  ensureGraphLayers(map);
  map.getSource<GeoJSONSource>(GRAPH_SOURCE_ID)?.setData(graphCollection(nodes, edges));
}

/** Sakelar tampil/sembunyi node dan edge; elemen yang disembunyikan juga tidak bisa diklik. */
export function setGraphVisibility(map: MapLibreMap, visibility: GraphVisibility): void {
  ensureGraphLayers(map);
  for (const kind of ['nodes', 'edges'] as const) {
    const value = visibility[kind] ? 'visible' : 'none';
    for (const id of GRAPH_VISIBILITY_GROUPS[kind]) map.setLayoutProperty(id, 'visibility', value);
  }
}

/** Sorotan node atau edge terpilih. */
export function setGraphSelection(map: MapLibreMap, selected: GraphElement | null): void {
  ensureGraphLayers(map);
  const id = (kind: GraphElement['kind']) => (selected?.kind === kind ? selected.id : '');
  map.setFilter(GRAPH_LAYER_IDS.edgesSelected, ['all', isEdge, ['==', ['get', 'id'], id('edge')]]);
  map.setFilter(GRAPH_LAYER_IDS.nodesSelected, ['all', isNode, ['==', ['get', 'id'], id('node')]]);
}

/** Node yang sedang digeser dan edge-nya (garis putus-putus); kosongkan dengan daftar kosong. */
export function setGraphPreview(
  map: MapLibreMap,
  nodes: readonly GraphNodeView[],
  edges: readonly GraphEdgeView[],
): void {
  ensureGraphLayers(map);
  map.getSource<GeoJSONSource>(PREVIEW_SOURCE_ID)?.setData(graphCollection(nodes, edges));
}

/** Saran sambungan di peta; saran aktif (disorot dari daftar) digambar lebih tebal. */
export function setGraphSuggestions(
  map: MapLibreMap,
  suggestions: readonly GraphSuggestionView[],
): void {
  ensureGraphLayers(map);
  const features = suggestions.flatMap((s): Feature[] => [
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [s.from, s.to] },
      properties: { element: 'edge', active: s.active },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: s.from },
      properties: { element: 'node', active: s.active },
    },
  ]);
  map
    .getSource<GeoJSONSource>(SUGGESTION_SOURCE_ID)
    ?.setData({ type: 'FeatureCollection', features });
}

/** Node atau edge graf di bawah titik layar (node didahulukan), atau `null`. */
export function graphElementAt(
  map: MapLibreMap,
  point: { x: number; y: number },
  tolerancePx: number,
): GraphElement | null {
  const layers = GRAPH_PICK_LAYERS.filter((layer) => map.getLayer(layer));
  if (!layers.length) return null;
  const hits = map.queryRenderedFeatures(
    [
      [point.x - tolerancePx, point.y - tolerancePx],
      [point.x + tolerancePx, point.y + tolerancePx],
    ],
    { layers },
  );
  const node = hits.find((hit) => hit.properties?.element === 'node');
  const hit = node ?? hits.find((h) => h.properties?.element === 'edge');
  const id = hit?.properties?.id;
  if (typeof id !== 'string') return null;
  return { kind: node ? 'node' : 'edge', id };
}
