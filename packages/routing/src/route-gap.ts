import { ARC_CONNECTOR } from './arcs';
import { type ResolvedEnd, resolveEnd } from './endpoints';
import type { RouteGraph } from './graph';
import { restrictionsFor } from './options';
import type { RoutePoint } from './types';

/**
 * Tempat jaringan jalur terputus antara asal dan tujuan, untuk pesan kegagalan yang bisa
 * ditindaklanjuti admin:
 * - `origin`/`destination`: ujung tidak bisa ditempelkan ke jalur, karena lantainya belum punya
 *   jalur (yang boleh dilewati) atau node-nya tidak ada (`floorId` `null`);
 * - `floor`: `floorId` tidak terhubung ke `fromFloorId` (lantai terdekat yang tercapai) lewat
 *   konektor yang boleh dipakai; `connectorIds` = konektor di antara keduanya yang ada tetapi
 *   tidak aksesibel atau berlawanan arah (kosong bila belum ada konektor sama sekali);
 * - `connector`: di `floorId`, jalur dari asal tidak sampai ke pemberhentian konektor
 *   `connectorIds` menuju `toFloorId` (node konektor belum disambung ke jalur);
 * - `path`: lantai tujuan tercapai, tetapi tujuan tidak tersambung ke jalur yang tercapai.
 */
export type RouteGap =
  | { kind: 'origin' | 'destination'; floorId: string | null }
  | { kind: 'floor'; floorId: string; fromFloorId: string; connectorIds: string[] }
  | { kind: 'connector'; floorId: string; toFloorId: string; connectorIds: string[] }
  | { kind: 'path'; floorId: string };

/** Node yang bisa dicapai dari ujung asal lewat arc yang tidak diblokir. */
function reachable(graph: RouteGraph, start: ResolvedEnd, blocked: Uint8Array | null) {
  const reached = new Uint8Array(graph.nodeIds.length);
  const queue = start.entries.map((entry) => entry.node);
  for (const node of queue) reached[node] = 1;
  for (let i = 0; i < queue.length; i++) {
    const u = queue[i] ?? 0;
    for (let a = graph.offsets[u] ?? 0; a < (graph.offsets[u + 1] ?? 0); a++) {
      const v = graph.arcTo[a] ?? 0;
      if (blocked?.[a] || reached[v]) continue;
      reached[v] = 1;
      queue.push(v);
    }
  }
  return reached;
}

/** Lantai yang bertetangga lewat konektor apa pun, tanpa melihat arah dan aksesibilitas. */
function floorNeighbours(graph: RouteGraph): Map<number, Set<number>> {
  const neighbours = new Map<number, Set<number>>();
  const link = (a: number, b: number) => {
    const set = neighbours.get(a) ?? new Set<number>();
    set.add(b);
    neighbours.set(a, set);
  };
  for (let a = 0; a < graph.arcTo.length; a++) {
    if (!((graph.arcFlags[a] ?? 0) & ARC_CONNECTOR)) continue;
    const f = graph.floor[graph.arcFrom[a] ?? 0] ?? 0;
    const g = graph.floor[graph.arcTo[a] ?? 0] ?? 0;
    link(f, g);
    link(g, f);
  }
  return neighbours;
}

/**
 * Lantai tercapai yang paling dekat (dalam jumlah perpindahan konektor) ke lantai tujuan, beserta
 * lantai di sisi tujuan yang bersebelahan dengannya; `null` bila tidak ada konektor yang
 * menyambungkan wilayah tujuan ke lantai mana pun yang tercapai.
 */
function frontier(graph: RouteGraph, targets: readonly number[], reached: ReadonlySet<number>) {
  const neighbours = floorNeighbours(graph);
  const seen = new Set(targets);
  const queue = [...targets];
  for (let i = 0; i < queue.length; i++) {
    const floor = queue[i] ?? 0;
    for (const next of neighbours.get(floor) ?? []) {
      if (reached.has(next)) return { reachedFloor: next, gapFloor: floor };
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return null;
}

/** Id konektor dari arc antara dua lantai yang lolos `keep`, tanpa duplikat. */
function connectorsBetween(
  graph: RouteGraph,
  keep: (arc: number, from: number, to: number) => boolean,
): string[] {
  const ids = new Set<string>();
  for (let a = 0; a < graph.arcTo.length; a++) {
    if (!((graph.arcFlags[a] ?? 0) & ARC_CONNECTOR)) continue;
    const from = graph.floor[graph.arcFrom[a] ?? 0] ?? 0;
    const to = graph.floor[graph.arcTo[a] ?? 0] ?? 0;
    if (keep(a, from, to)) ids.add(graph.connectorIds[graph.arcSource[a] ?? 0] ?? '');
  }
  return [...ids];
}

const floorsOf = (graph: RouteGraph, end: ResolvedEnd) => [
  ...new Set(end.entries.map((entry) => graph.floor[entry.node] ?? 0)),
];

/**
 * Tempat rute dari `from` ke `to` terputus pada graf tanpa penutupan, hanya memakai elemen
 * aksesibel bila `accessible`; `null` bila rute sebenarnya ada. Dipakai setelah `findRoute` gagal
 * karena struktur graf (bukan karena penutupan).
 */
export function routeGap(
  graph: RouteGraph,
  from: RoutePoint,
  to: RoutePoint,
  accessible: boolean,
): RouteGap | null {
  const restrictions = restrictionsFor(graph, accessible, []);
  const allowEdge = (edge: number) => !restrictions?.edges[edge];
  const start = resolveEnd(graph, from, allowEdge);
  if (!start) return { kind: 'origin', floorId: from.kind === 'point' ? from.floorId : null };
  const end = resolveEnd(graph, to, allowEdge);
  if (!end) return { kind: 'destination', floorId: to.kind === 'point' ? to.floorId : null };

  const blocked = restrictions?.arcs ?? null;
  const reached = reachable(graph, start, blocked);
  if (end.entries.some((entry) => reached[entry.node])) return null;
  const reachedFloors = new Set<number>();
  for (let node = 0; node < reached.length; node++) {
    if (reached[node]) reachedFloors.add(graph.floor[node] ?? 0);
  }
  const floorId = (floor: number) => graph.floorIds[floor] ?? '';
  const targets = floorsOf(graph, end);
  const reachedTarget = targets.find((floor) => reachedFloors.has(floor));
  if (reachedTarget !== undefined) return { kind: 'path', floorId: floorId(reachedTarget) };

  const edge = frontier(graph, targets, reachedFloors);
  if (!edge) {
    return {
      kind: 'floor',
      floorId: floorId(targets[0] ?? 0),
      fromFloorId: floorId(floorsOf(graph, start)[0] ?? 0),
      connectorIds: [],
    };
  }
  const { reachedFloor, gapFloor } = edge;
  const usable = connectorsBetween(
    graph,
    (arc, a, b) => a === reachedFloor && b === gapFloor && !blocked?.[arc],
  );
  if (usable.length) {
    return {
      kind: 'connector',
      floorId: floorId(reachedFloor),
      toFloorId: floorId(gapFloor),
      connectorIds: usable,
    };
  }
  return {
    kind: 'floor',
    floorId: floorId(gapFloor),
    fromFloorId: floorId(reachedFloor),
    connectorIds: connectorsBetween(
      graph,
      (_, a, b) => (a === reachedFloor && b === gapFloor) || (a === gapFloor && b === reachedFloor),
    ),
  };
}
