import type { VenueId, VenueInput } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';
import { useVenueSelection, venuesKey } from '../../app/venue-store';

const detailedKey = ['venues', 'detailed'] as const;

export function useVenuesDetailed() {
  return useQuery({ queryKey: detailedKey, queryFn: () => data.venues.listDetailed() });
}

export function useInvalidateVenues() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: venuesKey }),
      queryClient.invalidateQueries({ queryKey: detailedKey }),
      // Pemakaian kuota paket ikut berubah.
      queryClient.invalidateQueries({ queryKey: ['license', 'usage'] }),
    ]);
}

export function useSaveVenue() {
  const invalidate = useInvalidateVenues();
  const select = useVenueSelection((state) => state.setVenueId);
  return useMutation({
    mutationFn: async ({
      id,
      input,
      logo,
    }: {
      id: VenueId | null;
      input: VenueInput;
      logo: File | null;
    }) => {
      const venue = id ? await data.venues.update(id, input) : await data.venues.create(input);
      return logo ? data.venues.uploadLogo(venue.id, logo) : venue;
    },
    onSuccess: async (venue, { id }) => {
      // Daftar dimuat ulang dulu agar pilihan venue baru tidak dianggap tidak valid.
      await invalidate();
      if (!id) select(venue.id);
    },
  });
}

export function useRemoveVenue() {
  const invalidate = useInvalidateVenues();
  return useMutation({
    mutationFn: (id: VenueId) => data.venues.remove(id),
    onSuccess: invalidate,
  });
}
