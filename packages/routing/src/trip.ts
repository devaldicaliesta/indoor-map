import type { RouteGraph } from './graph';
import type { RouteOptions } from './options';
import type { RouteData } from './route-data';
import { planRoute, type RoutePlan } from './route-plan';
import type { RoutePlace } from './targets';
import type { RouteSuccess } from './types';

type SuccessPlan = Extract<RoutePlan, { ok: true }>;

export interface TripSegment {
  firstStep: number;
  stepCount: number;
  distanceM: number;
}

export type TripPlan =
  | (SuccessPlan & { segments: TripSegment[] })
  | (Extract<RoutePlan, { ok: false }> & { failedStop: number });

export function nearestPlace<P extends RoutePlace>(
  graph: RouteGraph,
  data: RouteData,
  from: RoutePlace,
  candidates: readonly P[],
  options: RouteOptions = {},
): { place: P; plan: SuccessPlan } | null {
  let best: { place: P; plan: SuccessPlan } | null = null;
  for (const place of candidates) {
    const plan = planRoute(graph, data, from, place, options);
    if (plan.ok && (!best || plan.route.costM < best.plan.route.costM)) best = { place, plan };
  }
  return best;
}

function mergeRoutes(routes: readonly RouteSuccess[]): RouteSuccess {
  return {
    ok: true,
    path: routes.flatMap((route, i) => (i === 0 ? route.path : route.path.slice(1))),
    legs: routes.flatMap((route) => route.legs),
    distanceM: routes.reduce((sum, route) => sum + route.distanceM, 0),
    costM: routes.reduce((sum, route) => sum + route.costM, 0),
    avoidedClosureIds: [...new Set(routes.flatMap((route) => route.avoidedClosureIds))],
  };
}

export function planTrip(
  graph: RouteGraph,
  data: RouteData,
  from: RoutePlace,
  stops: readonly RoutePlace[],
  options: RouteOptions = {},
): TripPlan {
  const plans: SuccessPlan[] = [];
  let origin = from;
  for (const [index, stop] of stops.entries()) {
    const plan = planRoute(graph, data, origin, stop, options);
    if (!plan.ok) return { ...plan, failedStop: index };
    plans.push(plan);
    origin = stop;
  }
  const first = plans[0];
  const last = plans.at(-1);
  if (!first || !last) {
    return {
      ok: false,
      reason: 'destination_unknown',
      blockingClosureIds: [],
      gap: null,
      failedStop: 0,
    };
  }
  let firstStep = 0;
  const segments = plans.map((plan) => {
    const segment = {
      firstStep,
      stepCount: plan.steps.length,
      distanceM: plan.route.distanceM,
    };
    firstStep += plan.steps.length;
    return segment;
  });
  return {
    ok: true,
    route: mergeRoutes(plans.map((plan) => plan.route)),
    steps: plans.flatMap((plan) => plan.steps),
    origin: first.origin,
    destination: last.destination,
    segments,
  };
}
