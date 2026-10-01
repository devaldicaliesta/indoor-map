import type { Position } from './geometry';
import {
  along,
  anchored,
  Draft,
  distance,
  EMPTY_PATCH,
  type GraphPatch,
  lerp,
  NODE_MERGE_DISTANCE_M,
  nearestNode,
  planeAt,
  rank,
  round,
  splitAt,
} from './graph-draft';
import type { NavGraph } from './nav-graph';

export {
  applyGraphPatch,
  type GraphChange,
  type GraphPatch,
  NODE_MERGE_DISTANCE_M,
} from './graph-draft';
export { addPath, type PathOptions } from './graph-path';

/** Node `source` digabung ke `target`; `false` bila keduanya tidak boleh digabung. */
function mergeInto(draft: Draft, targetId: string, sourceId: string): boolean {
  const target = draft.nodes.get(targetId);
  const source = draft.nodes.get(sourceId);
  if (!target || !source || targetId === sourceId || target.floorId !== source.floorId) {
    return false;
  }
  const targetRank = rank(target);
  const sourceRank = rank(source);
  if (targetRank === 2 && sourceRank === 2) return false;
  if (targetRank === 1 && sourceRank === 1 && target.featureId !== source.featureId) return false;
  // Node berperan (titik masuk, konektor) yang bertahan, di posisi node sasaran.
  const keep = sourceRank > targetRank ? source : target;
  const gone = keep === target ? source : target;
  draft.putNode({ ...keep, coordinates: target.coordinates });
  for (const edge of draft.edgesAt(gone.id)) {
    const from = edge.from === gone.id ? keep.id : edge.from;
    const to = edge.to === gone.id ? keep.id : edge.to;
    const existing = from === to ? undefined : draft.edgeBetween(from, to);
    draft.dropEdge(edge.id);
    if (from === to) continue;
    if (existing) {
      draft.putEdge({ ...existing, accessible: existing.accessible || edge.accessible });
      continue;
    }
    draft.putEdge({ ...edge, from, to });
  }
  draft.dropNode(gone.id);
  for (const edge of draft.edgesAt(keep.id)) draft.putEdge(edge);
  return true;
}

/** Gabungkan `source` ke `target` (yang tetap di tempatnya); `null` bila tidak boleh. */
export function mergeNodes(graph: NavGraph, targetId: string, sourceId: string): GraphPatch | null {
  const draft = new Draft(graph);
  return mergeInto(draft, targetId, sourceId) ? draft.patch() : null;
}

/**
 * Pindahkan node; edge-nya ikut dan panjangnya dihitung ulang. Dilepas < 0,5 m dari node lain di
 * lantai yang sama: keduanya digabung bila boleh.
 */
export function moveNode(graph: NavGraph, nodeId: string, to: Position): GraphPatch {
  const draft = new Draft(graph);
  const node = draft.nodes.get(nodeId);
  if (!node) return EMPTY_PATCH;
  const plane = planeAt(to);
  const near = nearestNode(draft, plane, node.floorId, plane.toXY(to), nodeId);
  draft.putNode({ ...node, coordinates: round(to) });
  for (const edge of draft.edgesAt(nodeId)) draft.putEdge(edge);
  if (near) mergeInto(draft, near.id, nodeId);
  return draft.patch();
}

/**
 * Hapus node. Node dengan tepat dua edge dilepas dari jalurnya: kedua tetangganya disambung
 * langsung (memakai id edge pertama), seperti menghapus titik belok garis. Node lain dihapus
 * bersama edge-nya. `null` untuk node yang dirujuk konektor, titik asal, atau Info Point.
 */
export function removeNode(graph: NavGraph, nodeId: string): GraphPatch | null {
  const draft = new Draft(graph);
  const node = draft.nodes.get(nodeId);
  if (!node || anchored(node)) return null;
  const edges = draft.edgesAt(nodeId);
  const neighbours = edges.map((e) => (e.from === nodeId ? e.to : e.from));
  const [first, second] = edges;
  const [left, right] = neighbours;
  if (
    edges.length === 2 &&
    first &&
    second &&
    left &&
    right &&
    left !== right &&
    !draft.edgeBetween(left, right)
  ) {
    draft.dropEdge(second.id);
    draft.dropNode(nodeId);
    draft.putEdge({
      ...first,
      from: left,
      to: right,
      accessible: first.accessible && second.accessible,
    });
    return draft.patch();
  }
  for (const edge of edges) draft.dropEdge(edge.id);
  draft.dropNode(nodeId);
  for (const id of neighbours) draft.dropIfStray(id);
  return draft.patch();
}

/** Hapus edge; node jalur di ujungnya yang tidak lagi punya edge ikut dihapus. */
export function removeEdge(graph: NavGraph, edgeId: string): GraphPatch {
  const draft = new Draft(graph);
  const edge = draft.edges.get(edgeId);
  if (!edge) return EMPTY_PATCH;
  draft.dropEdge(edgeId);
  draft.dropIfStray(edge.from);
  draft.dropIfStray(edge.to);
  return draft.patch();
}

/**
 * Pisah edge dengan node baru di titik terdekat ke `at` (tanpa `at`: di tengah). `null` bila titik
 * itu < 0,5 m dari ujung edge.
 */
export function splitEdge(
  graph: NavGraph,
  edgeId: string,
  at: Position | null,
  newId: () => string,
): GraphPatch | null {
  const draft = new Draft(graph);
  const edge = draft.edges.get(edgeId);
  const a = edge ? draft.nodes.get(edge.from) : undefined;
  const b = edge ? draft.nodes.get(edge.to) : undefined;
  if (!edge || !a || !b) return null;
  const plane = planeAt(a.coordinates);
  const pa = plane.toXY(a.coordinates);
  const pb = plane.toXY(b.coordinates);
  const t = at ? Math.min(1, Math.max(0, along(plane.toXY(at), pa, pb))) : 0.5;
  const length = distance(pa, pb);
  if (t * length < NODE_MERGE_DISTANCE_M || (1 - t) * length < NODE_MERGE_DISTANCE_M) return null;
  splitAt(draft, edge, plane.toPosition(lerp(pa, pb, t)), newId);
  return draft.patch();
}
