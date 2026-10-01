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
  | { kind: 'bounds'; bounds: [[number, number], [number, number]] };

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
  return bounds ? { kind: 'bounds', bounds } : null;
}

export function moveCamera(
  map: MapInstance,
  camera: InitialCamera,
  options: {
    animate: boolean;
    padding: CameraPadding;
    /** Batas zoom saat membingkai; bawaannya lantai kecil tidak diperbesar berlebihan. */
    maxZoom?: number;
  },
) {
  const duration = options.animate && !prefersReducedMotion() ? 300 : 0;
  if (camera.kind === 'view') {
    const { center, zoom, pitch, bearing } = camera;
    map.easeTo({ center, zoom, pitch, bearing, duration });
  } else {
    map.fitBounds(camera.bounds, {
      padding: options.padding,
      duration,
      bearing: map.getBearing(),
      maxZoom: options.maxZoom ?? MAX_FIT_ZOOM,
    });
  }
}

// Lantai yang sangat kecil tidak diperbesar sampai detail garis pecah.
const MAX_FIT_ZOOM = 20;
