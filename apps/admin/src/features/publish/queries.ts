import type { VenueId } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

export const activePublicationKey = (venueId: VenueId) =>
  ['publications', venueId, 'active'] as const;

export function useActivePublication(venueId: VenueId) {
  return useQuery({
    queryKey: activePublicationKey(venueId),
    queryFn: () => data.publications.active(venueId),
  });
}

export function usePublish(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => data.publications.publish(venueId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: activePublicationKey(venueId) }),
  });
}

/** Validasi draft di server; hasil terakhir disimpan di mutation (dijalankan atas permintaan). */
export function useValidateDraft(venueId: VenueId) {
  return useMutation({ mutationFn: () => data.publications.validate(venueId) });
}

/** Ringkasan perubahan draft sejak versi aktif; dihitung server atas permintaan. */
export function useDraftChanges(venueId: VenueId) {
  return useMutation({ mutationFn: () => data.publications.changes(venueId) });
}
