import type { NavGraph, NavNodeRole } from '@indoor/domain';
import type { GraphEdgeView, GraphNodeView, LngLat } from '@indoor/map-core';
import type { GraphStatus } from './graph-status';

const NO_STATUS: GraphStatus = {
  isolated: new Set(),
  closedNodes: new Set(),
  closedEdges: new Set(),
};

/** Node dan edge graf dalam bentuk yang digambar map-core; edge tanpa node dilewati. */
export function graphViews(
  graph: NavGraph,
  status: GraphStatus = NO_STATUS,
): { nodes: GraphNodeView[]; edges: GraphEdgeView[] } {
  const nodes = Object.values(graph.nodes).map((node) => ({
    id: node.id,
    coordinates: node.coordinates as LngLat,
    role: node.role,
    closed: status.closedNodes.has(node.id),
    isolated: status.isolated.has(node.id),
  }));
  const edges = Object.values(graph.edges).flatMap((edge) => {
    const from = graph.nodes[edge.from];
    const to = graph.nodes[edge.to];
    return from && to
      ? [
          {
            id: edge.id,
            from: from.coordinates as LngLat,
            to: to.coordinates as LngLat,
            accessible: edge.accessible,
            closed: status.closedEdges.has(edge.id),
          },
        ]
      : [];
  });
  return { nodes, edges };
}

/**
 * Graf sebagai fitur GeoJSON untuk indeks snapping alat Jalur: node sebagai titik dan edge sebagai
 * garis, sehingga garis baru menempel ke node dan edge yang ada.
 */
export function graphSnapFeatures(graph: NavGraph) {
  const { nodes, edges } = graphViews(graph);
  return [
    ...nodes.map((node) => ({
      geometry: { type: 'Point' as const, coordinates: node.coordinates },
      properties: { id: node.id },
    })),
    ...edges.map((edge) => ({
      geometry: { type: 'LineString' as const, coordinates: [edge.from, edge.to] },
      properties: { id: edge.id },
    })),
  ];
}

/** Ujung lain setiap edge sebuah node. */
export function neighbourPositions(graph: NavGraph, nodeId: string): LngLat[] {
  return Object.values(graph.edges).flatMap((edge) => {
    const other = edge.from === nodeId ? edge.to : edge.to === nodeId ? edge.from : null;
    const node = other ? graph.nodes[other] : undefined;
    return node ? [node.coordinates as LngLat] : [];
  });
}

export const NODE_ROLE_LABELS: Record<NavNodeRole, string> = {
  path: 'Node jalur',
  entrance: 'Titik masuk',
  origin: 'Titik asal QR',
  info_point: 'Info Point',
  connector: 'Pemberhentian konektor',
};
