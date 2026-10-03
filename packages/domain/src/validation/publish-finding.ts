// Dipakai juga Edge Function `publish` (Deno): hanya impor berekstensi `.ts` tanpa zod.
import type { SnapshotSource } from '../snapshot-source.ts';
import { GEOMETRY_ISSUE_CODES, type IssueSeverity } from './geometry.ts';

export const PUBLISH_FINDING_CODES = [
  ...GEOMETRY_ISSUE_CODES,
  'missing_entrance',
  'location_without_unit',
  'unreachable',
  'origin_not_connected',
  'connector_one_sided',
  'escalator_stops',
  'connector_stops',
  'floor_without_lift',
  'required_field_empty',
  'instruction_en_empty',
  'plan_not_georeferenced',
  'opening_date_passed',
] as const;
export type PublishFindingCode = (typeof PUBLISH_FINDING_CODES)[number];

/** Satu temuan; `floorId` dan `featureIds` dipakai Admin untuk membuka lantai dan menyorot. */
export interface PublishFinding {
  code: PublishFindingCode;
  severity: IssueSeverity;
  message: string;
  floorId: string | null;
  /** Gedung lantai temuan; `null` untuk Area Luar atau temuan tanpa lantai. */
  buildingId: string | null;
  featureIds: string[];
  locationId: string | null;
  connectorId: string | null;
}

export interface PublishContext {
  /** Tanggal hari ini di zona waktu venue, `YYYY-MM-DD`. */
  today: string;
  /** Denah aktif per lantai; tidak termasuk di snapshot. */
  floorPlans: readonly { floorId: string; georeferenced: boolean }[];
}

export function finding(
  code: PublishFindingCode,
  severity: IssueSeverity,
  message: string,
  scope: Partial<
    Pick<PublishFinding, 'floorId' | 'featureIds' | 'locationId' | 'connectorId'>
  > = {},
): PublishFinding {
  return {
    code,
    severity,
    message,
    floorId: scope.floorId ?? null,
    buildingId: null,
    featureIds: scope.featureIds ?? [],
    locationId: scope.locationId ?? null,
    connectorId: scope.connectorId ?? null,
  };
}

export type Labels = (floorId: string) => string;

export function floorLabels(source: SnapshotSource): Labels {
  const buildings = new Map(source.buildings.map((b) => [b.id, b.name]));
  const names = new Map(
    source.floors.map((f) => [
      f.id,
      f.buildingId ? `${f.name} ${buildings.get(f.buildingId) ?? ''}`.trim() : f.name,
    ]),
  );
  return (floorId) => names.get(floorId) ?? 'lantai tidak dikenal';
}

export function byFloor<T extends { floorId: string }>(items: readonly T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.floorId) ?? [];
    list.push(item);
    groups.set(item.floorId, list);
  }
  return groups;
}
