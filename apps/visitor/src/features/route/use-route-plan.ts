import type { RoutePlan } from '@indoor/routing';
import { useMemo } from 'react';
import { useExplore, useExploreStore } from '../search/explore-context';

/** Rute yang sedang ditampilkan; `null` tanpa asal atau tujuan, atau saat asal sedang diganti. */
export function useRoutePlan(): RoutePlan | null {
  const { route } = useExplore();
  const origin = useExploreStore((s) => s.origin);
  const destination = useExploreStore((s) => s.destination);
  const accessible = useExploreStore((s) => s.accessible);
  const choosing = useExploreStore((s) => s.originMode !== 'off');
  const closures = useExploreStore((s) => s.closures);
  return useMemo(
    () =>
      origin && destination && !choosing ? route(origin, destination, accessible, closures) : null,
    [route, origin, destination, accessible, choosing, closures],
  );
}
