import {
  currentEvents,
  type EventListing,
  type EventOccurrence,
  type Snapshot,
  type VenueId,
} from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { data } from '../../data/client';
import { useExplore, useExploreStore } from '../search/explore-context';

export const EVENT_REFRESH_MS = 60_000;
export const EVENT_TICK_MS = 30_000;

export const eventsQuery = (venueId: VenueId) => ({
  queryKey: ['events', venueId] as const,
  queryFn: () => data.events.listCurrent(venueId, new Date()),
  staleTime: 30_000,
});

export function useLiveEvents(snapshot: Snapshot) {
  const { store } = useExplore();
  const mapReady = useExploreStore((s) => s.mapReady);
  const events = useQuery({
    ...eventsQuery(snapshot.venue.id as VenueId),
    enabled: mapReady,
    refetchInterval: EVENT_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  }).data;
  useEffect(() => {
    if (events) store.getState().setEvents(events);
  }, [events, store]);
}

export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function useEventListings(): EventListing[] {
  const { snapshot } = useExplore();
  const events = useExploreStore((s) => s.events);
  const now = useNow(EVENT_TICK_MS);
  return useMemo(
    () => currentEvents(events, snapshot.venue.timezone, new Date(now)),
    [events, snapshot.venue.timezone, now],
  );
}

export function occurrenceText(
  occurrence: EventOccurrence,
  timeZone: string,
  language: string,
): string {
  const format = new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  return format.formatRange(new Date(occurrence.startsAt), new Date(occurrence.endsAt));
}
