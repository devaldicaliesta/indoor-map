import type { ExpressionSpecification, LayerSpecification } from 'maplibre-gl';
import { EDIT_COLORS } from '../defaults';
import { CLOSED_NODE_DIAMETER, HATCH_IMAGE_IDS } from './graph-hatch';

export const GRAPH_SOURCE_ID = 'nav-graph';
export const PREVIEW_SOURCE_ID = 'nav-graph-preview';
export const SUGGESTION_SOURCE_ID = 'nav-graph-suggestions';

export const GRAPH_LAYER_IDS = {
  edgesClosed: 'nav-graph-edges-closed',
  edgesSelected: 'nav-graph-edges-selected',
  edges: 'nav-graph-edges',
  edgesInaccessible: 'nav-graph-edges-inaccessible',
  nodesIsolated: 'nav-graph-nodes-isolated',
  nodesClosed: 'nav-graph-nodes-closed',
  nodes: 'nav-graph-nodes',
  nodesSelected: 'nav-graph-nodes-selected',
  previewEdges: 'nav-graph-preview-edges',
  previewNodes: 'nav-graph-preview-nodes',
  suggestionLinks: 'nav-graph-suggestion-links',
  suggestionPoints: 'nav-graph-suggestion-points',
} as const;

/** Layer graf yang bisa diklik, urut prioritas: node lebih dulu dari edge. */
export const GRAPH_PICK_LAYERS = [
  GRAPH_LAYER_IDS.nodes,
  GRAPH_LAYER_IDS.edges,
  GRAPH_LAYER_IDS.edgesInaccessible,
] as const;

/** Layer per jenis elemen untuk sakelar tampil/sembunyi; pratinjau dan saran tidak ikut. */
export const GRAPH_VISIBILITY_GROUPS = {
  nodes: [
    GRAPH_LAYER_IDS.nodesIsolated,
    GRAPH_LAYER_IDS.nodesClosed,
    GRAPH_LAYER_IDS.nodes,
    GRAPH_LAYER_IDS.nodesSelected,
  ],
  edges: [
    GRAPH_LAYER_IDS.edgesClosed,
    GRAPH_LAYER_IDS.edgesSelected,
    GRAPH_LAYER_IDS.edges,
    GRAPH_LAYER_IDS.edgesInaccessible,
  ],
} as const;

export type GraphVisibility = Record<keyof typeof GRAPH_VISIBILITY_GROUPS, boolean>;

/** Warna status graf: token --danger (tertutup) dan --warn (terisolasi). */
export const GRAPH_STATUS_COLORS = { closed: '#c8321e', isolated: '#b26a00' } as const;

export const isNode: ExpressionSpecification = ['==', ['get', 'element'], 'node'];
export const isEdge: ExpressionSpecification = ['==', ['get', 'element'], 'edge'];
const isClosed: ExpressionSpecification = ['==', ['get', 'closed'], true];
const isAccessible: ExpressionSpecification = ['==', ['get', 'accessible'], true];

/**
 * Gaya graf: edge tidak aksesibel putus-putus; edge tertutup merah di atas pita arsir, node
 * tertutup di atas lingkaran berarsir; node terisolasi bercincin. Status dibedakan bentuk, bukan
 * warna saja.
 */
export function graphLayers(): LayerSpecification[] {
  const { signal, ink, paper } = EDIT_COLORS;
  const edgeColor: ExpressionSpecification = ['case', isClosed, GRAPH_STATUS_COLORS.closed, ink];
  return [
    {
      id: GRAPH_LAYER_IDS.edgesClosed,
      type: 'line',
      source: GRAPH_SOURCE_ID,
      filter: ['all', isEdge, isClosed],
      paint: { 'line-pattern': HATCH_IMAGE_IDS.line, 'line-width': 12 },
    },
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
      filter: ['all', isEdge, isAccessible],
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': edgeColor, 'line-width': 2 },
    },
    {
      id: GRAPH_LAYER_IDS.edgesInaccessible,
      type: 'line',
      source: GRAPH_SOURCE_ID,
      filter: ['all', isEdge, ['!', isAccessible]],
      paint: { 'line-color': edgeColor, 'line-width': 2, 'line-dasharray': [3, 2] },
    },
    {
      id: GRAPH_LAYER_IDS.nodesIsolated,
      type: 'circle',
      source: GRAPH_SOURCE_ID,
      filter: ['all', isNode, ['==', ['get', 'isolated'], true]],
      paint: {
        // Di luar lingkaran node tertutup agar kedua tanda tetap terbaca bila berlaku bersamaan.
        'circle-radius': CLOSED_NODE_DIAMETER / 2 + 2,
        'circle-opacity': 0,
        'circle-stroke-color': GRAPH_STATUS_COLORS.isolated,
        'circle-stroke-width': 2.5,
      },
    },
    {
      id: GRAPH_LAYER_IDS.nodesClosed,
      type: 'symbol',
      source: GRAPH_SOURCE_ID,
      filter: ['all', isNode, isClosed],
      layout: {
        'icon-image': HATCH_IMAGE_IDS.node,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
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
