import type { Snapshot, VenueId } from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { data } from '../../data/client';
import { useExplore } from '../search/explore-context';
import { knownClosures } from './closure-model';

/** Penutupan dibaca ulang tiap menit selama halaman terlihat, tanpa Realtime dan tanpa publish. */
export const CLOSURE_REFRESH_MS = 60_000;

/**
 * Penutupan yang sedang berlaku (akses anon hanya mengembalikan yang berlaku), disaring ke
 * sasaran yang ada di snapshot lalu diteruskan ke store untuk rute dan peta. Gagal memuat tidak
 * menghalangi peta: penutupan terakhir yang diketahui tetap dipakai.
 */
export const closuresQuery = (venueId: VenueId) => ({
  queryKey: ['closures', venueId] as const,
  queryFn: () => data.closures.listCurrent(venueId, new Date()),
  // Hasil pramuat halaman venue dipakai saat peta terpasang, tanpa meminta ulang.
  staleTime: 30_000,
});

export function useLiveClosures(snapshot: Snapshot) {
  const { store, routeSnapshot } = useExplore();
  const venueId = snapshot.venue.id as VenueId;
  const closures = useQuery({
    ...closuresQuery(venueId),
    refetchInterval: CLOSURE_REFRESH_MS,
    // Tab tersembunyi tidak membaca ulang; kembali ke tab membaca ulang saat itu juga.
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  }).data;

  // Sebelum graf jalur termuat hanya penutupan area yang dikenali; jalur dan konektor menyusul.
  const known = routeSnapshot ?? snapshot;
  useEffect(() => {
    if (closures) store.getState().setClosures(knownClosures(known, closures));
  }, [closures, known, store]);
}
