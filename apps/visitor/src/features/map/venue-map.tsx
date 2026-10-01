import {
  allows3d,
  buildingFloors,
  buildingView,
  initialMapView,
  initialViewMode,
  type MapView,
  mapLabels,
  type Snapshot,
  type SnapshotDisplayMode,
  visibleFloorIds,
} from '@indoor/domain';
import {
  createMap,
  type FloorFeatureCollection,
  type MapDisplay,
  type MapInstance,
  setFacilityIcons,
  setFloorData,
  setLabels,
  setViewMode,
} from '@indoor/map-core';
import { FloorSwitcher, type MapControlLabels, MapControls } from '@indoor/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../app/use-media-query';
import { DESKTOP_QUERY, MOBILE_HEADER_PX } from '../../app/visitor-shell';
import { PEEK_HEIGHT_PX, snapHeight } from '../../components/sheet-snap';
import { useBrowseStore } from '../search/browse-store';
import { BuildingPicker } from './building-picker';
import { type CameraPadding, type InitialCamera, initialCamera, moveCamera } from './camera';
import { facilityIconSpecs } from './facility-icons';
import { LABEL_FONT } from './label-font';
import { useMapBrowse } from './use-map-browse';

function floorCollection(snapshot: Snapshot, floorIds: readonly string[]): FloorFeatureCollection {
  const visible = new Set(floorIds);
  return {
    type: 'FeatureCollection',
    features: snapshot.features.features.filter((f) => visible.has(f.properties.floorId)),
  };
}

function startCamera(snapshot: Snapshot, view: MapView, mode: SnapshotDisplayMode) {
  const floorIds = view.floorId ? visibleFloorIds(snapshot, view.floorId) : [];
  return initialCamera(snapshot, floorCollection(snapshot, floorIds), mode);
}

const GAP_PX = 12;
// Pemilih gedung di kiri atas dan kolom lantai/kontrol di kanan (lebar kontrol 44 px).
const PICKER_PX = 44;
const CONTROLS_PX = 44;

/**
 * Peta venue dari snapshot: gedung dan lantai default, kamera awal, 2D/3D bila lisensi
 * membukanya, nama lokasi dan ikon fasilitas yang saling menyembunyikan saat bertumpuk, serta
 * sorotan dan ketuk yang terhubung ke panel (`useMapBrowse`).
 */
export function VenueMap({ snapshot }: { snapshot: Snapshot }) {
  const { t } = useTranslation();
  // Di HP kontrol tidak boleh tertutup kolom cari di atas dan bottom sheet di bawah.
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const inset = isDesktop
    ? { top: GAP_PX, bottom: GAP_PX }
    : { top: MOBILE_HEADER_PX + GAP_PX, bottom: PEEK_HEIGHT_PX + GAP_PX };
  const padding: CameraPadding = {
    top: inset.top + PICKER_PX + GAP_PX,
    bottom: inset.bottom + GAP_PX,
    left: GAP_PX,
    right: CONTROLS_PX + 2 * GAP_PX,
  };
  const paddingRef = useRef(padding);
  paddingRef.current = padding;
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
  const initialView = useMemo(() => initialMapView(snapshot), [snapshot]);
  const [view, setView] = useState<MapView>(initialView);
  const [mode, setMode] = useState<SnapshotDisplayMode>(() => initialViewMode(snapshot));
  const [bearing, setBearing] = useState(0);
  // Mode yang sudah diterapkan ke peta; perubahan dari tombol 2D/3D saja yang memiringkan kamera.
  const appliedMode = useRef<SnapshotDisplayMode>(initialViewMode(snapshot));
  const firstCamera = useRef<InitialCamera | null>(null);
  firstCamera.current ??= startCamera(snapshot, initialView, initialViewMode(snapshot));

  const floorIds = useMemo(
    () => (view.floorId ? visibleFloorIds(snapshot, view.floorId) : []),
    [snapshot, view.floorId],
  );
  const features = useMemo(() => floorCollection(snapshot, floorIds), [snapshot, floorIds]);
  const browse = useMapBrowse({
    map,
    view,
    setView,
    // Di HP target dibingkai di atas bottom sheet setinggi yang sedang dipakai.
    focusPadding: () =>
      isDesktop
        ? padding
        : {
            ...padding,
            bottom: snapHeight(useBrowseStore.getState().sheet, window.innerHeight) + GAP_PX,
          },
  });
  const labels = useMemo(
    () => mapLabels(snapshot, floorIds, browse.labelIds),
    [snapshot, floorIds, browse.labelIds],
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
    const instance = createMap(container, {
      center: camera?.kind === 'view' ? camera.center : [0, 0],
      zoom: camera?.kind === 'view' ? camera.zoom : 1,
      bearing: camera?.kind === 'view' ? camera.bearing : 0,
      mode: initialViewMode(snapshot),
      display,
      labelFont: LABEL_FONT,
    });
    instance.on('rotate', () => setBearing(instance.getBearing()));
    instance.once('load', () => {
      if (camera) moveCamera(instance, camera, { animate: false, padding: paddingRef.current });
      void setFacilityIcons(instance, facilityIconSpecs(snapshot.facilityTypes), {
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
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={setContainer}
        className="h-full w-full"
        data-testid="venue-map"
        data-ready={map ? 'true' : 'false'}
        data-floor-id={view.floorId ?? ''}
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
        <div className="pointer-events-auto min-h-0 overflow-y-auto rounded-sm">
          {floors.length > 1 ? (
            <FloorSwitcher
              floors={floors}
              value={view.floorId}
              onChange={(floorId) => setView({ ...view, floorId })}
              label={t('map.floors')}
              marked={browse.markedFloorIds}
              markedLabel={t('browse.floorMarked')}
            />
          ) : null}
        </div>
        <MapControls
          className="pointer-events-auto shrink-0"
          labels={controlLabels}
          bearing={bearing}
          mode={mode}
          onModeChange={setMode}
          allow3d={allows3d(snapshot)}
          onZoomIn={() => map?.zoomIn()}
          onZoomOut={() => map?.zoomOut()}
          onResetNorth={() => map?.easeTo({ bearing: 0 })}
          onResetView={resetView}
        />
      </div>
    </div>
  );
}
