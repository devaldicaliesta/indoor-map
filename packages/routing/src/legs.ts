import type { SnapshotPosition } from '@indoor/domain';
import type { SearchResult } from './astar';
import type { ResolvedEnd } from './endpoints';
import { ARC_CONNECTOR, type RouteGraph } from './graph';
import type { RouteLeg, RouteSuccess, WalkLeg } from './types';

const position = (graph: RouteGraph, node: number): SnapshotPosition => [
  graph.lng[node] ?? 0,
  graph.lat[node] ?? 0,
];

const floorOf = (graph: RouteGraph, node: number) => graph.floorIds[graph.floor[node] ?? 0] ?? '';

function walk(graph: RouteGraph, node: number): WalkLeg {
  return {
    kind: 'walk',
    floorId: floorOf(graph, node),
    coordinates: [position(graph, node)],
    nodeIds: [graph.nodeIds[node] ?? ''],
    distanceM: 0,
  };
}

/**
 * Hasil rute dari arc hasil A*: bagian berjalan per lantai dan perpindahan konektor, dengan
 * potongan dari/ke titik bebas di kedua ujung.
 */
export function routeFromSearch(
  graph: RouteGraph,
  search: SearchResult,
  from: ResolvedEnd,
  to: ResolvedEnd,
): RouteSuccess {
  const start = from.entries[search.seed];
  const end = to.entries[search.goal];
  const startNode = start?.node ?? 0;
  const legs: RouteLeg[] = [];
  const path = [graph.nodeIds[startNode] ?? ''];
  let current = walk(graph, startNode);
  if (from.snap) {
    current.coordinates.unshift(from.snap.point, from.snap.projection);
    current.distanceM += start?.cost ?? 0;
  }

  for (const arc of search.arcs) {
    const u = graph.arcFrom[arc] ?? 0;
    const v = graph.arcTo[arc] ?? 0;
    path.push(graph.nodeIds[v] ?? '');
    if ((graph.arcFlags[arc] ?? 0) & ARC_CONNECTOR) {
      legs.push(current);
      const connector = graph.arcSource[arc] ?? 0;
      legs.push({
        kind: 'connector',
        connectorId: graph.connectorIds[connector] ?? '',
        connectorKind: graph.connectorKinds[connector] ?? 'stairs',
        fromFloorId: floorOf(graph, u),
        toFloorId: floorOf(graph, v),
        fromNodeId: graph.nodeIds[u] ?? '',
        toNodeId: graph.nodeIds[v] ?? '',
        costM: graph.arcCost[arc] ?? 0,
      });
      current = walk(graph, v);
    } else {
      current.coordinates.push(position(graph, v));
      current.nodeIds.push(graph.nodeIds[v] ?? '');
      current.distanceM += graph.arcLength[arc] ?? 0;
    }
  }
  if (to.snap) {
    current.coordinates.push(to.snap.projection, to.snap.point);
    current.distanceM += end?.cost ?? 0;
  }
  legs.push(current);
  return {
    ok: true,
    path,
    legs,
    distanceM: legs.reduce((sum, leg) => sum + (leg.kind === 'walk' ? leg.distanceM : 0), 0),
    costM: search.cost,
  };
}

/** Rute langsung di sepanjang satu edge, untuk asal dan tujuan yang menempel di edge yang sama. */
export function directRoute(
  graph: RouteGraph,
  from: ResolvedEnd,
  to: ResolvedEnd,
  cost: number,
): RouteSuccess {
  const a = graph.edgeFrom[from.snap?.edge ?? 0] ?? 0;
  const coordinates = [from.snap, to.snap].flatMap((snap, i) =>
    !snap ? [] : i === 0 ? [snap.point, snap.projection] : [snap.projection, snap.point],
  );
  return {
    ok: true,
    path: [],
    legs: [{ kind: 'walk', floorId: floorOf(graph, a), coordinates, nodeIds: [], distanceM: cost }],
    distanceM: cost,
    costM: cost,
  };
}
