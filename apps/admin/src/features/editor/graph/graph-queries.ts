import type { FloorId, VenueId } from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { data } from '../../../app/data-client';
import { editorQueues } from '../session-helpers';

/** Penutupan dibaca ulang tiap menit agar yang baru mulai atau berakhir tampil tanpa muat ulang. */
export const CLOSURE_REFRESH_MS = 60_000;

export const venueGraphKey = (venueId: VenueId) => ['venue-graph', venueId] as const;
export const closuresKey = (venueId: VenueId) => ['closures', venueId] as const;

/**
 * Graf semua lantai venue. Dimuat ulang setiap lantai berganti setelah antrean simpan
 * dikosongkan, sehingga perubahan di lantai yang baru ditinggalkan ikut terbaca.
 */
export function useVenueGraph(venueId: VenueId, floorId: FloorId | null) {
  return useQuery({
    queryKey: [...venueGraphKey(venueId), floorId],
    queryFn: async () => {
      await Promise.all(editorQueues().map((queue) => queue.flush()));
      return data.navGraph.listByVenue(venueId);
    },
    enabled: floorId !== null,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

/** Penutupan yang sedang berlaku dan yang terjadwal. */
export function useCurrentClosures(venueId: VenueId) {
  return useQuery({
    queryKey: closuresKey(venueId),
    queryFn: () => data.closures.listCurrent(venueId, new Date()),
    refetchInterval: CLOSURE_REFRESH_MS,
  });
}
