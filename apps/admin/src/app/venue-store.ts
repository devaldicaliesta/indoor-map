import type { VenueId } from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { data } from './data-client';

interface VenueSelection {
  venueId: VenueId | null;
  setVenueId: (venueId: VenueId) => void;
}

/** Venue terpilih; semua menu bekerja pada venue ini dan pilihannya diingat di localStorage. */
export const useVenueSelection = create<VenueSelection>()(
  persist((set) => ({ venueId: null, setVenueId: (venueId) => set({ venueId }) }), {
    name: 'indoor-admin.venue',
  }),
);

export const venuesKey = ['venues', 'list'] as const;

export function useSelectedVenue() {
  const { venueId, setVenueId } = useVenueSelection();
  const venues = useQuery({ queryKey: venuesKey, queryFn: () => data.venues.list() });
  const list = venues.data ?? [];
  const venue = list.find((v) => v.id === venueId) ?? list[0] ?? null;

  // Pilihan tersimpan bisa sudah dihapus; jatuhkan ke venue pertama yang ada.
  useEffect(() => {
    if (venue && venue.id !== venueId) setVenueId(venue.id);
  }, [venue, venueId, setVenueId]);

  return { venues: list, venue, setVenueId, isLoading: venues.isLoading, error: venues.error };
}
