import type { Geometry, NavGraph } from '@indoor/domain';
import { activeClosures, insidePolygon, type RouteClosure } from './options';

/** Fitur lantai; poligonnya dipakai penutupan area. */
export interface ClosureFeature {
  id: string;
  floorId: string;
  geometry: Geometry;
}

export interface ClosedElementsOptions {
  /** Waktu acuan penutupan, disuntikkan pemanggil seperti pada `findRoute`. */
  now: Date | number;
  features?: readonly ClosureFeature[];
  connectors?: readonly { id: string; stops: readonly { nodeId: string }[] }[];
}

export interface ClosedElements {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

function polygonsOf(geometry: Geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  return geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
}

/** Titik masuk fitur dan node di dalam poligonnya pada lantai yang sama, seperti `closedFeatureNodes`. */
function featureNodeIds(graph: NavGraph, featureId: string, feature: ClosureFeature | undefined) {
  const polygons = feature ? polygonsOf(feature.geometry) : [];
  return Object.values(graph.nodes)
    .filter(
      (node) =>
        node.featureId === featureId ||
        (node.floorId === feature?.floorId &&
          polygons.some((rings) => insidePolygon(rings, node.coordinates[0], node.coordinates[1]))),
    )
    .map((node) => node.id);
}

/**
 * Node dan edge graf draft yang tidak bisa dilewati karena penutupan yang berlaku, dengan aturan
 * `findRoute`: penutupan fitur menutup titik masuk dan node di dalam poligonnya beserta setiap edge
 * yang menyentuhnya, penutupan edge menutup edge itu, dan penutupan konektor hanya menutup
 * perpindahan lantainya (ditandai pada node pemberhentian; edge di sekitarnya tetap bisa dilewati).
 */
export function closedElements(
  graph: NavGraph,
  closures: readonly RouteClosure[],
  options: ClosedElementsOptions,
): ClosedElements {
  const features = new Map((options.features ?? []).map((f) => [f.id, f]));
  const stops = new Map((options.connectors ?? []).map((c) => [c.id, c.stops]));
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const blocked = new Set<string>();
  for (const closure of activeClosures(closures, options.now)) {
    if (closure.edgeId && graph.edges[closure.edgeId]) edgeIds.add(closure.edgeId);
    for (const stop of stops.get(closure.connectorId ?? '') ?? []) {
      if (graph.nodes[stop.nodeId]) nodeIds.add(stop.nodeId);
    }
    if (closure.featureId) {
      const feature = features.get(closure.featureId);
      for (const id of featureNodeIds(graph, closure.featureId, feature)) blocked.add(id);
    }
  }
  for (const id of blocked) nodeIds.add(id);
  for (const edge of Object.values(graph.edges)) {
    if (blocked.has(edge.from) || blocked.has(edge.to)) edgeIds.add(edge.id);
  }
  return { nodeIds, edgeIds };
}
