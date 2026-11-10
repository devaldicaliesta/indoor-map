import {
  createSnapshotSearchFromPrepared,
  type DeepLink,
  type ExploreChip,
  type ExploreTarget,
  exploreChips,
  indexSnapshot,
  prepareSnapshotSearch,
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
import { createContext, type ReactNode, use, useEffect, useMemo, useState } from 'react';
import { type StoreApi, useStore } from 'zustand';
import type { RouteGraphStatus } from '../../data/loadSnapshot';
import { visitorRoute } from '../route/route-model';
import { sharedState } from '../share/share-model';
import { createExploreStore, type ExploreState } from './explore-store';
import { getCachedSearchIndex, setCachedSearchIndex } from './search-cache';

export interface ExploreData {
  snapshot: Snapshot;
  index: SnapshotIndex;
  search: SnapshotSearch;
  chips: ExploreChip[];
  store: StoreApi<ExploreState>;
  /** Tautan pembuka kunjungan ini (gedung dan lantai awal peta). */
  link: DeepLink | null;
  /** Snapshot dengan graf jalur; `null` selama graf masih dimuat (lihat `useRouteSnapshot`). */
  routeSnapshot: Snapshot | null;
  routeStatus: RouteGraphStatus;
  retryRoute: () => void;
  /**
   * Rute untuk asal, tujuan, dan mode; graf dibangun saat rute pertama diminta dan hasil terakhir
   * diingat, sehingga panel dan peta memakai hitungan yang sama. `null` selama graf dimuat.
   */
  route(
    origin: RoutePlace,
    destination: ExploreTarget,
    accessible: boolean,
    closures: readonly RouteClosure[],
  ): RoutePlan | null;
}

function routeCache(snapshot: Snapshot | null): ExploreData['route'] {
  let graph: RouteGraph | null = null;
  let last: { key: unknown[]; plan: RoutePlan } | null = null;
  return (origin, destination, accessible, closures) => {
    if (!snapshot) return null;
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
const READY = (): undefined => undefined;

export function ExploreProvider({
  snapshot,
  route,
  link = null,
  children,
}: {
  snapshot: Snapshot;
  /** Graf jalur yang dimuat terpisah; tanpa nilai ini `snapshot` dianggap sudah lengkap. */
  route?: { snapshot: Snapshot | null; status: RouteGraphStatus; retry: () => void };
  /** Tautan bagikan atau QR yang membuka Visitor; hanya dibaca saat provider dibuat. */
  link?: DeepLink | null;
  children: ReactNode;
}) {
  const index = useMemo(() => indexSnapshot(snapshot), [snapshot]);
  const [search, setSearch] = useState<SnapshotSearch>(() => () => []);
  const [chips, setChips] = useState<ExploreChip[]>([]);
  const [store] = useState(() => createExploreStore(sharedState(snapshot, index, link)));

  useEffect(() => {
    let active = true;
    async function loadSearch() {
      const venueId = snapshot.venue.id;
      const version = snapshot.version;
      let prepared = await getCachedSearchIndex(venueId, version);
      if (!prepared) {
        prepared = prepareSnapshotSearch(snapshot);
        await setCachedSearchIndex(venueId, version, prepared);
      }
      if (active) {
        setSearch(() => createSnapshotSearchFromPrepared(prepared!));
        setChips(exploreChips(snapshot));
      }
    }
    // Tunda pembuatan daftar A-Z dan chip sampai peta tampil (memberi ruang untuk render utama)
    const timer = setTimeout(loadSearch, 100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [snapshot]);
  const routeSnapshot = route ? route.snapshot : snapshot;
  const routeStatus = route?.status ?? 'ready';
  const retryRoute = route?.retry ?? READY;
  const value = useMemo(
    () => ({
      snapshot,
      index,
      search,
      chips,
      store,
      link,
      routeSnapshot,
      routeStatus,
      retryRoute,
      route: routeCache(routeSnapshot),
    }),
    [snapshot, index, search, chips, store, link, routeSnapshot, routeStatus, retryRoute],
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
