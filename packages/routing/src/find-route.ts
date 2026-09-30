import { aStar } from './astar';
import { directCost, type ResolvedEnd, resolveEnd } from './endpoints';
import type { RouteGraph } from './graph';
import { directRoute, routeFromSearch } from './legs';
import {
  activeClosures,
  closuresOnRoute,
  type Restrictions,
  type RouteClosure,
  type RouteOptions,
  restrictionsFor,
} from './options';
import type { RouteFailureReason, RoutePoint, RouteResult } from './types';

interface Attempt {
  result: RouteResult;
  /** Arc dan node yang dilewati, untuk mencari penutupan yang mengenai rute. */
  arcs: number[];
  nodes: number[];
}

const failed = (reason: RouteFailureReason, blockingClosureIds: string[] = []): RouteResult => ({
  ok: false,
  reason,
  blockingClosureIds,
});

/** Ujung tanpa node yang terlarang; `null` bila tidak ada yang tersisa. */
function usable(end: ResolvedEnd | null, restrictions: Restrictions | null): ResolvedEnd | null {
  if (!end) return null;
  const entries = end.entries.filter((entry) => !restrictions?.nodes[entry.node]);
  return entries.length ? { ...end, entries } : null;
}

function attempt(
  graph: RouteGraph,
  from: RoutePoint,
  to: RoutePoint,
  restrictions: Restrictions | null,
): Attempt {
  const none = { arcs: [], nodes: [] };
  const allowEdge = (edge: number) => !restrictions?.edges[edge];
  const start = usable(resolveEnd(graph, from, allowEdge), restrictions);
  if (!start) return { result: failed('origin_invalid'), ...none };
  const end = usable(resolveEnd(graph, to, allowEdge), restrictions);
  if (!end) return { result: failed('destination_invalid'), ...none };

  const search = aStar(graph, start.entries, end.entries, {
    ...(restrictions ? { blockedArcs: restrictions.arcs } : {}),
  });
  const direct = directCost(graph, start, end);
  if (direct !== null && (!search || direct <= search.cost)) {
    return { result: directRoute(graph, start, end, direct), ...none };
  }
  if (!search) return { result: failed('no_path'), ...none };
  const first = start.entries[search.seed]?.node ?? 0;
  return {
    result: routeFromSearch(graph, search, start, end),
    arcs: search.arcs,
    nodes: [first, ...search.arcs.map((arc) => graph.arcTo[arc] ?? 0)],
  };
}

/**
 * Rute terpendek dari `from` ke `to`. Tujuan berupa beberapa node (titik masuk sebuah lokasi)
 * otomatis diarahkan ke yang terdekat. Bila gagal, alasannya dibuat spesifik:
 * `accessible_blocked` bila rute ada tanpa mode aksesibel, `closed` bila rute ada tanpa
 * penutupan, beserta penutupan yang menghalangi.
 */
export function findRoute(
  graph: RouteGraph,
  from: RoutePoint,
  to: RoutePoint,
  options: RouteOptions = {},
): RouteResult {
  const accessible = options.accessible ?? false;
  const closures = activeClosures(options.closures ?? [], options.now);
  const run = (onlyAccessible: boolean, active: readonly RouteClosure[]) =>
    attempt(graph, from, to, restrictionsFor(graph, onlyAccessible, active));
  const blocking = (free: Attempt) =>
    free.result.ok ? closuresOnRoute(graph, free.arcs, free.nodes, closures) : [];

  const main = run(accessible, closures);
  if (main.result.ok) {
    if (closures.length === 0) return main.result;
    const free = run(accessible, []);
    const detour = free.result.ok && free.result.costM < main.result.costM - 1e-9;
    return { ...main.result, avoidedClosureIds: detour ? blocking(free) : [] };
  }
  if (accessible && run(false, closures).result.ok) {
    return failed('accessible_blocked', closures.length ? blocking(run(true, [])) : []);
  }
  if (closures.length > 0) {
    const free = run(accessible, []);
    if (free.result.ok) return failed('closed', blocking(free));
  }
  return main.result;
}
