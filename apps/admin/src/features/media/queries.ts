import type { MediaAsset, VenueId } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

const mediaKey = (venueId: VenueId) => ['media', venueId] as const;

export function useMediaAssets(venueId: VenueId) {
  return useQuery({
    queryKey: mediaKey(venueId),
    queryFn: () => data.media.list(venueId),
  });
}

/** URL pratinjau; denah memakai URL bertanda yang berlaku satu jam. */
export function useMediaPreviews(venueId: VenueId, assets: readonly MediaAsset[] | undefined) {
  return useQuery({
    queryKey: [...mediaKey(venueId), 'previews', assets?.map((a) => a.path) ?? []],
    queryFn: () => data.media.previewUrls(assets ?? []),
    enabled: assets !== undefined,
    staleTime: 30 * 60_000,
  });
}

export function useMediaMutations(venueId: VenueId) {
  const queryClient = useQueryClient();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: mediaKey(venueId) });
  return {
    upload: useMutation({
      mutationFn: (files: readonly File[]) =>
        Promise.all(files.map((file) => data.media.upload(venueId, file))),
      onSettled,
    }),
    remove: useMutation({
      mutationFn: (asset: MediaAsset) => data.media.remove(venueId, asset),
      onSettled,
    }),
  };
}
