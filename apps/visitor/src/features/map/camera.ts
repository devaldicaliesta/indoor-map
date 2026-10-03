import type { Snapshot, SnapshotDisplayMode } from '@indoor/domain';
import {
  type FloorFeatureCollection,
  featureBounds,
  type MapInstance,
  PITCH_3D,
  prefersReducedMotion,
} from '@indoor/map-core';

export type InitialCamera =
  | { kind: 'view'; center: [number, number]; zoom: number; pitch: number; bearing: number }
  | { kind: 'bounds'; bounds: [[number, number], [number, number]]; bearing: number };

/** Lantai minimal sekian kali lebih lebar dari tingginya diputar di layar tegak. */
const ELONGATED = 1.8;

/**
 * Arah peta saat membingkai lantai: di layar tegak (HP), lantai yang sangat memanjang ke
 * timur–barat diputar 90° agar mengisi layar, bukan menjadi pita kecil; selain itu utara di atas.
 */
export function fitBearing(
  bounds: [[number, number], [number, number]],
  viewport: { width: number; height: number },
): number {
  const [[west, south], [east, north]] = bounds;
  const lat = ((south + north) / 2) * (Math.PI / 180);
  const widthM = (east - west) * Math.cos(lat);
  const heightM = north - south;
  const portrait = viewport.height > viewport.width * 1.2;
  return portrait && heightM > 0 && widthM / heightM >= ELONGATED ? 90 : 0;
}

/** Ruang di tepi peta yang tertutup kontrol, agar lantai dibingkai di area yang terlihat. */
export interface CameraPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Kamera awal venue dari Pengaturan → Tampilan; tanpa itu, lantai awal dibingkai penuh.
 * Kemiringan mengikuti mode yang dipakai (2D selalu tegak lurus).
 */
export function initialCamera(
  snapshot: Pick<Snapshot, 'venue'>,
  features: FloorFeatureCollection,
  mode: SnapshotDisplayMode,
  viewport: { width: number; height: number } = { width: 1, height: 1 },
): InitialCamera | null {
  const camera = snapshot.venue.camera;
  if (camera) {
    return {
      kind: 'view',
      center: camera.center,
      zoom: camera.zoom,
      bearing: camera.bearing,
      pitch: mode === '3d' ? camera.pitch || PITCH_3D : 0,
    };
  }
  const bounds = featureBounds(features);
  return bounds ? { kind: 'bounds', bounds, bearing: fitBearing(bounds, viewport) } : null;
}

export function moveCamera(
  map: MapInstance,
  camera: InitialCamera,
  options: { animate: boolean; padding: CameraPadding },
) {
  const duration = options.animate && !prefersReducedMotion() ? 300 : 0;
  if (camera.kind === 'view') {
    const { center, zoom, pitch, bearing } = camera;
    map.easeTo({ center, zoom, pitch, bearing, duration });
  } else {
    map.fitBounds(camera.bounds, {
      padding: options.padding,
      duration,
      bearing: camera.bearing,
      maxZoom: MAX_FIT_ZOOM,
    });
  }
}

// Lantai yang sangat kecil tidak diperbesar sampai detail garis pecah.
const MAX_FIT_ZOOM = 20;

/** Jarak kontrol dan bingkai kamera dari tepi peta. */
export const MAP_GAP_PX = 12;
/** Memilih dari daftar tidak memperbesar peta melewati zoom ini, agar sekitarnya tetap terlihat. */
const FOCUS_MAX_ZOOM = 19;

/**
 * Kamera ke pilihan pengunjung. `fit` membingkai pilihan di area yang tidak tertutup panel;
 * `pan` (diketuk di peta) hanya menggeser seperlunya, tanpa mengubah zoom.
 */
export function focusCamera(
  map: MapInstance,
  bounds: [[number, number], [number, number]],
  mode: 'fit' | 'pan',
  padding: CameraPadding,
) {
  const duration = prefersReducedMotion() ? 0 : 300;
  if (mode === 'fit') {
    map.fitBounds(bounds, {
      padding,
      duration,
      maxZoom: FOCUS_MAX_ZOOM,
      bearing: map.getBearing(),
    });
    return;
  }
  const [[minX, minY], [maxX, maxY]] = bounds;
  const point = map.project([(minX + maxX) / 2, (minY + maxY) / 2]);
  const { clientWidth: width, clientHeight: height } = map.getCanvas();
  const inside =
    point.x >= padding.left &&
    point.x <= width - padding.right &&
    point.y >= padding.top &&
    point.y <= height - padding.bottom;
  if (inside) return;
  const x = (padding.left + width - padding.right) / 2;
  const y = (padding.top + height - padding.bottom) / 2;
  map.panBy([point.x - x, point.y - y], { duration });
}
