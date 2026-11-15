import type { EventPageFilters, PageQuery } from '@indoor/data';
import type { EventInput, VenueId } from '@indoor/domain';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

export const EVENTS_REFRESH_MS = 60_000;

const eventsKey = (venueId: VenueId) => ['events', venueId] as const;

export function useEventPage(venueId: VenueId, query: PageQuery<EventPageFilters>) {
  return useQuery({
    queryKey: [...eventsKey(venueId), 'page', query],
    queryFn: () => data.events.listPage(venueId, query),
    placeholderData: keepPreviousData,
    refetchInterval: EVENTS_REFRESH_MS,
  });
}

export function useVenueLocationNames(venueId: VenueId) {
  return useQuery({
    queryKey: ['location-codes', venueId],
    queryFn: () => data.locations.codes(venueId),
  });
}

export interface EventSave {
  id: string | null;
  input: EventInput;
  image: File | null;
}

export function useEventMutations(venueId: VenueId) {
  const queryClient = useQueryClient();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: eventsKey(venueId) });
  return {
    save: useMutation({
      mutationFn: async ({ id, input, image }: EventSave) => {
        const uploaded = image ? await data.events.uploadImage(venueId, image) : null;
        const next = uploaded ? { ...input, imagePath: uploaded } : input;
        return id ? data.events.update(id, next) : data.events.create(venueId, next);
      },
      onSettled,
    }),
    remove: useMutation({ mutationFn: (id: string) => data.events.remove(id), onSettled }),
  };
}

export const eventImageUrl = (path: string) => data.events.imageUrl(path);
