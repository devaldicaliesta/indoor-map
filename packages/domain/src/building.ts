import type { Polygon } from './geometry';
import type { BuildingId, FloorId, VenueId } from './ids';

export interface Building {
  id: BuildingId;
  venueId: VenueId;
  name: string;
  /** Unik per venue, misalnya GU atau GEDUNG-B. */
  code: string;
  footprint: Polygon | null;
  defaultFloorId: FloorId | null;
  sortOrder: number;
  /** Jumlah lantai gedung (tidak termasuk Area Luar). */
  floorCount: number;
}

export interface BuildingInput {
  name: string;
  code: string;
  footprint: Polygon | null;
}

export type BuildingInputProblem = 'name_required' | 'code_required' | 'code_format';

/** Kode gedung: huruf, angka, dan tanda hubung, maksimal 12 karakter. */
const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,11}$/;

export function normalizeBuildingCode(code: string): string {
  return code.trim().toUpperCase();
}

export function checkBuildingInput(input: BuildingInput): BuildingInputProblem[] {
  const problems: BuildingInputProblem[] = [];
  if (!input.name.trim()) problems.push('name_required');
  const code = normalizeBuildingCode(input.code);
  if (!code) problems.push('code_required');
  else if (!CODE_PATTERN.test(code)) problems.push('code_format');
  return problems;
}
