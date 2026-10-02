import type { Floor } from '@indoor/domain';
import {
  buildRouteGraph,
  planRoute,
  type RoutePlan,
  routeDataFromDraft,
  routeOnFloor,
} from '@indoor/routing';
import { useEffect, useMemo } from 'react';
import { CLOSURE_REFRESH_MS } from '../graph/graph-queries';
import { useNow } from '../graph/graph-status';
import { type StepFocus, useTestRouteStore } from './test-route-store';
import type { RouteSources } from './use-route-sources';

/**
 * Lantai dan titik yang ditampilkan untuk satu langkah. Langkah pertama membingkai seluruh bagian
 * rute di lantai asal, langkah lain ruas atau titiknya sendiri.
 */
export function stepFocus(
  plan: RoutePlan | null,
  floors: readonly Floor[],
  index: number,
): Omit<StepFocus, 'seq'> | null {
  const step = plan?.ok ? plan.steps[index] : undefined;
  if (!plan?.ok || !step) return null;
  const onFloor = index === 0 ? routeOnFloor(plan.route, step.floorId).lines.flat() : [];
  return {
    floorId: step.floorId,
    buildingId: floors.find((f) => f.id === step.floorId)?.buildingId ?? null,
    coordinates: onFloor.length ? onFloor : step.coordinates,
  };
}

/**
 * Rute uji dari draft, dihitung ulang setiap asal, tujuan, mode, draft, atau penutupan yang
 * berlaku berubah. Rencananya diteruskan ke store untuk lapisan peta; rencana pertama setelah
 * asal/tujuan/mode berubah membuka langkah pertama (peta pindah ke lantai asal).
 */
export function useTestRoutePlan(sources: RouteSources | null): RoutePlan | null {
  const from = useTestRouteStore((s) => s.from);
  const to = useTestRouteStore((s) => s.to);
  const accessible = useTestRouteStore((s) => s.accessible);
  const version = useTestRouteStore((s) => s.version);
  const now = useNow(CLOSURE_REFRESH_MS);
  const data = useMemo(() => (sources ? routeDataFromDraft(sources) : null), [sources]);
  const graph = useMemo(() => (data ? buildRouteGraph(data) : null), [data]);
  const plan = useMemo(
    () =>
      data && graph && sources && from && to
        ? planRoute(graph, data, from, to, { accessible, closures: sources.closures, now })
        : null,
    [data, graph, sources, from, to, accessible, now],
  );

  useEffect(() => useTestRouteStore.getState().setPlan(plan), [plan]);
  useEffect(() => () => useTestRouteStore.getState().setPlan(null), []);

  useEffect(() => {
    const store = useTestRouteStore.getState();
    if (!plan || !sources || store.shownVersion === version) return;
    store.markShown(version);
    const focus = stepFocus(plan, sources.floors, 0);
    if (focus) store.showStep(0, focus);
  }, [plan, sources, version]);

  return plan;
}
