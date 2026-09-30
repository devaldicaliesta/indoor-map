import type { Snapshot, VenueId } from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { data } from './client';

/**
 * Snapshot published terbaru venue. Service worker menyimpan `latest.json` (NetworkFirst
 * dengan ETag), jadi kunjungan berikutnya memakai isi yang tersimpan bila tidak berubah dan
 * peta tetap terbuka saat server tidak terjangkau.
 */
export function loadSnapshot(venueId: VenueId): Promise<Snapshot> {
  return data.snapshots.latest(venueId);
}

export const snapshotKey = (venueId: VenueId) => ['snapshot', venueId] as const;

/** Versi yang sudah dimuat dipakai sampai halaman dibuka ulang, agar rute tidak terputus. */
export function useSnapshot(venueId: VenueId) {
  return useQuery({
    queryKey: snapshotKey(venueId),
    queryFn: () => loadSnapshot(venueId),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
