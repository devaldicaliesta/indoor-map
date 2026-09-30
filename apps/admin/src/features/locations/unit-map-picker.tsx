import {
  type Building,
  type BuildingId,
  type FeatureId,
  type Floor,
  type FloorId,
  type LocationId,
  OUTDOOR_BUILDING,
  otherHolder,
  type VenueId,
  type VenueUnit,
} from '@indoor/domain';
import {
  createMap,
  featureBounds,
  LAYER_IDS,
  type MapInstance,
  setFloorData,
  setMutedFeatures,
  setSelectionHighlight,
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { data } from '../../app/data-client';
import { useBuildings, useOutdoorLayer } from '../venues/buildings/queries';
import { useFloors } from '../venues/floors/queries';
import { placeText, UNIT_STATUS_TEXT } from './labels';

const FALLBACK_CENTER: [number, number] = [106.8272, -6.1754];

function defaultFloor(building: Building | undefined, floors: readonly Floor[]): Floor | undefined {
  return (
    floors.find((f) => f.id === building?.defaultFloorId) ??
    [...floors].sort((a, b) => Math.abs(a.level) - Math.abs(b.level))[0]
  );
}

function unitInfo(unit: VenueUnit, selfId: LocationId | null, outdoorName: string): string {
  const holder = otherHolder(unit, selfId);
  const state = holder
    ? `dipakai ${holder.name}`
    : unit.unitStatus
      ? UNIT_STATUS_TEXT[unit.unitStatus]
      : '';
  return [unit.unitCode, placeText(unit, outdoorName), state].filter(Boolean).join(' · ');
}

/** Lantai yang ditampilkan: gedung/lantai unit pertama yang sudah dipilih, atau default venue. */
function useFloorChoice(venueId: VenueId, start: VenueUnit | undefined) {
  const buildings = useBuildings(venueId).data ?? [];
  const outdoor = useOutdoorLayer(venueId).data;
  const [buildingChoice, setBuilding] = useState<string | null>(
    start ? (start.buildingId ?? OUTDOOR_BUILDING) : null,
  );
  const [floorChoice, setFloor] = useState<FloorId | null>(start?.floorId ?? null);
  const building = buildingChoice ?? buildings[0]?.id ?? OUTDOOR_BUILDING;
  const isOutdoor = building === OUTDOOR_BUILDING;
  const floors = useFloors(isOutdoor ? null : (building as BuildingId)).data ?? [];
  const floorId = isOutdoor
    ? (outdoor?.floorId ?? null)
    : ((
        floors.find((f) => f.id === floorChoice) ??
        defaultFloor(
          buildings.find((b) => b.id === building),
          floors,
        )
      )?.id ?? null);
  return {
    buildings,
    outdoorName: outdoor?.name ?? 'Area Luar',
    building,
    isOutdoor,
    floors,
    floorId,
    setBuilding: (value: string) => {
      setBuilding(value);
      setFloor(null);
    },
    setFloor,
  };
}

export function UnitMapPicker({
  venueId,
  units,
  selfId,
  initial,
  onDone,
  onClose,
}: {
  venueId: VenueId;
  units: readonly VenueUnit[];
  selfId: LocationId | null;
  initial: readonly FeatureId[];
  onDone: (selected: FeatureId[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<FeatureId[]>([...initial]);
  const [hovered, setHovered] = useState<FeatureId | null>(null);
  const [message, setMessage] = useState<string>();
  const byId = useMemo(() => new Map(units.map((u) => [u.featureId, u])), [units]);
  const choice = useFloorChoice(venueId, byId.get(initial[0] as FeatureId));
  const floor = useQuery({
    queryKey: ['picker-floor', choice.floorId],
    queryFn: () => data.features.listByFloor(choice.floorId as FloorId),
    enabled: choice.floorId !== null,
  });

  // Isi dialog dirender lewat portal setelah render pertama; ref berupa state agar peta
  // dibuat begitu elemennya ada.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
  const latest = useRef({ byId, selfId, outdoorName: choice.outdoorName });
  latest.current = { byId, selfId, outdoorName: choice.outdoorName };

  useEffect(() => {
    if (!container) return;
    const instance = createMap(container, { center: FALLBACK_CENTER, zoom: 18 });
    const unitAt = (point: { x: number; y: number }) => {
      const hit = instance
        .queryRenderedFeatures([point.x, point.y], { layers: [LAYER_IDS.rooms] })
        .find((f) => f.properties?.kind === 'unit');
      const id = hit?.properties?.id;
      return typeof id === 'string' ? latest.current.byId.get(id as FeatureId) : undefined;
    };
    instance.on('mousemove', (e) => {
      const unit = unitAt(e.point);
      instance.getCanvas().style.cursor = unit ? 'pointer' : '';
      setHovered(unit?.featureId ?? null);
    });
    instance.on('click', (e) => {
      const unit = unitAt(e.point);
      if (!unit) return;
      const holder = otherHolder(unit, latest.current.selfId);
      if (holder) {
        setMessage(`Unit ${unit.unitCode} sudah dipakai lokasi "${holder.name}".`);
        return;
      }
      setMessage(undefined);
      setSelected((current) =>
        current.includes(unit.featureId)
          ? current.filter((id) => id !== unit.featureId)
          : [...current, unit.featureId],
      );
    });
    instance.once('load', () => setMap(instance));
    return () => instance.remove();
  }, [container]);

  const features = floor.data;
  useEffect(() => {
    if (!map || !features) return;
    setFloorData(map, features);
    const bounds = featureBounds(features);
    if (bounds) map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 21 });
  }, [map, features]);

  const muted = useMemo(
    () =>
      units
        .filter((u) => u.floorId === choice.floorId && otherHolder(u, selfId))
        .map((u) => u.featureId),
    [units, choice.floorId, selfId],
  );
  useEffect(() => {
    if (!map) return;
    setMutedFeatures(map, muted);
    setSelectionHighlight(map, selected);
  }, [map, muted, selected]);

  const hoveredUnit = hovered ? byId.get(hovered) : undefined;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Pilih unit di peta</DialogTitle>
          <DialogDescription>
            Klik unit untuk memilih atau melepasnya. Unit abu-abu sudah dipakai lokasi lain.
          </DialogDescription>
        </DialogHeader>
        <Select value={choice.building} onValueChange={choice.setBuilding}>
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
        <div className="relative h-[60vh] overflow-hidden rounded-md border border-line">
          <div ref={setContainer} className="size-full" data-testid="unit-picker-map" />
          {!choice.isOutdoor && choice.floors.length > 0 ? (
            <FloorSwitcher
              label="Lantai"
              className="absolute top-3 right-3"
              floors={choice.floors.map((f) => ({ id: f.id, label: f.name }))}
              value={choice.floorId}
              onChange={(id) => choice.setFloor(id as FloorId)}
            />
          ) : null}
        </div>
        <p className="min-h-5 text-sm" aria-live="polite">
          {hoveredUnit ? unitInfo(hoveredUnit, selfId, choice.outdoorName) : null}
        </p>
        {message ? (
          <p role="alert" className="text-danger text-sm">
            {message}
          </p>
        ) : null}
        <DialogFooter className="sm:items-center">
          <p className="mr-auto text-ink-muted text-sm">
            {selected.length
              ? `${selected.length} unit dipilih: ${selected
                  .map((id) => byId.get(id)?.unitCode ?? '?')
                  .join(', ')}`
              : 'Belum ada unit dipilih.'}
          </p>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={() => onDone(selected)}>
            Pakai unit terpilih
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
