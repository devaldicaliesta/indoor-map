import { graphDeferred, type Snapshot, type VenueId, withGraph } from '@indoor/domain';
import { type QueryClient, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { data } from './client';
import { takeSnapshotPrefetch } from './prefetch';

/**
 * Snapshot published terbaru venue. Service worker menyimpan `latest.json` (NetworkFirst
 * dengan ETag), jadi kunjungan berikutnya memakai isi yang tersimpan bila tidak berubah dan
 * peta tetap terbuka saat server tidak terjangkau.
 */
export function loadSnapshot(venueId: VenueId): Promise<Snapshot> {
  return data.snapshots.latest(venueId, takeSnapshotPrefetch(data.snapshots.latestUrl(venueId)));
}

export const snapshotKey = (venueId: VenueId) => ['snapshot', venueId] as const;

const graphQuery = (venueId: VenueId, path: string | undefined) => ({
  queryKey: ['snapshot-graph', venueId, path] as const,
  queryFn: () => data.snapshots.graph(venueId, path ?? ''),
  staleTime: Number.POSITIVE_INFINITY,
});

/**
 * Snapshot terbaru yang grafnya sudah ada di cache query. Info Point memakainya untuk versi baru,
 * agar rute tetap bisa dihitung bila jaringan putus setelah versi itu dipasang.
 */
export async function loadSnapshotWithGraph(
  venueId: VenueId,
  queryClient: QueryClient,
): Promise<Snapshot> {
  const snapshot = await loadSnapshot(venueId);
  if (snapshot.graphPath) await queryClient.fetchQuery(graphQuery(venueId, snapshot.graphPath));
  return snapshot;
}

/** Versi yang sudah dimuat dipakai sampai halaman dibuka ulang, agar rute tidak terputus. */
export function useSnapshot(venueId: VenueId) {
  return useQuery({
    queryKey: snapshotKey(venueId),
    queryFn: () => loadSnapshot(venueId),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export type RouteGraphStatus = 'ready' | 'loading' | 'failed';

/**
 * Snapshot lengkap untuk rute dan penutupan jalur. `latest.json` baru tidak membawa graf
 * (`graphPath`); grafnya dimuat di latar belakang setelah peta tampil. Snapshot lama dan draft
 * pratinjau sudah lengkap sehingga langsung siap.
 */
export function useRouteSnapshot(snapshot: Snapshot): {
  snapshot: Snapshot | null;
  status: RouteGraphStatus;
  retry: () => void;
} {
  const venueId = snapshot.venue.id as VenueId;
  const path = snapshot.graphPath;
  const graph = useQuery({ ...graphQuery(venueId, path), enabled: path !== undefined });
  const full = useMemo(() => {
    if (!graphDeferred(snapshot)) return snapshot;
    return graph.data ? withGraph(snapshot, graph.data) : null;
  }, [snapshot, graph.data]);
  const status: RouteGraphStatus = full ? 'ready' : graph.isError ? 'failed' : 'loading';
  const { refetch } = graph;
  const retry = useCallback(() => void refetch(), [refetch]);
  return { snapshot: full, status, retry };
}
