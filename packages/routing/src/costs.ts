import type { SnapshotConnectorKind } from '@indoor/domain';

/**
 * Bobot konektor dalam meter ekuivalen (03-arsitektur.md "Routing"): biaya berpindah lantai
 * dinyatakan sebagai jarak berjalan yang setara, sehingga rute menimbang "jalan lebih jauh"
 * terhadap "naik lift". Jarak horizontal antar-pemberhentian ditambahkan terpisah di
 * `connectors.ts`.
 */

/** Menunggu dan naik-turun lift: biaya tetap per perjalanan … */
export const ELEVATOR_BASE_M = 15;
/** … ditambah per lantai yang dilewati. */
export const ELEVATOR_PER_FLOOR_M = 3;
/** Eskalator per lantai (satu eskalator biasanya satu lantai). */
export const ESCALATOR_PER_FLOOR_M = 10;
/** Tangga per lantai; lebih mahal dari eskalator karena berjalan sendiri. */
export const STAIRS_PER_FLOOR_M = 12;
/** Pintu gedung antara lantai dasar dan Area Luar: tidak ada perpindahan lantai. */
export const BUILDING_DOOR_M = 0;

/** Bobot tetap satu perjalanan konektor yang melewati `floors` lantai (selisih level). */
export function connectorCost(kind: SnapshotConnectorKind, floors: number): number {
  switch (kind) {
    case 'elevator':
      return ELEVATOR_BASE_M + ELEVATOR_PER_FLOOR_M * floors;
    case 'escalator':
      return ESCALATOR_PER_FLOOR_M * floors;
    case 'stairs':
      return STAIRS_PER_FLOOR_M * floors;
    case 'building_door':
      return BUILDING_DOOR_M;
  }
}
