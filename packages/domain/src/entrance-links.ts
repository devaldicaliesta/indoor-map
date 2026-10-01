import type { Geometry, Position } from './geometry';
import {
  along,
  type Draft,
  distance,
  lerp,
  NODE_MERGE_DISTANCE_M,
  type Plane,
  splitAt,
  type XY,
} from './graph-draft';
import type { NavEdge } from './nav-graph';

/*
 * Geometri tepi unit di bidang datar lokal dan penyambungan titik masuk ke graf, dipakai
 * `entrances.ts`.
 */

export type Segment = readonly [XY, XY];

export function ringsOf(geometry: Geometry): Position[][] {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  return [];
}

export function firstPosition(geometry: Geometry): Position | undefined {
  if (geometry.type === 'Point') return geometry.coordinates;
  if (geometry.type === 'LineString') return geometry.coordinates[0];
  return ringsOf(geometry)[0]?.[0];
}

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const onSegment = (p: XY, [a, b]: Segment): XY => lerp(a, b, clamp01(along(p, a, b)));

/** Titik terdekat di antara dua ruas (Ericson, Real-Time Collision Detection §5.1.9). */
export function closestBetween([p1, q1]: Segment, [p2, q2]: Segment): { a: XY; b: XY; d: number } {
  const d1: XY = [q1[0] - p1[0], q1[1] - p1[1]];
  const d2: XY = [q2[0] - p2[0], q2[1] - p2[1]];
  const r: XY = [p1[0] - p2[0], p1[1] - p2[1]];
  const aa = d1[0] * d1[0] + d1[1] * d1[1];
  const ee = d2[0] * d2[0] + d2[1] * d2[1];
  const ff = d2[0] * r[0] + d2[1] * r[1];
  let s = 0;
  let t = 0;
  if (aa <= 1e-12 && ee <= 1e-12) {
    s = 0;
    t = 0;
  } else if (aa <= 1e-12) {
    t = clamp01(ff / ee);
  } else {
    const c = d1[0] * r[0] + d1[1] * r[1];
    if (ee <= 1e-12) {
      s = clamp01(-c / aa);
    } else {
      const b = d1[0] * d2[0] + d1[1] * d2[1];
      const denominator = aa * ee - b * b;
      if (denominator > 1e-9 * aa * ee) s = clamp01((b * ff - c * ee) / denominator);
      else {
        // Ruas sejajar: titik tengah bagian yang bertumpang-tindih, bukan ujung ruas, agar titik
        // masuk unit tanpa pintu jatuh di tengah sisi yang menghadap jalur.
        const from = along(p2, p1, q1);
        const to = along(q2, p1, q1);
        const lo = Math.max(0, Math.min(from, to));
        const hi = Math.min(1, Math.max(from, to));
        s = lo <= hi ? (lo + hi) / 2 : 0;
      }
      t = (b * s + ff) / ee;
      if (t < 0) {
        t = 0;
        s = clamp01(-c / aa);
      } else if (t > 1) {
        t = 1;
        s = clamp01((b - c) / aa);
      }
    }
  }
  const a = lerp(p1, q1, s);
  const bPoint = lerp(p2, q2, t);
  return { a, b: bPoint, d: distance(a, bPoint) };
}

/** Ray casting genap-ganjil atas semua cincin (lubang ikut dihitung). */
export function inside(rings: readonly (readonly XY[])[], p: XY): boolean {
  let result = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i] ?? [0, 0];
      const [xj, yj] = ring[j] ?? [0, 0];
      if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
        result = !result;
      }
    }
  }
  return result;
}

export interface Outline {
  rings: XY[][];
  segments: Segment[];
}

export function outlineOf(geometry: Geometry, plane: Plane): Outline {
  const rings = ringsOf(geometry).map((ring) => ring.map((p) => plane.toXY(p)));
  const segments = rings.flatMap((ring) => ring.slice(1).map((b, i): Segment => [ring[i] ?? b, b]));
  return { rings, segments };
}

export function nearestOnOutline(outline: Outline, p: XY): { point: XY; d: number } | null {
  let best: { point: XY; d: number } | null = null;
  for (const segment of outline.segments) {
    const point = onSegment(p, segment);
    const d = distance(point, p);
    if (!best || d < best.d) best = { point, d };
  }
  return best;
}

/**
 * Bagian graf yang boleh disambung titik masuk: node dan edge jalur, tanpa titik masuk lain dan
 * edge buntu yang menuju titik masuk itu.
 */
export interface LinkTargets {
  nodes: { id: string; p: XY }[];
  edges: { edge: NavEdge; segment: Segment }[];
}

export function linkTargets(draft: Draft, plane: Plane, floorId: string): LinkTargets {
  const deadEnd = (id: string) =>
    draft.nodes.get(id)?.role === 'entrance' && draft.edgesAt(id).length <= 1;
  const nodes = [...draft.nodes.values()]
    .filter((node) => node.floorId === floorId && node.role !== 'entrance')
    .map((node) => ({ id: node.id, p: plane.toXY(node.coordinates) }));
  const edges = [...draft.edges.values()].flatMap((edge) => {
    const a = draft.nodes.get(edge.from);
    const b = draft.nodes.get(edge.to);
    if (edge.floorId !== floorId || !a || !b || deadEnd(edge.from) || deadEnd(edge.to)) return [];
    return [{ edge, segment: [plane.toXY(a.coordinates), plane.toXY(b.coordinates)] as Segment }];
  });
  return { nodes, edges };
}

export function nearestOnGraph(targets: LinkTargets, p: XY): { point: XY; d: number } | null {
  let best: { point: XY; d: number } | null = null;
  for (const node of targets.nodes) {
    const d = distance(node.p, p);
    if (!best || d < best.d) best = { point: node.p, d };
  }
  for (const { segment } of targets.edges) {
    const point = onSegment(p, segment);
    const d = distance(point, p);
    if (!best || d < best.d - 1e-9) best = { point, d };
  }
  return best;
}

/** Pasangan titik terdekat antara tepi unit dan graf. */
export function nearestOutlineToGraph(outline: Outline, targets: LinkTargets) {
  let best: { onUnit: XY; onGraph: XY; d: number } | null = null;
  for (const side of outline.segments) {
    for (const { segment } of targets.edges) {
      const { a, b, d } = closestBetween(side, segment);
      if (!best || d < best.d) best = { onUnit: a, onGraph: b, d };
    }
    for (const node of targets.nodes) {
      const onUnit = onSegment(node.p, side);
      const d = distance(onUnit, node.p);
      if (!best || d < best.d) best = { onUnit, onGraph: node.p, d };
    }
  }
  return best;
}

/** Node di titik jalur `p`: node yang ada (< 0,5 m) atau node baru hasil memecah edge di sana. */
export function attachAt(
  draft: Draft,
  plane: Plane,
  floorId: string,
  p: XY,
  newId: () => string,
): string | null {
  const targets = linkTargets(draft, plane, floorId);
  let node: { id: string; d: number } | null = null;
  for (const candidate of targets.nodes) {
    const d = distance(candidate.p, p);
    if (d <= NODE_MERGE_DISTANCE_M && (!node || d < node.d)) node = { id: candidate.id, d };
  }
  if (node) return node.id;
  let edge: { edge: NavEdge; point: XY; d: number } | null = null;
  for (const candidate of targets.edges) {
    const point = onSegment(p, candidate.segment);
    const d = distance(point, p);
    if (d <= NODE_MERGE_DISTANCE_M && (!edge || d < edge.d))
      edge = { edge: candidate.edge, point, d };
  }
  return edge ? splitAt(draft, edge.edge, plane.toPosition(edge.point), newId) : null;
}

/** Node titik masuk di `position`, disambung satu edge ke titik jalur `attach`. */
export function addEntrance(
  draft: Draft,
  plane: Plane,
  floorId: string,
  featureId: string,
  position: Position,
  attach: XY,
  newId: () => string,
): boolean {
  const attachId = attachAt(draft, plane, floorId, attach, newId);
  if (!attachId) return false;
  const id = newId();
  draft.putNode({ id, floorId, coordinates: position, role: 'entrance', featureId });
  draft.putEdge({ id: newId(), floorId, from: id, to: attachId, lengthM: 0, accessible: true });
  return true;
}
