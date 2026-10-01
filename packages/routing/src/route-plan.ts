import { findRoute } from './find-route';
import type { RouteGraph } from './graph';
import { type RouteStep, routeSteps } from './instructions';
import type { RouteOptions } from './options';
import type { RouteData } from './route-data';
import { type RouteGap, routeGap } from './route-gap';
import { placeTarget, type RoutePlace } from './targets';
import type { RouteFailureReason, RoutePoint, RouteSuccess } from './types';

/** Alasan gagal rencana rute: alasan `findRoute`, atau tempat yang tidak ada di data. */
export type RoutePlanFailureReason = RouteFailureReason | 'origin_unknown' | 'destination_unknown';

export type RoutePlan =
  | {
      ok: true;
      route: RouteSuccess;
      steps: RouteStep[];
      /** Ujung yang dipakai; `point` untuk unit/fasilitas berarti belum punya titik masuk. */
      origin: RoutePoint;
      destination: RoutePoint;
    }
  | {
      ok: false;
      reason: RoutePlanFailureReason;
      blockingClosureIds: string[];
      /** Letak jaringan terputus bila gagal karena struktur graf, bukan karena penutupan. */
      gap: RouteGap | null;
    };

/**
 * Rute dari tempat ke tempat beserta langkahnya. Bila gagal karena graf (tidak ada jalur, ujung
 * tidak menempel, atau tidak ada jalur aksesibel tanpa penutupan apa pun), letak putusnya dicari
 * dengan `routeGap` agar pesan bisa menyebut lantai atau konektor yang perlu diperbaiki.
 */
export function planRoute(
  graph: RouteGraph,
  data: RouteData,
  from: RoutePlace,
  to: RoutePlace,
  options: RouteOptions = {},
): RoutePlan {
  const origin = placeTarget(data, from);
  const destination = placeTarget(data, to);
  if (!origin || !destination) {
    return {
      ok: false,
      reason: origin ? 'destination_unknown' : 'origin_unknown',
      blockingClosureIds: [],
      gap: null,
    };
  }
  const result = findRoute(graph, origin, destination, options);
  if (result.ok) {
    return { ok: true, route: result, steps: routeSteps(result, data.floors), origin, destination };
  }
  const { reason, blockingClosureIds } = result;
  const structural = reason !== 'closed' && blockingClosureIds.length === 0;
  return {
    ok: false,
    reason,
    blockingClosureIds,
    gap: structural ? routeGap(graph, origin, destination, reason === 'accessible_blocked') : null,
  };
}
