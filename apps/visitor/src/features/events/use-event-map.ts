import type { MapView, Snapshot, SnapshotIndex, VenueEvent } from '@indoor/domain';
import { type EventMark, type MapInstance, setEventMarks } from '@indoor/map-core';
import { useEffect, useMemo, useRef } from 'react';
import { originView } from '../origin/origin-model';
import { useExplore, useExploreStore } from '../search/explore-context';
import { useEventListings } from './use-live-events';

interface Placed {
  floorId: string;
  position: [number, number];
  onLocation: boolean;
}

export function eventPositions(
  snapshot: Snapshot,
  index: SnapshotIndex,
  event: VenueEvent,
): Placed[] {
  const placed: Placed[] = event.locationIds.flatMap((locationId) => {
    const view = originView(snapshot, index, { kind: 'location', locationId });
    return view
      ? [
          {
            floorId: view.floorId,
            position: [view.position[0], view.position[1]],
            onLocation: true,
          },
        ]
      : [];
  });
  if (event.point && index.floors.has(event.point.floorId)) {
    placed.push({
      floorId: event.point.floorId,
      position: event.point.coordinates,
      onLocation: false,
    });
  }
  return placed;
}

export function useEventMap({
  map,
  snapshot,
  floorIds,
  view,
  setView,
}: {
  map: MapInstance | null;
  snapshot: Snapshot;
  floorIds: readonly string[];
  view: MapView;
  setView: (view: MapView) => void;
}) {
  const { index } = useExplore();
  const listings = useEventListings();
  const eventId = useExploreStore((s) => s.eventId);
  const focusSeq = useExploreStore((s) => s.focus.seq);

  const marks = useMemo<EventMark[]>(
    () =>
      listings.flatMap(({ event, phase }) =>
        eventPositions(snapshot, index, event)
          .filter((p) => floorIds.includes(p.floorId))
          .map((p) => ({
            id: event.id,
            position: p.position,
            kind: event.kind,
            live: phase === 'live',
            onLocation: p.onLocation,
          })),
      ),
    [listings, snapshot, index, floorIds],
  );

  useEffect(() => {
    if (map) setEventMarks(map, marks);
  }, [map, marks]);

  const opened = listings.find((l) => l.event.id === eventId)?.event;
  const pointOnly =
    opened?.point && !opened.locationIds.some((id) => index.locations.has(id))
      ? opened.point
      : null;

  const latest = useRef({ view, setView });
  latest.current = { view, setView };
  const handled = useRef(-1);

  useEffect(() => {
    if (!map || !pointOnly || handled.current === focusSeq) return;
    handled.current = focusSeq;
    const floor = index.floors.get(pointOnly.floorId);
    if (!floor) return;
    if (latest.current.view.floorId !== floor.id) {
      latest.current.setView({ buildingId: floor.buildingId, floorId: floor.id });
    }
    map.easeTo({ center: pointOnly.coordinates, zoom: Math.max(map.getZoom(), 19) });
  }, [map, pointOnly, focusSeq, index]);

  return marks.length;
}
