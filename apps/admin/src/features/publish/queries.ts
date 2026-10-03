import type { VenueId } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

export const activePublicationKey = (venueId: VenueId) =>
  ['publications', venueId, 'active'] as const;

const historyKey = (venueId: VenueId) => ['publications', venueId, 'history'] as const;

export function useActivePublication(venueId: VenueId) {
  return useQuery({
    queryKey: activePublicationKey(venueId),
    queryFn: () => data.publications.active(venueId),
  });
}

export function usePublicationHistory(venueId: VenueId) {
  return useQuery({
    queryKey: historyKey(venueId),
    queryFn: () => data.publications.history(venueId),
  });
}

/** Versi aktif dan riwayat berubah setelah publish atau rollback, berhasil maupun tidak. */
function useRefreshPublications(venueId: VenueId) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['publications', venueId] });
}

export function usePublish(venueId: VenueId) {
  const refresh = useRefreshPublications(venueId);
  return useMutation({
    mutationFn: (notes: string) => data.publications.publish(venueId, notes),
    onSettled: refresh,
  });
}

export function useRollback(venueId: VenueId) {
  const refresh = useRefreshPublications(venueId);
  return useMutation({
    mutationFn: ({ version, notes }: { version: number; notes: string }) =>
      data.publications.rollback(venueId, version, notes),
    onSettled: refresh,
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

/** Snapshot draft untuk preview; dibangun server di memori setiap diminta. */
export function useDraftPreview(venueId: VenueId) {
  return useMutation({ mutationFn: () => data.publications.preview(venueId) });
}
