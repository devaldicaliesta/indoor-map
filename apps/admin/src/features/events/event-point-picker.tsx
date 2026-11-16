import { type EventPoint, type FloorId, OUTDOOR_BUILDING, type VenueId } from '@indoor/domain';
import {
  createMap,
  featureBounds,
  type MapInstance,
  setFloorData,
  setOriginMarkers,
} from '@indoor/map-core';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FloorSwitcher,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { data } from '../../app/data-client';
import { useFloorChoice } from '../locations/unit-map-picker';

const FALLBACK_CENTER: [number, number] = [106.8272, -6.1754];

export function EventPointPicker({
  venueId,
  initial,
  onDone,
  onClose,
}: {
  venueId: VenueId;
  initial: EventPoint | null;
  onDone: (point: EventPoint) => void;
  onClose: () => void;
}) {
  const choice = useFloorChoice(venueId, undefined);
  const [floorOverride, setFloorOverride] = useState<string | null>(initial?.floorId ?? null);
  const floorId = (floorOverride ?? choice.floorId) as FloorId | null;
  const [point, setPoint] = useState<EventPoint | null>(initial);
  const floor = useQuery({
    queryKey: ['picker-floor', floorId],
    queryFn: () => data.features.listByFloor(floorId as FloorId),
    enabled: floorId !== null,
  });

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<MapInstance | null>(null);

  useEffect(() => {
    if (!container) return;
    const instance = createMap(container, { center: FALLBACK_CENTER, zoom: 18 });
    instance.once('load', () => setMap(instance));
    return () => instance.remove();
  }, [container]);

  useEffect(() => {
    if (!map || !floorId) return;
    const pick = (e: { lngLat: { lng: number; lat: number } }) =>
      setPoint({ floorId, coordinates: [e.lngLat.lng, e.lngLat.lat] });
    map.on('click', pick);
    return () => {
      map.off('click', pick);
    };
  }, [map, floorId]);

  const features = floor.data;
  useEffect(() => {
    if (!map || !features) return;
    setFloorData(map, features);
    const bounds = featureBounds(features);
    if (bounds) map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 21 });
  }, [map, features]);

  useEffect(() => {
    if (!map) return;
    setOriginMarkers(
      map,
      point && point.floorId === floorId
        ? [{ id: 'event', position: point.coordinates, headingDeg: null, selected: true }]
        : [],
    );
  }, [map, point, floorId]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Titik event di peta</DialogTitle>
          <DialogDescription>
            Klik peta untuk menaruh titik, misalnya panggung di lobi atau stan di area umum.
          </DialogDescription>
        </DialogHeader>
        <Select
          value={choice.building}
          onValueChange={(value) => {
            setFloorOverride(null);
            choice.setBuilding(value);
          }}
        >
          <SelectTrigger aria-label="Gedung" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {choice.buildings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
            <SelectItem value={OUTDOOR_BUILDING}>{choice.outdoorName}</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative h-[55vh] overflow-hidden rounded-md border border-line">
          <div ref={setContainer} className="size-full" data-testid="event-point-map" />
          {!choice.isOutdoor && choice.floors.length > 0 ? (
            <FloorSwitcher
              label="Lantai"
              className="absolute top-3 right-3"
              floors={choice.floors.map((f) => ({ id: f.id, label: f.name }))}
              value={floorId}
              onChange={(id) => setFloorOverride(id)}
            />
          ) : null}
        </div>
        <DialogFooter className="sm:items-center">
          <p className="mr-auto text-ink-muted text-sm" aria-live="polite">
            {point ? 'Titik dipilih.' : 'Belum ada titik.'}
          </p>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" disabled={!point} onClick={() => point && onDone(point)}>
            Pakai titik ini
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
