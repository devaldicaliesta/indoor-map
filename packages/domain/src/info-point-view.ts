import type { Snapshot, SnapshotInfoPoint } from './snapshot';

/** Zoom awal layar Info Point: cukup dekat agar "Anda di sini" dan sekitarnya terbaca. */
export const INFO_POINT_ZOOM = 19.5;

/**
 * Snapshot untuk layar Info Point `code`: kamera awal di posisi Info Point dan diputar sesuai
 * arah hadapnya, mode awal dari pengaturan perangkat, dan 3D dimatikan bila dipaksa 2D (tombol 3D
 * ikut hilang). `null` bila kode tidak ada di snapshot.
 */
export function infoPointSnapshot(
  snapshot: Snapshot,
  code: string,
): { snapshot: Snapshot; infoPoint: SnapshotInfoPoint } | null {
  const infoPoint = snapshot.infoPoints.find((p) => p.code === code);
  if (!infoPoint) return null;
  const enabledFeatures = infoPoint.force2d
    ? snapshot.enabledFeatures.filter((f) => f !== '3d')
    : snapshot.enabledFeatures;
  return {
    infoPoint,
    snapshot: {
      ...snapshot,
      enabledFeatures,
      venue: {
        ...snapshot.venue,
        camera: {
          center: infoPoint.coordinates,
          zoom: INFO_POINT_ZOOM,
          pitch: 0,
          bearing: infoPoint.headingDeg,
        },
        display: {
          ...snapshot.venue.display,
          defaultMode: infoPoint.force2d ? '2d' : infoPoint.defaultMode,
        },
      },
    },
  };
}
