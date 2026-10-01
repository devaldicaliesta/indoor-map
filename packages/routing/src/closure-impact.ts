import type { RouteGraph } from './graph';
import { activeClosures, type RouteClosure, restrictionsFor } from './options';

/**
 * Lantai yang terputus dari jaringan utama karena penutupan baru. `allRoutes` = tidak ada rute
 * sama sekali; selain itu hanya rute kursi roda yang hilang.
 */
export interface ClosureImpact {
  floorId: string;
  allRoutes: boolean;
}

/**
 * Lantai yang punya node di komponen terbesar. Arc dianggap dua arah: dampak dinilai dari
 * keterhubungan jaringan, bukan arah eskalator, agar satu penutupan tidak dilaporkan memutus
 * lantai yang memang hanya punya eskalator satu arah.
 */
function connectedFloors(
  graph: RouteGraph,
  blocked: Uint8Array | null,
  closedNodes: Uint8Array | null,
) {
  const n = graph.nodeIds.length;
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (let a = 0; a < graph.arcTo.length; a++) {
    if (blocked?.[a]) continue;
    const u = graph.arcFrom[a] ?? 0;
    const v = graph.arcTo[a] ?? 0;
    neighbours[u]?.push(v);
    neighbours[v]?.push(u);
  }
  const component = new Int32Array(n).fill(-1);
  const sizes: number[] = [];
  for (let start = 0; start < n; start++) {
    if (component[start] !== -1 || closedNodes?.[start]) continue;
    const id = sizes.length;
    const queue = [start];
    component[start] = id;
    for (let i = 0; i < queue.length; i++) {
      for (const v of neighbours[queue[i] ?? 0] ?? []) {
        if (component[v] !== -1 || closedNodes?.[v]) continue;
        component[v] = id;
        queue.push(v);
      }
    }
    sizes.push(queue.length);
  }
  const main = sizes.indexOf(Math.max(...sizes));
  const floors = new Set<string>();
  for (let node = 0; node < n; node++) {
    if (main !== -1 && component[node] === main) {
      floors.add(graph.floorIds[graph.floor[node] ?? 0] ?? '');
    }
  }
  return floors;
}

function floorsFor(graph: RouteGraph, accessible: boolean, closures: readonly RouteClosure[]) {
  const restrictions = restrictionsFor(graph, accessible, closures);
  return connectedFloors(graph, restrictions?.arcs ?? null, restrictions?.nodes ?? null);
}

/**
 * Dampak `closure` bila ditambahkan ke `existing` pada `now`: lantai yang sebelumnya tersambung
 * ke jaringan utama (komponen terbesar) tetapi tidak lagi, untuk semua rute dan rute kursi roda.
 * Penutupan dinilai berlaku walau mulainya terjadwal, karena yang ditanyakan adalah dampak
 * "selama penutupan".
 */
export function closureImpact(
  graph: RouteGraph,
  closure: RouteClosure,
  existing: readonly RouteClosure[],
  now: Date | number,
): ClosureImpact[] {
  const before = activeClosures(
    existing.filter((c) => c.id !== closure.id),
    now,
  );
  const after = [...before, closure];
  const impacts: ClosureImpact[] = [];
  const lostAll = new Set<string>();
  const beforeAll = floorsFor(graph, false, before);
  const afterAll = floorsFor(graph, false, after);
  for (const floorId of graph.floorIds) {
    if (beforeAll.has(floorId) && !afterAll.has(floorId)) {
      lostAll.add(floorId);
      impacts.push({ floorId, allRoutes: true });
    }
  }
  const beforeAccessible = floorsFor(graph, true, before);
  const afterAccessible = floorsFor(graph, true, after);
  for (const floorId of graph.floorIds) {
    if (lostAll.has(floorId)) continue;
    if (beforeAccessible.has(floorId) && !afterAccessible.has(floorId)) {
      impacts.push({ floorId, allRoutes: false });
    }
  }
  return impacts;
}
