import { facilityMembers } from '@indoor/domain';
import { useEffect } from 'react';
import { useExplore, useExploreStore } from '../search/explore-context';

export function useNearestRequest() {
  const { snapshot, index, store, nearest } = useExplore();
  const nearestType = useExploreStore((s) => s.nearestType);
  const origin = useExploreStore((s) => s.origin);
  const choosing = useExploreStore((s) => s.originMode !== 'off');
  const accessible = useExploreStore((s) => s.accessible);
  const closures = useExploreStore((s) => s.closures);

  useEffect(() => {
    if (!nearestType || !origin || choosing) return;
    const candidates = facilityMembers(snapshot, index, nearestType).map((facility) => ({
      kind: 'facility' as const,
      id: facility.id,
    }));
    const found = nearest(origin, candidates, accessible, closures);
    if (found === undefined) return;
    store.getState().resolveNearest(found);
  }, [nearestType, origin, choosing, accessible, closures, snapshot, index, store, nearest]);
}
