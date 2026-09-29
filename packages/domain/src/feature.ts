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
  /** Hanya untuk `outdoor_area`. */
  subtype?: OutdoorSubtype;
  /** Luas koreksi manual (m²); tanpa nilai ini luas dihitung dari geometri. */
  areaM2?: number;
}

/** Bentuk geometri tiap jenis fitur; menentukan alat gambar yang dipakai. */
export type FeatureShape = 'polygon' | 'linestring' | 'point';
export const KIND_SHAPE: Record<FeatureKind, FeatureShape> = {
  unit: 'polygon',
  corridor: 'polygon',
  elevator: 'polygon',
  escalator: 'polygon',
  stairs: 'polygon',
  non_walkable: 'polygon',
  outdoor_area: 'polygon',
  wall: 'linestring',
  door: 'point',
  exit: 'point',
  facility: 'point',
  landmark: 'point',
};

/** Subjenis `outdoor_area` di lapisan Area Luar, disimpan di `props.subtype`. */
export const OUTDOOR_SUBTYPES = ['road', 'garden', 'parking'] as const;
export type OutdoorSubtype = (typeof OUTDOOR_SUBTYPES)[number];

/** Pilihan jenis saat menggambar (FR-MAP-01). Fasilitas dan penanda punya alur sendiri. */
export interface DrawKind {
  kind: FeatureKind;
  subtype?: OutdoorSubtype;
}

const INDOOR_KINDS: FeatureKind[] = [
  'unit',
  'corridor',
  'elevator',
  'escalator',
  'stairs',
  'non_walkable',
  'wall',
  'door',
  'exit',
];
const OUTDOOR_KINDS: FeatureKind[] = ['non_walkable', 'wall', 'door', 'exit'];

export function drawKindsFor(shape: FeatureShape, isOutdoor: boolean): DrawKind[] {
  const kinds = (isOutdoor ? OUTDOOR_KINDS : INDOOR_KINDS)
    .filter((k) => KIND_SHAPE[k] === shape)
    .map((kind) => ({ kind }));
  if (isOutdoor && shape === 'polygon') {
    return [
      ...OUTDOOR_SUBTYPES.map((subtype) => ({ kind: 'outdoor_area' as const, subtype })),
      ...kinds,
    ];
  }
  return kinds;
}

export type UnitCodeProblem = 'required' | 'too_long' | 'format';
export const UNIT_CODE_MAX = 32;

/** Kode unit disimpan huruf besar; unik per venue tanpa membedakan huruf besar/kecil. */
export function normalizeUnitCode(code: string): string {
  return code.trim().toUpperCase();
}

export function checkUnitCode(code: string): UnitCodeProblem[] {
  const value = normalizeUnitCode(code);
  if (!value) return ['required'];
  if (value.length > UNIT_CODE_MAX) return ['too_long'];
  return /^[A-Z0-9][A-Z0-9._/-]*$/.test(value) ? [] : ['format'];
}
