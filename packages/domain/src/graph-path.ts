import type { Position } from './geometry';
import {
  along,
  crossing,
  Draft,
  distance,
  EMPTY_PATCH,
  type GraphPatch,
  lerp,
  NODE_MERGE_DISTANCE_M,
  nearestNode,
  type Plane,
  planeAt,
  round,
  splitAt,
  type XY,
} from './graph-draft';
import type { NavEdge, NavGraph } from './nav-graph';

/** Node untuk satu titik garis: node terdekat, titik di edge terdekat (edge dipotong), atau node baru. */
function resolveVertex(
  draft: Draft,
  plane: Plane,
  floorId: string,
  vertex: Position,
  newId: () => string,
): string {
  const p = plane.toXY(vertex);
  const node = nearestNode(draft, plane, floorId, p, null);
  if (node) return node.id;
  let best: { edge: NavEdge; point: XY; d: number } | null = null;
  for (const edge of draft.edges.values()) {
    const a = draft.nodes.get(edge.from);
    const b = draft.nodes.get(edge.to);
    if (edge.floorId !== floorId || !a || !b) continue;
    const pa = plane.toXY(a.coordinates);
    const pb = plane.toXY(b.coordinates);
    const point = lerp(pa, pb, Math.min(1, Math.max(0, along(p, pa, pb))));
    const d = distance(point, p);
    if (d <= NODE_MERGE_DISTANCE_M && (!best || d < best.d)) best = { edge, point, d };
  }
  if (best) return splitAt(draft, best.edge, plane.toPosition(best.point), newId);
  const id = newId();
  draft.putNode({ id, floorId, coordinates: round(vertex), role: 'path', featureId: null });
  return id;
}

interface Waypoint {
  t: number;
  point: XY;
  nodeId?: string;
  edge?: NavEdge;
}

/**
 * Menyambung node a dan b dengan garis lurus: node yang dilewati garis menjadi titik singgah, edge
 * yang dipotong garis dipecah di titik potongnya, lalu edge dibuat antar-titik berurutan (tanpa
 * edge kembar).
 */
function connect(
  draft: Draft,
  plane: Plane,
  floorId: string,
  aId: string,
  bId: string,
  newId: () => string,
) {
  const a = draft.nodes.get(aId);
  const b = draft.nodes.get(bId);
  if (!a || !b) return;
  const pa = plane.toXY(a.coordinates);
  const pb = plane.toXY(b.coordinates);
  const length = distance(pa, pb);
  const inside = (t: number) =>
    t * length > NODE_MERGE_DISTANCE_M && (1 - t) * length > NODE_MERGE_DISTANCE_M;

  const waypoints: Waypoint[] = [];
  for (const node of draft.nodes.values()) {
    if (node.floorId !== floorId || node.id === aId || node.id === bId) continue;
    const p = plane.toXY(node.coordinates);
    const t = along(p, pa, pb);
    if (inside(t) && distance(p, lerp(pa, pb, t)) <= NODE_MERGE_DISTANCE_M) {
      waypoints.push({ t, point: p, nodeId: node.id });
    }
  }
  const touched = new Set([aId, bId, ...waypoints.map((w) => w.nodeId)]);
  for (const edge of draft.edges.values()) {
    if (edge.floorId !== floorId || touched.has(edge.from) || touched.has(edge.to)) continue;
    const c = draft.nodes.get(edge.from);
    const d = draft.nodes.get(edge.to);
    if (!c || !d) continue;
    const pc = plane.toXY(c.coordinates);
    const pd = plane.toXY(d.coordinates);
    const hit = crossing(pa, pb, pc, pd);
    const edgeLength = distance(pc, pd);
    if (!hit || !inside(hit.t)) continue;
    if (hit.u * edgeLength <= NODE_MERGE_DISTANCE_M) continue;
    if ((1 - hit.u) * edgeLength <= NODE_MERGE_DISTANCE_M) continue;
    waypoints.push({ t: hit.t, point: lerp(pa, pb, hit.t), edge });
  }
  waypoints.sort((x, y) => x.t - y.t);

  const chain = [aId];
  let previous: Waypoint | null = null;
  for (const waypoint of waypoints) {
    // Dua potongan di titik yang sama (edge lama yang saling silang tanpa node) memakai satu node.
    const shared =
      previous && distance(previous.point, waypoint.point) <= NODE_MERGE_DISTANCE_M
        ? chain.at(-1)
        : undefined;
    const id =
      waypoint.nodeId ??
      (waypoint.edge
        ? splitAt(draft, waypoint.edge, plane.toPosition(waypoint.point), newId, shared)
        : undefined);
    if (id && chain.at(-1) !== id) chain.push(id);
    previous = waypoint;
  }
  if (chain.at(-1) !== bId) chain.push(bId);
  for (let i = 0; i + 1 < chain.length; i++) {
    const from = chain[i] ?? '';
    const to = chain[i + 1] ?? '';
    if (draft.edgeBetween(from, to)) continue;
    draft.putEdge({ id: newId(), floorId, from, to, lengthM: 0, accessible: true });
  }
}

export interface PathOptions {
  floorId: string;
  /** Pembuat id baru (UUID di aplikasi). */
  newId: () => string;
}

/**
 * Garis jalur baru di satu lantai: node di setiap titik garis (menyambung ke node atau edge yang
 * berjarak < 0,5 m), node di setiap persimpangan dengan edge lain yang lalu dipecah, dan edge di
 * antaranya dengan panjang dalam meter. Garis yang menyusut ke satu titik tidak mengubah apa pun.
 */
export function addPath(
  graph: NavGraph,
  line: readonly Position[],
  options: PathOptions,
): GraphPatch {
  const first = line[0];
  if (!first) return EMPTY_PATCH;
  const draft = new Draft(graph);
  const plane = planeAt(first);
  const chain: string[] = [];
  for (const vertex of line) {
    const id = resolveVertex(draft, plane, options.floorId, vertex, options.newId);
    if (chain.at(-1) !== id) chain.push(id);
  }
  if (new Set(chain).size < 2) return EMPTY_PATCH;
  for (let i = 0; i + 1 < chain.length; i++) {
    connect(draft, plane, options.floorId, chain[i] ?? '', chain[i + 1] ?? '', options.newId);
  }
  return draft.patch();
}
