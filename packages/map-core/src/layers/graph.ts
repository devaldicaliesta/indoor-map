import type { Feature, FeatureCollection } from 'geojson';
import type {
  ExpressionSpecification,
  GeoJSONSource,
  LayerSpecification,
  Map as MapLibreMap,
} from 'maplibre-gl';
import { EDIT_COLORS } from '../defaults';
import type { LngLat } from '../georef';

export const GRAPH_SOURCE_ID = 'nav-graph';
const PREVIEW_SOURCE_ID = 'nav-graph-preview';
const SUGGESTION_SOURCE_ID = 'nav-graph-suggestions';

export const GRAPH_LAYER_IDS = {
  edgesSelected: 'nav-graph-edges-selected',
  edges: 'nav-graph-edges',
  nodes: 'nav-graph-nodes',
  nodesSelected: 'nav-graph-nodes-selected',
  previewEdges: 'nav-graph-preview-edges',
  previewNodes: 'nav-graph-preview-nodes',
  suggestionLinks: 'nav-graph-suggestion-links',
  suggestionPoints: 'nav-graph-suggestion-points',
} as const;

/** Layer graf yang bisa diklik, urut prioritas: node lebih dulu dari edge. */
export const GRAPH_PICK_LAYERS = [GRAPH_LAYER_IDS.nodes, GRAPH_LAYER_IDS.edges] as const;

export interface GraphNodeView {
  id: string;
  coordinates: LngLat;
  role: string;
}

export interface GraphEdgeView {
  id: string;
  from: LngLat;
  to: LngLat;
  accessible: boolean;
}

export type GraphElement = { kind: 'node' | 'edge'; id: string };

/** Saran sambungan (misalnya titik masuk): dari titik baru ke titik di jalur. */
export interface GraphSuggestionView {
  from: LngLat;
  to: LngLat;
  active: boolean;
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };
const isNode: ExpressionSpecification = ['==', ['get', 'element'], 'node'];
const isEdge: ExpressionSpecification = ['==', ['get', 'element'], 'edge'];

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
        properties: { id: edge.id, element: 'edge', accessible: edge.accessible },
      }),
    ),
    ...nodes.map(
      (node): Feature => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: node.coordinates },
        properties: { id: node.id, element: 'node', role: node.role },
      }),
    ),
  ];
  return { type: 'FeatureCollection', features };
}

function graphLayers(): LayerSpecification[] {
  const { signal, ink, paper } = EDIT_COLORS;
  return [
    {
      id: GRAPH_LAYER_IDS.edgesSelected,
      type: 'line',
      source: GRAPH_SOURCE_ID,
      filter: ['all', isEdge, ['==', ['get', 'id'], '']],
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': signal, 'line-width': 8 },
    },
    {
      id: GRAPH_LAYER_IDS.edges,
      type: 'line',
      source: GRAPH_SOURCE_ID,
      filter: isEdge,
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': ink, 'line-width': 2 },
    },
    {
      id: GRAPH_LAYER_IDS.nodes,
      type: 'circle',
      source: GRAPH_SOURCE_ID,
      filter: isNode,
      paint: {
        // Node jalur putih; titik masuk dan node berperan lain diisi agar mudah dibedakan.
        'circle-radius': 4,
        'circle-color': ['match', ['get', 'role'], 'path', paper, 'entrance', signal, ink],
        'circle-stroke-color': ink,
        'circle-stroke-width': 1.5,
      },
    },
    {
      id: GRAPH_LAYER_IDS.nodesSelected,
      type: 'circle',
      source: GRAPH_SOURCE_ID,
      filter: ['all', isNode, ['==', ['get', 'id'], '']],
      paint: {
        'circle-radius': 6,
        'circle-color': signal,
        'circle-stroke-color': ink,
        'circle-stroke-width': 2,
      },
    },
    {
      id: GRAPH_LAYER_IDS.previewEdges,
      type: 'line',
      source: PREVIEW_SOURCE_ID,
      filter: isEdge,
      paint: { 'line-color': ink, 'line-width': 2, 'line-dasharray': [2, 1] },
    },
    {
      id: GRAPH_LAYER_IDS.previewNodes,
      type: 'circle',
      source: PREVIEW_SOURCE_ID,
      filter: isNode,
      paint: {
        'circle-radius': 6,
        'circle-color': signal,
        'circle-stroke-color': ink,
        'circle-stroke-width': 2,
      },
    },
    {
      id: GRAPH_LAYER_IDS.suggestionLinks,
      type: 'line',
      source: SUGGESTION_SOURCE_ID,
      filter: isEdge,
      paint: {
        'line-color': ink,
        'line-width': ['case', ['get', 'active'], 3, 1.5],
        'line-dasharray': [2, 1],
      },
    },
    {
      id: GRAPH_LAYER_IDS.suggestionPoints,
      type: 'circle',
      source: SUGGESTION_SOURCE_ID,
      filter: isNode,
      paint: {
        'circle-radius': ['case', ['get', 'active'], 7, 4],
        'circle-color': signal,
        'circle-stroke-color': ink,
        'circle-stroke-width': 1.5,
      },
    },
  ];
}

/**
 * Source dan layer graf dibuat saat pertama dipakai, di bawah lapisan terra-draw (`td-*`) agar
 * garis yang sedang digambar tetap terlihat di atas jalur yang ada.
 */
function ensureGraphLayers(map: MapLibreMap): void {
  if (map.getSource(GRAPH_SOURCE_ID)) return;
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
