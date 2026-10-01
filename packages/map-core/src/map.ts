import type { MapFeatureProperties } from '@indoor/domain';
import type { FeatureCollection, Geometry } from 'geojson';
import { type GeoJSONSource, type LngLatLike, Map as MapLibreMap } from 'maplibre-gl';
import { prefersReducedMotion } from './camera';
import { PITCH_3D } from './defaults';
import { build3dFeatures, FLOOR_3D_SOURCE_ID } from './extrude';
import type { LabelFont } from './layers/labels';
import { handleMissingFacilityIcons } from './sprites';
import {
  buildStyle,
  buildStyleLayers,
  FLOOR_SOURCE_ID,
  LAYERS_2D_ONLY,
  LAYERS_3D_ONLY,
  type MapDisplay,
  venueHeights,
} from './style';

export type ViewMode = '2d' | '3d';
export type FloorFeatureCollection = FeatureCollection<Geometry, MapFeatureProperties>;

export interface CreateMapOptions {
  center: LngLatLike;
  zoom?: number;
  bearing?: number;
  mode?: ViewMode;
  display?: MapDisplay;
  /** Durasi fade ikon/label (ms). Editor memakai 0: setiap perubahan data langsung tampil tanpa repaint beruntun. */
  fadeDuration?: number;
  /** Font label nama lokasi (Visitor); tanpa ini peta tidak menggambar label teks. */
  labelFont?: LabelFont;
}

const MODE_TRANSITION_MS = 300;

/** Peta MapLibre dengan style kosong: tidak ada tile server atau font dari internet. */
export function createMap(container: HTMLElement, options: CreateMapOptions): MapLibreMap {
  const mode = options.mode ?? '2d';
  const map = new MapLibreMap({
    container,
    style: buildStyle(options.display, options.labelFont ? { labelFont: options.labelFont } : {}),
    center: options.center,
    zoom: options.zoom ?? 18,
    bearing: options.bearing ?? 0,
    pitch: mode === '3d' ? PITCH_3D : 0,
    maxPitch: 60,
    attributionControl: false,
    ...(options.fadeDuration === undefined ? {} : { fadeDuration: options.fadeDuration }),
  });
  handleMissingFacilityIcons(map);
  states.set(map, { features: EMPTY, display: options.display ?? {}, mode });
  if (mode === '3d') map.once('load', () => applyModeVisibility(map, '3d'));
  return map;
}

const EMPTY: FloorFeatureCollection = { type: 'FeatureCollection', features: [] };

/** Data lantai terakhir, pengaturan tampilan, dan mode per peta (untuk membangun ulang 3D). */
interface MapState {
  features: FloorFeatureCollection;
  display: MapDisplay;
  mode: ViewMode;
}
const states = new WeakMap<MapLibreMap, MapState>();
const stateOf = (map: MapLibreMap): MapState =>
  states.get(map) ?? { features: EMPTY, display: {}, mode: map.getPitch() > 0 ? '3d' : '2d' };

/** Source 3D hanya berisi data saat mode 3D; mode 2D tidak membayar biaya ekstrusi. */
function refresh3d(map: MapLibreMap, state: MapState) {
  const source = map.getSource<GeoJSONSource>(FLOOR_3D_SOURCE_ID);
  source?.setData(
    state.mode === '3d' ? build3dFeatures(state.features, venueHeights(state.display)) : EMPTY,
  );
}

/** Berganti lantai = mengganti data satu source, bukan membuat peta baru. */
export function setFloorData(map: MapLibreMap, features: FloorFeatureCollection): void {
  const source = map.getSource<GeoJSONSource>(FLOOR_SOURCE_ID);
  if (!source) throw new Error(`Source ${FLOOR_SOURCE_ID} belum ada; tunggu event load.`);
  source.setData(features);
  const state = { ...stateOf(map), features };
  states.set(map, state);
  refresh3d(map, state);
}

/**
 * Menerapkan pengaturan tampilan venue tanpa membuat peta baru: warna
 * lewat paint property, tinggi lewat data 3D. Filter layer (fitur tersembunyi) tidak diubah.
 */
export function setMapDisplay(map: MapLibreMap, display: MapDisplay): void {
  const state = { ...stateOf(map), display };
  states.set(map, state);
  for (const layer of buildStyleLayers(display)) {
    if (!map.getLayer(layer.id) || !('paint' in layer) || !layer.paint) continue;
    for (const [property, value] of Object.entries(layer.paint)) {
      map.setPaintProperty(
        layer.id,
        property as Parameters<MapLibreMap['setPaintProperty']>[1],
        value,
      );
    }
  }
  refresh3d(map, state);
}

/** Tampil atau tidaknya layer khusus 2D/3D pada sebuah mode. */
export function modeVisibility(layerId: string, mode: ViewMode): 'visible' | 'none' {
  if ((LAYERS_2D_ONLY as readonly string[]).includes(layerId))
    return mode === '2d' ? 'visible' : 'none';
  if ((LAYERS_3D_ONLY as readonly string[]).includes(layerId))
    return mode === '3d' ? 'visible' : 'none';
  return 'visible';
}

function applyModeVisibility(map: MapLibreMap, mode: ViewMode) {
  for (const id of [...LAYERS_2D_ONLY, ...LAYERS_3D_ONLY]) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', modeVisibility(id, mode));
  }
}

/** `keepCamera`: hanya layer dan data yang berganti, kemiringan kamera tidak diubah (kamera tersimpan). */
export function setViewMode(
  map: MapLibreMap,
  mode: ViewMode,
  options: { keepCamera?: boolean } = {},
): void {
  const state = { ...stateOf(map), mode };
  states.set(map, state);
  refresh3d(map, state);
  applyModeVisibility(map, mode);
  if (options.keepCamera) return;
  map.easeTo({
    pitch: mode === '3d' ? PITCH_3D : 0,
    duration: prefersReducedMotion() ? 0 : MODE_TRANSITION_MS,
  });
}

export function getViewMode(map: MapLibreMap): ViewMode {
  return stateOf(map).mode;
}

/** Batas kotak semua fitur, untuk mengarahkan kamera ke lantai. */
export function featureBounds(
  features: FloorFeatureCollection,
): [[number, number], [number, number]] | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  const visit = (value: unknown): void => {
    if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
      minX = Math.min(minX, value[0]);
      minY = Math.min(minY, value[1]);
      maxX = Math.max(maxX, value[0]);
      maxY = Math.max(maxY, value[1]);
    } else if (Array.isArray(value)) {
      for (const item of value) visit(item);
    }
  };
  for (const feature of features.features) {
    if ('coordinates' in feature.geometry) visit(feature.geometry.coordinates);
  }
  return Number.isFinite(minX)
    ? [
        [minX, minY],
        [maxX, maxY],
      ]
    : null;
}

const REFERENCE_SOURCE = 'reference';

/** Bentuk acuan (misalnya footprint gedung lain) sebagai garis putus-putus. */
export function setReferenceShapes(map: MapLibreMap, data: FeatureCollection): void {
  const source = map.getSource<GeoJSONSource>(REFERENCE_SOURCE);
  if (source) {
    source.setData(data);
    return;
  }
  map.addSource(REFERENCE_SOURCE, { type: 'geojson', data });
  map.addLayer({
    id: 'reference-fill',
    type: 'fill',
    source: REFERENCE_SOURCE,
    paint: { 'fill-color': '#d5d9de', 'fill-opacity': 0.4 },
  });
  map.addLayer({
    id: 'reference-line',
    type: 'line',
    source: REFERENCE_SOURCE,
    paint: { 'line-color': '#545b64', 'line-width': 1.5, 'line-dasharray': [3, 2] },
  });
}
