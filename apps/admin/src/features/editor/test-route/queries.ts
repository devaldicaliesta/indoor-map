import type { FloorId, VenueId } from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { data } from '../../../app/data-client';
import { editorQueues } from '../session-helpers';

/** Kunci template instruksi; halaman Instruksi (T-210) membatalkannya setelah menyimpan. */
export const instructionTemplatesKey = (venueId: VenueId) =>
  ['instruction-templates', venueId] as const;

/**
 * Fitur semua lantai venue. Seperti graf venue, dimuat ulang setiap lantai berganti setelah
 * antrean simpan dikosongkan; lantai yang sedang disunting dibaca dari store.
 */
export function useVenueFeatures(venueId: VenueId, floorId: FloorId | null) {
  return useQuery({
    queryKey: ['venue-features', venueId, floorId],
    queryFn: async () => {
      await Promise.all(editorQueues().map((queue) => queue.flush()));
      return data.features.listByVenue(venueId);
    },
    enabled: floorId !== null,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useOriginPoints(venueId: VenueId) {
  return useQuery({
    queryKey: ['origin-points', venueId],
    queryFn: () => data.originPoints.list(venueId),
  });
}

export function useInfoPoints(venueId: VenueId) {
  return useQuery({
    queryKey: ['info-points', venueId],
    queryFn: () => data.infoPoints.list(venueId),
  });
}

export function useInstructionTemplates(venueId: VenueId) {
  return useQuery({
    queryKey: instructionTemplatesKey(venueId),
    queryFn: () => data.instructionTemplates.get(venueId),
  });
}
