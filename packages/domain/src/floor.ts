import type { BuildingId, FloorId, VenueId } from './ids';

export interface Floor {
  id: FloorId;
  venueId: VenueId;
  /** Kosong untuk lapisan Area Luar. */
  buildingId: BuildingId | null;
  isOutdoor: boolean;
  /** Nama tampilan: B1, GF, L1. */
  name: string;
  /** Bilangan bulat, boleh negatif (B1 = -1). */
  level: number;
  heightM: number;
  sortOrder: number;
  /** Jumlah fitur peta di lantai ini (untuk konfirmasi hapus). */
  featureCount: number;
}

export interface FloorInput {
  name: string;
  level: number;
  heightM: number;
}

export type FloorInputProblem = 'name_required' | 'level_integer' | 'height_range';

export const FLOOR_HEIGHT_RANGE = { min: 2, max: 30 } as const;

export function checkFloorInput(input: FloorInput): FloorInputProblem[] {
  const problems: FloorInputProblem[] = [];
  if (!input.name.trim()) problems.push('name_required');
  if (!Number.isInteger(input.level) || Math.abs(input.level) > 200) problems.push('level_integer');
  if (!(input.heightM >= FLOOR_HEIGHT_RANGE.min && input.heightM <= FLOOR_HEIGHT_RANGE.max)) {
    problems.push('height_range');
  }
  return problems;
}

/**
 * Urutan lantai dari atas ke bawah (pemilih lantai vertikal): level terbesar di atas,
 * sehingga B1 (−1) selalu di bawah GF (0). `sortOrder` hanya pemecah seri.
 */
export function sortFloorsTopDown<T extends Pick<Floor, 'level' | 'sortOrder'>>(
  floors: readonly T[],
): T[] {
  return [...floors].sort((a, b) => b.level - a.level || a.sortOrder - b.sortOrder);
}

interface ViewBuilding {
  id: string;
  defaultFloorId: string | null;
}
interface ViewFloor {
  id: string;
  buildingId: string | null;
  level: number;
  sortOrder: number;
}

/**
 * FR-VEN-06: tampilan awal = gedung default venue dan lantai default gedung itu.
 * Fallback: gedung pertama, lalu lantai level 0 (atau yang paling dekat ke 0).
 */
export function initialFloorView(
  defaultBuildingId: string | null,
  buildings: readonly ViewBuilding[],
  floors: readonly ViewFloor[],
): { buildingId: string; floorId: string } | null {
  const building = buildings.find((b) => b.id === defaultBuildingId) ?? buildings[0];
  if (!building) return null;
  const own = floors.filter((f) => f.buildingId === building.id);
  const floor =
    own.find((f) => f.id === building.defaultFloorId) ??
    [...own].sort(
      (a, b) =>
        Math.abs(a.level) - Math.abs(b.level) || b.level - a.level || a.sortOrder - b.sortOrder,
    )[0];
  return floor ? { buildingId: building.id, floorId: floor.id } : null;
}
