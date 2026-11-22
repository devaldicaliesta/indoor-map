import type { VenueId } from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { data } from '../../app/data-client';

export function useVenueDashboard(venueId: VenueId) {
  return useQuery({
    queryKey: ['venue-dashboard', venueId],
    queryFn: () => data.venueDashboard.get(venueId),
  });
}

/** Validasi publish dijalankan server setiap dasbor dibuka (hasil disimpan 1 menit). */
export function useDashboardFindings(venueId: VenueId, enabled: boolean) {
  return useQuery({
    queryKey: ['venue-dashboard', venueId, 'findings'],
    queryFn: () => data.publications.validate(venueId),
    enabled,
    staleTime: 60_000,
  });
}
