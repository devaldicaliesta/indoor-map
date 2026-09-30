import { aStar } from './astar';
import { directCost, resolveEnd } from './endpoints';
import type { RouteGraph } from './graph';
import { directRoute, routeFromSearch } from './legs';
import type { RoutePoint, RouteResult } from './types';

/**
 * Rute terpendek dari `from` ke `to` di graf yang sudah dibangun `buildGraph`. Tujuan berupa
 * beberapa node (titik masuk sebuah lokasi) otomatis diarahkan ke yang terdekat.
 */
export function findRoute(graph: RouteGraph, from: RoutePoint, to: RoutePoint): RouteResult {
  const allowEdge = () => true;
  const start = resolveEnd(graph, from, allowEdge);
  if (!start) return { ok: false, reason: 'origin_invalid' };
  const end = resolveEnd(graph, to, allowEdge);
  if (!end) return { ok: false, reason: 'destination_invalid' };

  const search = aStar(graph, start.entries, end.entries);
  const direct = directCost(graph, start, end);
  if (direct !== null && (!search || direct <= search.cost)) {
    return directRoute(graph, start, end, direct);
  }
  if (!search) return { ok: false, reason: 'no_path' };
  return routeFromSearch(graph, search, start, end);
}
