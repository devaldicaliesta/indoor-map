import type { MapFeatureProperties } from '@indoor/domain';
import type { FeatureCollection, Geometry } from 'geojson';
import { type GeoJSONSource, type LngLatLike, Map as MapLibreMap } from 'maplibre-gl';
import { prefersReducedMotion } from './camera';
import { PITCH_3D } from './defaults';
import { handleMissingFacilityIcons } from './sprites';
import {
  buildStyle,
  FLOOR_SOURCE_ID,
  LAYERS_2D_ONLY,
  LAYERS_3D_ONLY,
  type MapDisplay,
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
}

const MODE_TRANSITION_MS = 300;

/** Peta MapLibre dengan style kosong: tidak ada tile server atau font dari internet. */
export function createMap(container: HTMLElement, options: CreateMapOptions): MapLibreMap {
  const mode = options.mode ?? '2d';
  const map = new MapLibreMap({
    container,
    style: buildStyle(options.display),
    center: options.center,
    zoom: options.zoom ?? 18,
    bearing: options.bearing ?? 0,
    pitch: mode === '3d' ? PITCH_3D : 0,
    maxPitch: 60,
    attributionControl: false,
    ...(options.fadeDuration === undefined ? {} : { fadeDuration: options.fadeDuration }),
  });
  handleMissingFacilityIcons(map);
  if (mode === '3d') map.once('load', () => applyModeVisibility(map, '3d'));
  return map;
}

/** Berganti lantai = mengganti data satu source, bukan membuat peta baru. */
export function setFloorData(map: MapLibreMap, features: FloorFeatureCollection): void {
  const source = map.getSource<GeoJSONSource>(FLOOR_SOURCE_ID);
  if (!source) throw new Error(`Source ${FLOOR_SOURCE_ID} belum ada; tunggu event load.`);
  source.setData(features);
}

function applyModeVisibility(map: MapLibreMap, mode: ViewMode) {
  for (const id of LAYERS_2D_ONLY)
    map.setLayoutProperty(id, 'visibility', mode === '2d' ? 'visible' : 'none');
  for (const id of LAYERS_3D_ONLY)
    map.setLayoutProperty(id, 'visibility', mode === '3d' ? 'visible' : 'none');
}

export function setViewMode(map: MapLibreMap, mode: ViewMode): void {
  applyModeVisibility(map, mode);
  map.easeTo({
    pitch: mode === '3d' ? PITCH_3D : 0,
    duration: prefersReducedMotion() ? 0 : MODE_TRANSITION_MS,
  });
}

export function getViewMode(map: MapLibreMap): ViewMode {
  return map.getPitch() > 0 ? '3d' : '2d';
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
