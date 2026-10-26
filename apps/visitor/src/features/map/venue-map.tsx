import {
  allows3d,
  buildingFloors,
  buildingView,
  initialMapView,
  initialViewMode,
  linkedMapView,
  type MapView,
  mapLabels,
  type Snapshot,
  type SnapshotDisplayMode,
  unitColors,
  visibleFloorIds,
} from '@indoor/domain';
import {
  categoryUnitColors,
  createMap,
  type FloorFeatureCollection,
  type MapDisplay,
  type MapInstance,
  setBasemap,
  setFacilityIcons,
  setFloorData,
  setLabels,
  setMapLabel,
  setViewMode,
} from '@indoor/map-core';
import { FloorSwitcher, type MapControlLabels, MapControls } from '@indoor/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../app/use-media-query';
import { DESKTOP_QUERY, MOBILE_HEADER_PX } from '../../app/visitor-shell';
import { PEEK_HEIGHT_PX } from '../../components/sheet-snap';
import { useInfoPointMode } from '../../infopoint/info-point-mode';
import { useClosureMap } from '../closures/use-closure-map';
import { useOriginMap } from '../origin/use-origin-map';
import { useRouteMap } from '../route/use-route-map';
import { useExplore } from '../search/explore-context';
import { BuildingPicker } from './building-picker';
import {
  type CameraPadding,
  type InitialCamera,
  initialCamera,
  MAP_GAP_PX,
  moveCamera,
} from './camera';
import { useExploreMap } from './explore-map';
import { categoryIconSpecs, facilityIconSpecs } from './facility-icons';
import { LABEL_FONT } from './label-font';
import { markMapFailed, useMapAvailable } from './map-support';
import { MapUnavailable } from './map-unavailable';
import { useCrowdMap } from './use-crowd-map';

/** Isi pastel dan tepi per unit dari warna kategori lokasinya (dihitung sekali per snapshot). */
const unitPaint = new WeakMap<Snapshot, Map<string, { fill: string; outline: string }>>();

function paintOf(snapshot: Snapshot) {
  let paint = unitPaint.get(snapshot);
  if (!paint) {
    paint = new Map(
      [...unitColors(snapshot)].map(([id, color]) => [id, categoryUnitColors(color)]),
    );
    unitPaint.set(snapshot, paint);
  }
  return paint;
}

/**
 * Pelat lantai dari footprint gedung, digambar di bawah unit seperti lantai pada peta indoor
 * komersial. Bukan fitur snapshot, jadi tidak bisa diketuk.
 */
function floorSlabs(
  snapshot: Snapshot,
  floorIds: readonly string[],
): FloorFeatureCollection['features'] {
  const footprints = new Map(snapshot.buildings.map((b) => [b.id, b.footprint]));
  return snapshot.floors.flatMap((floor) => {
    const footprint = floor.buildingId ? footprints.get(floor.buildingId) : null;
    if (!footprint || !floorIds.includes(floor.id)) return [];
    const id = `slab-${floor.id}`;
    return [
      {
        type: 'Feature',
        geometry: footprint,
        properties: { id, kind: 'corridor', floorId: floor.id },
      },
    ];
  });
}

function floorCollection(snapshot: Snapshot, floorIds: readonly string[]): FloorFeatureCollection {
  const visible = new Set(floorIds);
  const paint = paintOf(snapshot);
  return {
    type: 'FeatureCollection',
    features: [...floorSlabs(snapshot, floorIds), ...snapshot.features.features]
      .filter((f) => visible.has(f.properties.floorId))
      .map((f) => {
        const colors = paint.get(f.properties.id);
        return colors
          ? { ...f, properties: { ...f.properties, color: colors.fill, outline: colors.outline } }
          : f;
      }),
  };
}

function startCamera(snapshot: Snapshot, view: MapView, mode: SnapshotDisplayMode) {
  const floorIds = view.floorId ? visibleFloorIds(snapshot, view.floorId) : [];
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  return initialCamera(snapshot, floorCollection(snapshot, floorIds), mode, viewport);
}

// Pemilih gedung di kiri atas dan kolom lantai/kontrol di kanan (lebar kontrol 44 px).
const PICKER_PX = 44;
const CONTROLS_PX = 44;

/** Peta venue, atau pesan pengganti di perangkat tanpa WebGL (panel cari dan rute tetap jalan). */
export function VenueMap({ snapshot }: { snapshot: Snapshot }) {
  return useMapAvailable() ? <VenueMapCanvas snapshot={snapshot} /> : <MapUnavailable />;
}

/**
 * Peta venue dari snapshot: gedung dan lantai default, kamera awal, 2D/3D bila lisensi
 * membukanya, serta nama lokasi dan ikon fasilitas yang saling menyembunyikan saat bertumpuk.
 */
function VenueMapCanvas({ snapshot }: { snapshot: Snapshot }) {
  const { t } = useTranslation();
  // Di HP kontrol tidak boleh tertutup kolom cari di atas dan bottom sheet di bawah.
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const inset = isDesktop
    ? { top: MAP_GAP_PX, bottom: MAP_GAP_PX }
    : { top: MOBILE_HEADER_PX + MAP_GAP_PX, bottom: PEEK_HEIGHT_PX + MAP_GAP_PX };
  const padding: CameraPadding = {
    top: inset.top + PICKER_PX + MAP_GAP_PX,
    bottom: inset.bottom + MAP_GAP_PX,
    left: MAP_GAP_PX,
    right: CONTROLS_PX + 2 * MAP_GAP_PX,
  };
  const paddingRef = useRef(padding);
  paddingRef.current = padding;
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
  const { link, routeSnapshot } = useExplore();
  const initialView = useMemo(
    () => (link && linkedMapView(snapshot, link)) ?? initialMapView(snapshot),
    [snapshot, link],
  );
  const [view, setView] = useState<MapView>(initialView);
  const [mode, setMode] = useState<SnapshotDisplayMode>(() => initialViewMode(snapshot));
  const [bearing, setBearing] = useState(0);
  // Orang mini tampil di Visitor biasa; Info Point menyala seharian sehingga tidak dianimasikan.
  const infoPoint = useInfoPointMode();
  const [people, setPeople] = useState(() => infoPoint === null);
  // Mode yang sudah diterapkan ke peta; perubahan dari tombol 2D/3D saja yang memiringkan kamera.
  const appliedMode = useRef<SnapshotDisplayMode>(initialViewMode(snapshot));
  const firstCamera = useRef<InitialCamera | null>(null);
  firstCamera.current ??= startCamera(snapshot, initialView, initialViewMode(snapshot));

  const floorIds = useMemo(
    () => (view.floorId ? visibleFloorIds(snapshot, view.floorId) : []),
    [snapshot, view.floorId],
  );
  const features = useMemo(() => floorCollection(snapshot, floorIds), [snapshot, floorIds]);
  const { labelIds, markedFloors } = useExploreMap({
    map,
    snapshot,
    view,
    setView,
    padding,
    isDesktop,
  });
  useOriginMap({ map, snapshot, view, setView, padding, isDesktop });
  useRouteMap({ map, snapshot, view, setView, padding, isDesktop });
  // Penutupan jalur dan konektor butuh graf; sebelum graf termuat hanya area yang ditandai.
  useClosureMap(map, routeSnapshot ?? snapshot, floorIds);
  useCrowdMap(map, snapshot, routeSnapshot, floorIds, people);
  const labels = useMemo(
    () => mapLabels(snapshot, floorIds, labelIds),
    [snapshot, floorIds, labelIds],
  );
  const floors = useMemo(
    () =>
      view.buildingId
        ? buildingFloors(snapshot, view.buildingId).map((f) => ({ id: f.id, label: f.name }))
        : [],
    [snapshot, view.buildingId],
  );

  useEffect(() => {
    if (!container) return;
    const display: MapDisplay = {
      heights: snapshot.venue.display.heights,
      colors: snapshot.venue.display.colors,
    };
    const camera = firstCamera.current;
    let instance: MapInstance;
    try {
      instance = createMap(container, {
        center: camera?.kind === 'view' ? camera.center : [0, 0],
        zoom: camera?.kind === 'view' ? camera.zoom : 1,
        bearing: camera?.kind === 'view' ? camera.bearing : 0,
        mode: initialViewMode(snapshot),
        display,
        labelFont: LABEL_FONT,
      });
    } catch {
      // Konteks WebGL2 ditolak walau pemeriksaan awal lolos (GPU di daftar blokir, memori habis).
      markMapFailed();
      return;
    }
    instance.on('rotate', () => setBearing(instance.getBearing()));
    // Status kamera untuk test E2E; ditulis langsung ke elemen agar tidak memicu render.
    container.dataset.camera = 'idle';
    instance.on('movestart', () => {
      container.dataset.camera = 'moving';
    });
    instance.on('moveend', () => {
      container.dataset.camera = 'idle';
    });
    instance.once('load', () => {
      if (snapshot.basemap) setBasemap(instance, snapshot.basemap);
      if (camera) moveCamera(instance, camera, { animate: false, padding: paddingRef.current });
      const icons = [
        ...facilityIconSpecs(snapshot.facilityTypes),
        ...categoryIconSpecs(snapshot.categories, snapshot.locationTypes),
      ];
      void setFacilityIcons(instance, icons, {
        background: snapshot.venue.display.colors.facility,
      });
      setMap(instance);
    });
    return () => instance.remove();
  }, [container, snapshot]);

  useEffect(() => {
    if (!map) return;
    setFloorData(map, features);
    setLabels(map, labels);
  }, [map, features, labels]);

  useEffect(() => {
    if (map) setMapLabel(map, t('map.canvas'));
  }, [map, t]);

  useEffect(() => {
    if (!map || appliedMode.current === mode) return;
    appliedMode.current = mode;
    setViewMode(map, mode);
  }, [map, mode]);

  function changeBuilding(buildingId: string) {
    const next = buildingView(snapshot, buildingId);
    setView(next);
    const camera = startCamera(snapshot, next, mode);
    if (map && camera?.kind === 'bounds') moveCamera(map, camera, { animate: true, padding });
  }

  function resetView() {
    const initialMode = initialViewMode(snapshot);
    setView(initialView);
    setMode(initialMode);
    if (!map) return;
    // Kemiringan diatur kamera awal, bukan transisi mode.
    appliedMode.current = initialMode;
    setViewMode(map, initialMode, { keepCamera: true });
    const camera = startCamera(snapshot, initialView, initialMode);
    if (camera) moveCamera(map, camera, { animate: true, padding });
  }

  const controlLabels: MapControlLabels = {
    zoomIn: t('map.zoomIn'),
    zoomOut: t('map.zoomOut'),
    resetNorth: t('map.resetNorth'),
    resetView: t('map.resetView'),
    viewMode: t('map.viewMode'),
    mode2d: t('map.mode2d'),
    mode3d: t('map.mode3d'),
    people: t('map.people'),
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={setContainer}
        className="h-full w-full"
        data-testid="venue-map"
        data-ready={map ? 'true' : 'false'}
        data-floor-id={view.floorId ?? ''}
        data-people={people ? 'on' : 'off'}
      />
      <div className="absolute left-3 max-w-[calc(100%-6rem)]" style={{ top: inset.top }}>
        <BuildingPicker
          buildings={snapshot.buildings}
          value={view.buildingId}
          onChange={changeBuilding}
          className="w-48 max-w-full bg-surface font-bold shadow-float"
        />
      </div>
      <div
        className="pointer-events-none absolute right-3 flex flex-col items-end justify-between gap-3"
        style={{ top: inset.top, bottom: inset.bottom }}
      >
        <div
          className="pointer-events-auto min-h-0 overflow-y-auto rounded-sm"
          data-tour="visitor-floors"
        >
          {floors.length > 1 ? (
            <FloorSwitcher
              floors={floors}
              value={view.floorId}
              onChange={(floorId) => setView({ ...view, floorId })}
              label={t('map.floors')}
              marked={markedFloors}
              markedLabel={t('map.floorHasResults')}
            />
          ) : null}
        </div>
        <div className="pointer-events-auto shrink-0" data-tour="visitor-map-controls">
          <MapControls
            labels={controlLabels}
            bearing={bearing}
            mode={mode}
            onModeChange={setMode}
            allow3d={allows3d(snapshot)}
            onZoomIn={() => map?.zoomIn()}
            onZoomOut={() => map?.zoomOut()}
            onResetNorth={() => map?.easeTo({ bearing: 0 })}
            onResetView={resetView}
            people={people}
            onPeopleChange={setPeople}
          />
        </div>
      </div>
    </div>
  );
}
