import {
  createSnapshotSearch,
  type DeepLink,
  type ExploreChip,
  type ExploreTarget,
  exploreChips,
  indexSnapshot,
  type Snapshot,
  type SnapshotIndex,
  type SnapshotSearch,
} from '@indoor/domain';
import {
  buildRouteGraph,
  type RouteClosure,
  type RouteGraph,
  type RoutePlace,
  type RoutePlan,
} from '@indoor/routing';
import { createContext, type ReactNode, use, useMemo, useState } from 'react';
import { type StoreApi, useStore } from 'zustand';
import { visitorRoute } from '../route/route-model';
import { sharedState } from '../share/share-model';
import { createExploreStore, type ExploreState } from './explore-store';

export interface ExploreData {
  snapshot: Snapshot;
  index: SnapshotIndex;
  search: SnapshotSearch;
  chips: ExploreChip[];
  store: StoreApi<ExploreState>;
  /** Tautan pembuka kunjungan ini (gedung dan lantai awal peta). */
  link: DeepLink | null;
  /**
   * Rute untuk asal, tujuan, dan mode; graf dibangun saat rute pertama diminta dan hasil terakhir
   * diingat, sehingga panel dan peta memakai hitungan yang sama.
   */
  route(
    origin: RoutePlace,
    destination: ExploreTarget,
    accessible: boolean,
    closures: readonly RouteClosure[],
  ): RoutePlan;
}

function routeCache(snapshot: Snapshot): ExploreData['route'] {
  let graph: RouteGraph | null = null;
  let last: { key: unknown[]; plan: RoutePlan } | null = null;
  return (origin, destination, accessible, closures) => {
    const key = [origin, destination, accessible, closures];
    if (last && key.every((part, i) => part === last?.key[i])) return last.plan;
    graph ??= buildRouteGraph(snapshot);
    const plan = visitorRoute(graph, snapshot, origin, destination, { accessible, closures });
    last = { key, plan };
    return plan;
  };
}

const ExploreContext = createContext<ExploreData | null>(null);

/**
 * Indeks dan pencarian dibangun sekali per snapshot. Pasang dengan `key` venue agar pilihan
 * pengunjung dimulai ulang saat venue berganti.
 */
export function ExploreProvider({
  snapshot,
  link = null,
  children,
}: {
  snapshot: Snapshot;
  /** Tautan bagikan atau QR yang membuka Visitor; hanya dibaca saat provider dibuat. */
  link?: DeepLink | null;
  children: ReactNode;
}) {
  const index = useMemo(() => indexSnapshot(snapshot), [snapshot]);
  const [store] = useState(() => createExploreStore(sharedState(snapshot, index, link)));
  const value = useMemo(
    () => ({
      snapshot,
      index,
      search: createSnapshotSearch(snapshot),
      chips: exploreChips(snapshot),
      store,
      link,
      route: routeCache(snapshot),
    }),
    [snapshot, index, store, link],
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
