import type { Closure, Snapshot, SnapshotPosition } from '@indoor/domain';
import type { RouteClosure } from '@indoor/routing';

/**
 * Penutupan yang sasarannya ada di snapshot. Penutupan dibaca langsung dari server tanpa publish,
 * jadi bisa merujuk fitur, jalur, atau konektor yang belum atau sudah tidak dipublish.
 */
export function knownClosures(snapshot: Snapshot, closures: readonly Closure[]): Closure[] {
  const features = new Set(snapshot.features.features.map((f) => f.id));
  const edges = new Set(snapshot.graph.edges.map((e) => e.id));
  const connectors = new Set(snapshot.graph.connectors.map((c) => c.id));
  return closures.filter(
    (c) =>
      (c.featureId !== null && features.has(c.featureId)) ||
      (c.edgeId !== null && edges.has(c.edgeId)) ||
      (c.connectorId !== null && connectors.has(c.connectorId)),
  );
}

export interface ClosureMarkData {
  areaIds: string[];
  lines: SnapshotPosition[][];
  points: SnapshotPosition[];
}

/** Penanda penutupan di lantai yang digambar. */
export function closureMarks(
  snapshot: Snapshot,
  closures: readonly RouteClosure[],
  floorIds: readonly string[],
): ClosureMarkData {
  const shown = new Set(floorIds);
  const nodes = new Map(snapshot.graph.nodes.map((n) => [n.id, n]));
  const marks: ClosureMarkData = { areaIds: [], lines: [], points: [] };
  for (const closure of closures) {
    if (closure.featureId) marks.areaIds.push(closure.featureId);
    const edge = closure.edgeId
      ? snapshot.graph.edges.find((e) => e.id === closure.edgeId)
      : undefined;
    const from = edge ? nodes.get(edge.from) : undefined;
    const to = edge ? nodes.get(edge.to) : undefined;
    if (edge && from && to && shown.has(edge.floorId)) {
      marks.lines.push([from.coordinates, to.coordinates]);
    }
    const connector = closure.connectorId
      ? snapshot.graph.connectors.find((c) => c.id === closure.connectorId)
      : undefined;
    for (const stop of connector?.stops ?? []) {
      const node = nodes.get(stop.nodeId);
      if (node && shown.has(stop.floorId)) marks.points.push(node.coordinates);
    }
  }
  return marks;
}
