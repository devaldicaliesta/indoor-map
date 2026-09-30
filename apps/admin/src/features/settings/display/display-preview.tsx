import { type CameraView, initialFloorView, sortFloorsTopDown, type VenueId } from '@indoor/domain';
import {
  createMap,
  featureBounds,
  getCamera,
  type MapDisplay,
  type MapInstance,
  setFacilityIcons,
  setFloorData,
  setMapDisplay,
  setViewMode,
  type ViewMode,
} from '@indoor/map-core';
import {
  type MapControlLabels,
  MapControls,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { data } from '../../../app/data-client';
import { facilityIconSpecs } from '../../facilities/icons';
import { useFacilityTypes } from '../../facilities/queries';
import { useBuildings } from '../../venues/buildings/queries';
import { useFloors } from '../../venues/floors/queries';

const LABELS: MapControlLabels = {
  zoomIn: 'Perbesar',
  zoomOut: 'Perkecil',
  resetNorth: 'Arahkan ke utara',
  viewMode: 'Mode tampilan',
  mode2d: '2D',
  mode3d: '3D',
};

/** Gedung dan lantai yang dipratinjau: awalnya gedung dan lantai default venue (FR-VEN-06). */
function usePreviewFloor(venueId: VenueId) {
  const venue = useQuery({ queryKey: ['venue', venueId], queryFn: () => data.venues.get(venueId) });
  const buildings = useBuildings(venueId).data ?? [];
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const building =
    buildings.find((b) => b.id === buildingId) ??
    buildings.find((b) => b.id === venue.data?.defaultBuildingId) ??
    buildings[0];
  const floors = sortFloorsTopDown(useFloors(building?.id ?? null).data ?? []);
  const [floorId, setFloorId] = useState<string | null>(null);
  const start = building ? initialFloorView(building.id, [building], floors) : null;
  const floor = floors.find((f) => f.id === floorId) ?? floors.find((f) => f.id === start?.floorId);
  return {
    buildings,
    building,
    floors,
    floor,
    setBuilding: (id: string) => {
      setBuildingId(id);
      setFloorId(null);
    },
    setFloor: setFloorId,
  };
}

/**
 * Pratinjau Pengaturan → Tampilan: lantai venue dengan warna dan tinggi yang sedang diisi
 * (belum disimpan), 2D/3D, dan tombol menyimpan kamera sekarang sebagai tampilan awal Visitor.
 */
export function DisplayPreview({
  venueId,
  display,
  camera,
  cameraActions,
}: {
  venueId: VenueId;
  display: MapDisplay;
  camera: CameraView | null;
  /** Tombol simpan/hapus tampilan awal; kosong untuk role mode baca. */
  cameraActions: (getCurrent: () => ReturnType<typeof getCamera> | null) => React.ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
  const [mode, setMode] = useState<ViewMode>('2d');
  const [bearing, setBearing] = useState(0);
  const selection = usePreviewFloor(venueId);
  const floorId = selection.floor?.id ?? null;
  const features = useQuery({
    queryKey: ['preview-features', floorId],
    queryFn: () => data.features.listByFloor(selection.floor?.id as NonNullable<typeof floorId>),
    enabled: floorId !== null,
  });
  const facilityTypes = useFacilityTypes(venueId).data;
  const savedCamera = useRef(camera);

  useEffect(() => {
    if (!container.current) return;
    const saved = savedCamera.current;
    const instance = createMap(container.current, {
      center: saved?.center ?? [106.8272, -6.1754],
      zoom: saved?.zoom ?? 18,
      bearing: saved?.bearing ?? 0,
    });
    instance.on('rotate', () => setBearing(instance.getBearing()));
    instance.once('load', () => setMap(instance));
    return () => instance.remove();
  }, []);

  // Kamera tersimpan dipakai sekali saat pertama tampil; selain itu lantai dibingkai penuh.
  const framed = useRef(false);
  useEffect(() => {
    if (!map || !features.data) return;
    setFloorData(map, features.data);
    if (framed.current) return;
    framed.current = true;
    const saved = savedCamera.current;
    if (saved) {
      map.jumpTo({ ...saved, center: saved.center });
      if (saved.pitch > 0) {
        setViewMode(map, '3d', { keepCamera: true });
        setMode('3d');
      }
      return;
    }
    const bounds = featureBounds(features.data);
    if (bounds) map.fitBounds(bounds, { padding: 32, duration: 0, maxZoom: 21 });
  }, [map, features.data]);

  const displayKey = JSON.stringify(display);
  useEffect(() => {
    if (map) setMapDisplay(map, display);
  }, [map, displayKey]);

  const specs = useMemo(() => facilityIconSpecs(facilityTypes ?? []), [facilityTypes]);
  const background = display.colors?.facility;
  useEffect(() => {
    if (map) void setFacilityIcons(map, specs, { background });
  }, [map, specs, background]);

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Select value={selection.building?.id ?? ''} onValueChange={selection.setBuilding}>
          <SelectTrigger aria-label="Gedung pratinjau" className="w-44">
            <SelectValue placeholder="Belum ada gedung" />
          </SelectTrigger>
          <SelectContent>
            {selection.buildings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selection.floor?.id ?? ''} onValueChange={selection.setFloor}>
          <SelectTrigger aria-label="Lantai pratinjau" className="w-28 font-mono">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {selection.floors.map((f) => (
              <SelectItem key={f.id} value={f.id} className="font-mono">
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="relative h-[28rem] overflow-hidden rounded-md border border-line">
        <div
          ref={container}
          className="size-full"
          data-testid="display-preview-map"
          data-mode={mode}
        />
        <MapControls
          className="absolute right-3 bottom-3"
          labels={LABELS}
          bearing={bearing}
          mode={mode}
          onModeChange={(next) => {
            if (map) setViewMode(map, next);
            setMode(next);
          }}
          onZoomIn={() => map?.zoomIn()}
          onZoomOut={() => map?.zoomOut()}
          onResetNorth={() => map?.easeTo({ bearing: 0 })}
        />
      </div>
      {cameraActions(() => (map ? getCamera(map) : null))}
    </div>
  );
}
