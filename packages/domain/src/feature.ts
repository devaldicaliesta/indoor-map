import { z } from 'zod';

/** Sama dengan enum `feature_kind` di migrasi 0001. */
export const FEATURE_KINDS = [
  'unit',
  'corridor',
  'wall',
  'door',
  'elevator',
  'escalator',
  'stairs',
  'exit',
  'non_walkable',
  'outdoor_area',
  'facility',
  'landmark',
] as const;
export const FeatureKindSchema = z.enum(FEATURE_KINDS);
export type FeatureKind = z.infer<typeof FeatureKindSchema>;

export const UNIT_STATUSES = ['occupied', 'vacant', 'renovation'] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

/** Properti GeoJSON fitur peta di snapshot dan editor (03-arsitektur.md "Format snapshot"). */
export interface MapFeatureProperties {
  id: string;
  kind: FeatureKind;
  floorId: string;
  name?: string;
  unitCode?: string;
  unitStatus?: UnitStatus;
  /** Override tinggi 3D dalam meter (FR-VIS-02). */
  height?: number;
  /** Override warna `#rrggbb`. */
  color?: string;
  facilityTypeId?: string;
}
