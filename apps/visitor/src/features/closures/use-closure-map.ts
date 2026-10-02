import type { Snapshot } from '@indoor/domain';
import { type MapInstance, setClosureMarks } from '@indoor/map-core';
import { useEffect, useMemo } from 'react';
import { useExploreStore } from '../search/explore-context';
import { closureMarks } from './closure-model';

/** Tandai area, jalur, dan konektor yang tertutup di lantai yang digambar. */
export function useClosureMap(
  map: MapInstance | null,
  snapshot: Snapshot,
  floorIds: readonly string[],
) {
  const closures = useExploreStore((s) => s.closures);
  const marks = useMemo(
    () => closureMarks(snapshot, closures, floorIds),
    [snapshot, closures, floorIds],
  );
  useEffect(() => {
    if (map) setClosureMarks(map, marks);
  }, [map, marks]);
}
