import {
  createSnapshotSearch,
  type ExploreChip,
  exploreChips,
  indexSnapshot,
  type Snapshot,
  type SnapshotIndex,
  type SnapshotSearch,
} from '@indoor/domain';
import { createContext, type ReactNode, use, useMemo, useState } from 'react';
import { type StoreApi, useStore } from 'zustand';
import { createExploreStore, type ExploreState } from './explore-store';

export interface ExploreData {
  snapshot: Snapshot;
  index: SnapshotIndex;
  search: SnapshotSearch;
  chips: ExploreChip[];
  store: StoreApi<ExploreState>;
}

const ExploreContext = createContext<ExploreData | null>(null);

/**
 * Indeks dan pencarian dibangun sekali per snapshot. Pasang dengan `key` venue agar pilihan
 * pengunjung dimulai ulang saat venue berganti.
 */
export function ExploreProvider({
  snapshot,
  children,
}: {
  snapshot: Snapshot;
  children: ReactNode;
}) {
  const [store] = useState(createExploreStore);
  const value = useMemo(
    () => ({
      snapshot,
      index: indexSnapshot(snapshot),
      search: createSnapshotSearch(snapshot),
      chips: exploreChips(snapshot),
      store,
    }),
    [snapshot, store],
  );
  return <ExploreContext value={value}>{children}</ExploreContext>;
}

export function useExplore(): ExploreData {
  const value = use(ExploreContext);
  if (!value) throw new Error('useExplore dipakai di luar ExploreProvider.');
  return value;
}

export function useExploreStore<T>(selector: (state: ExploreState) => T): T {
  return useStore(useExplore().store, selector);
}
