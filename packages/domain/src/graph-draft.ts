import type { Position } from './geometry';
import { edgeLengthM, type NavEdge, type NavGraph, type NavNode } from './nav-graph';
import { EARTH_RADIUS_M } from './units';

/**
 * Titik yang lebih dekat dari ini dianggap satu node: ujung garis baru menyambung ke node atau
 * edge yang ada, dan node yang dilepas di dekat node lain digabung.
 */
export const NODE_MERGE_DISTANCE_M = 0.5;

export interface GraphChange<T> {
  id: string;
  /** `null` = belum ada (dibuat). */
  before: T | null;
  /** `null` = dihapus. */
  after: T | null;
}

/** Perubahan graf satu aksi edit, siap dicatat di riwayat undo dan disimpan. */
export interface GraphPatch {
  nodes: GraphChange<NavNode>[];
  edges: GraphChange<NavEdge>[];
}

export const EMPTY_PATCH: GraphPatch = { nodes: [], edges: [] };
const RAD = Math.PI / 180;
/** 9 desimal ≈ 0,1 mm, sama dengan presisi koordinat editor. */
const COORDINATE_SCALE = 1e9;

export type XY = readonly [number, number];

export const round = (p: XY): Position => [
  Math.round(p[0] * COORDINATE_SCALE) / COORDINATE_SCALE,
  Math.round(p[1] * COORDINATE_SCALE) / COORDINATE_SCALE,
];
export const distance = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const lerp = (a: XY, b: XY, t: number): XY => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
const cross = (a: XY, b: XY) => a[0] * b[1] - a[1] * b[0];

/** Posisi relatif sepanjang ruas a–b (0 = a, 1 = b) dari proyeksi tegak lurus `p`. */
export function along(p: XY, a: XY, b: XY): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length2 = dx * dx + dy * dy;
  return length2 > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2 : 0;
}

/** Bidang datar lokal (m) di sekitar satu titik; pada skala gedung galatnya terabaikan. */
export interface Plane {
  toXY(p: Position): XY;
  toPosition(p: XY): Position;
}

export function planeAt(origin: Position): Plane {
  const kx = RAD * EARTH_RADIUS_M * Math.cos(origin[1] * RAD);
  const ky = RAD * EARTH_RADIUS_M;
  return {
    toXY: (p) => [(p[0] - origin[0]) * kx, (p[1] - origin[1]) * ky],
    toPosition: (p) => round([origin[0] + p[0] / kx, origin[1] + p[1] / ky]),
  };
}

/** Perpotongan sejati dua ruas (bukan di ujung dan tidak sejajar): posisi di kedua ruas. */
export function crossing(p: XY, q: XY, c: XY, d: XY): { t: number; u: number } | null {
  const r: XY = [q[0] - p[0], q[1] - p[1]];
  const s: XY = [d[0] - c[0], d[1] - c[1]];
  const denominator = cross(r, s);
  if (Math.abs(denominator) < 1e-12) return null;
  const pc: XY = [c[0] - p[0], c[1] - p[1]];
  const t = cross(pc, s) / denominator;
  const u = cross(pc, r) / denominator;
  return t > 0 && t < 1 && u > 0 && u < 1 ? { t, u } : null;
}

const sameNode = (a: NavNode, b: NavNode) =>
  a.floorId === b.floorId &&
  a.coordinates[0] === b.coordinates[0] &&
  a.coordinates[1] === b.coordinates[1] &&
  a.role === b.role &&
  a.featureId === b.featureId;

const sameEdge = (a: NavEdge, b: NavEdge) =>
  a.floorId === b.floorId &&
  a.from === b.from &&
  a.to === b.to &&
  a.lengthM === b.lengthM &&
  a.accessible === b.accessible;

/**
 * Node yang dirujuk tabel lain (pemberhentian konektor, titik asal, Info Point) tidak dihapus
 * lewat edit graf; menghapusnya akan ikut menghapus pemberhentian konektor di database.
 */
export const anchored = (node: NavNode) =>
  node.role === 'connector' || node.role === 'origin' || node.role === 'info_point';
export const rank = (node: NavNode) => (anchored(node) ? 2 : node.role === 'entrance' ? 1 : 0);

/** Salinan kerja graf yang mencatat id yang disentuh, lalu menghasilkan patch. */
export class Draft {
  readonly nodes: Map<string, NavNode>;
  readonly edges: Map<string, NavEdge>;
  private readonly touchedNodes = new Set<string>();
  private readonly touchedEdges = new Set<string>();

  constructor(private readonly base: NavGraph) {
    this.nodes = new Map(Object.entries(base.nodes));
    this.edges = new Map(Object.entries(base.edges));
  }

  putNode(node: NavNode) {
    this.nodes.set(node.id, node);
    this.touchedNodes.add(node.id);
  }

  dropNode(id: string) {
    this.nodes.delete(id);
    this.touchedNodes.add(id);
  }

  /** Edge disimpan dengan panjang dari posisi kedua node saat ini. */
  putEdge(edge: NavEdge) {
    const a = this.nodes.get(edge.from);
    const b = this.nodes.get(edge.to);
    const lengthM = a && b ? edgeLengthM(a.coordinates, b.coordinates) : edge.lengthM;
    this.edges.set(edge.id, { ...edge, lengthM });
    this.touchedEdges.add(edge.id);
  }

  dropEdge(id: string) {
    this.edges.delete(id);
    this.touchedEdges.add(id);
  }

  edgesAt(nodeId: string): NavEdge[] {
    return [...this.edges.values()].filter((e) => e.from === nodeId || e.to === nodeId);
  }

  edgeBetween(a: string, b: string): NavEdge | undefined {
    for (const edge of this.edges.values()) {
      if ((edge.from === a && edge.to === b) || (edge.from === b && edge.to === a)) return edge;
    }
    return undefined;
  }

  /** Node jalur biasa yang tidak lagi punya edge ikut dihapus. */
  dropIfStray(id: string) {
    const node = this.nodes.get(id);
    if (node?.role === 'path' && this.edgesAt(id).length === 0) this.dropNode(id);
  }

  patch(): GraphPatch {
    const nodes = [...this.touchedNodes].flatMap((id) => {
      const before = this.base.nodes[id] ?? null;
      const after = this.nodes.get(id) ?? null;
      if (before === after || (before && after && sameNode(before, after))) return [];
      return [{ id, before, after }];
    });
    const edges = [...this.touchedEdges].flatMap((id) => {
      const before = this.base.edges[id] ?? null;
      const after = this.edges.get(id) ?? null;
      if (before === after || (before && after && sameEdge(before, after))) return [];
      return [{ id, before, after }];
    });
    return { nodes, edges };
  }
}

/** Memotong edge di `position` (atau di node `at` yang sudah ada): bagian pertama memakai id lama. */
export function splitAt(
  draft: Draft,
  edge: NavEdge,
  position: Position,
  newId: () => string,
  at?: string,
): string {
  let nodeId = at;
  if (!nodeId) {
    nodeId = newId();
    draft.putNode({
      id: nodeId,
      floorId: edge.floorId,
      coordinates: position,
      role: 'path',
      featureId: null,
    });
  }
  draft.putEdge({ ...edge, to: nodeId });
  draft.putEdge({ ...edge, id: newId(), from: nodeId });
  return nodeId;
}

export function nearestNode(
  draft: Draft,
  plane: Plane,
  floorId: string,
  point: XY,
  exceptId: string | null,
): NavNode | null {
  let best: NavNode | null = null;
  let bestM = NODE_MERGE_DISTANCE_M;
  for (const node of draft.nodes.values()) {
    if (node.floorId !== floorId || node.id === exceptId) continue;
    const d = distance(plane.toXY(node.coordinates), point);
    if (d <= bestM) {
      best = node;
      bestM = d;
    }
  }
  return best;
}

/** Graf setelah patch diterapkan. */
export function applyGraphPatch(graph: NavGraph, patch: GraphPatch): NavGraph {
  const nodes = { ...graph.nodes };
  const edges = { ...graph.edges };
  for (const change of patch.nodes) {
    if (change.after) nodes[change.id] = change.after;
    else delete nodes[change.id];
  }
  for (const change of patch.edges) {
    if (change.after) edges[change.id] = change.after;
    else delete edges[change.id];
  }
  return { nodes, edges };
}
