import type { Geometry } from '@indoor/domain';
import type { LngLatBoundsLike, Map as MapLibreMap } from 'maplibre-gl';
import { positionsOf } from './transform';

/** Zoom minimum saat mengarahkan peta ke satu fitur, agar ruang dan titik cukup besar. */
export const FOCUS_MIN_ZOOM = 19;
const FOCUS_MS = 500;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Kotak batas satu geometri, `null` bila tanpa koordinat. */
export function geometryBounds(geometry: Geometry): [[number, number], [number, number]] | null {
  const positions = positionsOf(geometry);
  if (positions.length === 0) return null;
  const xs = positions.map((p) => p[0]);
  const ys = positions.map((p) => p[1]);
  return [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
}

/**
 * Zoom tujuan: zoom sekarang dipertahankan bila fitur muat, dinaikkan ke `minZoom` bila
 * peta terlalu jauh, dan diturunkan bila fitur lebih besar dari layar (`fitZoom`).
 */
export function focusZoom(currentZoom: number, fitZoom: number, minZoom = FOCUS_MIN_ZOOM): number {
  return Math.min(fitZoom, Math.max(currentZoom, minZoom));
}

/** Tanpa animasi bila pengguna meminta gerak minimal. */
export function focusFeature(map: MapLibreMap, geometry: Geometry, padding = 64): void {
  const bounds = geometryBounds(geometry);
  if (!bounds) return;
  const [[minX, minY], [maxX, maxY]] = bounds;
  const camera = map.cameraForBounds(bounds as LngLatBoundsLike, {
    padding,
    bearing: map.getBearing(),
  });
  map.easeTo({
    center: [(minX + maxX) / 2, (minY + maxY) / 2],
    zoom: focusZoom(map.getZoom(), camera?.zoom ?? Number.POSITIVE_INFINITY),
    duration: prefersReducedMotion() ? 0 : FOCUS_MS,
  });
}

export function getCamera(map: MapLibreMap): {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
} {
  const { lng, lat } = map.getCenter();
  return {
    center: [lng, lat],
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  };
}
