import type { FacilityIcon } from './facility';
import type { UnitStatus } from './feature';
import type {
  BuildingId,
  CategoryId,
  FeatureId,
  FloorId,
  LocationId,
  LocationTypeId,
  VenueId,
} from './ids';
import { checkUniqueName, type NameProblem, sortByOrder } from './names';
import { normalizeSearchText } from './search';
import type { SnapshotFieldValue } from './snapshot';

/** Sama dengan enum `location_status` di migrasi 0001. Status diubah lewat T-304. */
export const LOCATION_STATUSES = [
  'active',
  'coming_soon',
  'inactive_temporary',
  'inactive_permanent',
] as const;
export type LocationStatus = (typeof LOCATION_STATUSES)[number];

/** Aturan integritas 4: lokasi yang bukan nonaktif permanen memakai unitnya. */
export function holdsUnits(status: LocationStatus): boolean {
  return status !== 'inactive_permanent';
}

export interface LocationTypeSummary {
  id: LocationTypeId;
  name: string;
}

/** Ikonnya berformat sama dengan ikon jenis fasilitas. */
export interface Category {
  id: CategoryId;
  locationTypeId: LocationTypeId;
  name: string;
  icon: FacilityIcon | null;
  sortOrder: number;
}

export interface CategoryInput {
  name: string;
  /** Ikon unggahan diisi lewat repository setelah berkasnya tersimpan. */
  icon: FacilityIcon | null;
}

export const CATEGORY_NAME_MAX = 60;

/** Nama kategori unik per tipe lokasi, tanpa membedakan huruf besar/kecil. */
export function checkCategoryName(
  name: string,
  others: readonly { id: string; name: string }[],
  selfId: string | null,
): NameProblem[] {
  return checkUniqueName(name, others, selfId, CATEGORY_NAME_MAX);
}

export const sortCategories = sortByOrder;

/**
 * Memindah kategori satu langkah ke atas (-1) atau ke bawah (1). Hasilnya urutan baru
 * seluruh kategori, dinomori ulang 0..n-1 agar nilai `sort_order` yang sama tidak tersisa.
 */
export function moveCategory<T extends { id: string; name: string; sortOrder: number }>(
  categories: readonly T[],
  id: string,
  step: -1 | 1,
): { id: T['id']; sortOrder: number }[] {
  const ordered = sortByOrder(categories);
  const from = ordered.findIndex((c) => c.id === id);
  const to = from + step;
  if (from >= 0 && to >= 0 && to < ordered.length) {
    const [moved] = ordered.splice(from, 1);
    if (moved) ordered.splice(to, 0, moved);
  }
  return ordered.map((c, index) => ({ id: c.id, sortOrder: index }));
}

/** Unit tempat lokasi berada, dengan gedung dan lantainya untuk tabel dan filter. */
export interface LocationUnit {
  featureId: FeatureId;
  unitCode: string;
  floorId: FloorId;
  floorName: string;
  /** Kosong untuk unit di lapisan Area Luar. */
  buildingId: BuildingId | null;
  buildingName: string | null;
  isPrimary: boolean;
}

export interface Location {
  id: LocationId;
  venueId: VenueId;
  locationTypeId: LocationTypeId;
  code: string | null;
  name: string;
  description: string | null;
  logoPath: string | null;
  photoPaths: string[];
  status: LocationStatus;
  categoryIds: CategoryId[];
  units: LocationUnit[];
  /** Nilai field kustom per kunci (`locations.custom_fields`). */
  customFields: Record<string, SnapshotFieldValue>;
}

/** Lokasi yang menempati sebuah unit (panel properti unit di editor). */
export interface LocationRef {
  id: LocationId;
  name: string;
  status: LocationStatus;
}

export interface LocationInput {
  code: string;
  name: string;
  description: string;
  categoryIds: CategoryId[];
  unitIds: FeatureId[];
  /** Unit utama; tanpa pilihan, unit pertama yang menjadi utama. */
  primaryUnitId: FeatureId | null;
  /** Nilai field kustom tipe lokasinya, sudah divalidasi `parseCustomFieldInputs`. */
  customFields: Record<string, SnapshotFieldValue>;
}

export const LOCATION_NAME_MAX = 120;
export const LOCATION_DESCRIPTION_MAX = 500;
export const LOCATION_CODE_MAX = 32;
export const LOCATION_PHOTOS_MAX = 5;

/** Kode lokasi disimpan huruf besar, sama dengan kode unit; unik per venue. */
export function normalizeLocationCode(code: string): string {
  return code.trim().toUpperCase();
}

export type LocationCodeProblem =
  | { problem: 'too_long' | 'format' }
  | { problem: 'duplicate'; owner: string };

/** Kode lokasi opsional: kosong sah; bila diisi, formatnya sama dengan kode unit. */
export function checkLocationCode(
  code: string,
  others: readonly { id: string; code: string | null; name: string }[],
  selfId: string | null,
): LocationCodeProblem | null {
  const value = normalizeLocationCode(code);
  if (!value) return null;
  if (value.length > LOCATION_CODE_MAX) return { problem: 'too_long' };
  if (!/^[A-Z0-9][A-Z0-9._/-]*$/.test(value)) return { problem: 'format' };
  const owner = others.find((other) => other.id !== selfId && other.code?.toUpperCase() === value);
  return owner ? { problem: 'duplicate', owner: owner.name } : null;
}

export interface LocationInputProblems {
  name?: 'required' | 'too_long';
  code?: LocationCodeProblem;
  description?: 'too_long';
}

export function checkLocationInput(
  input: Pick<LocationInput, 'code' | 'name' | 'description'>,
  others: readonly { id: string; code: string | null; name: string }[],
  selfId: string | null,
): LocationInputProblems {
  const problems: LocationInputProblems = {};
  const name = input.name.trim();
  if (!name) problems.name = 'required';
  else if (name.length > LOCATION_NAME_MAX) problems.name = 'too_long';
  const code = checkLocationCode(input.code, others, selfId);
  if (code) problems.code = code;
  if (input.description.trim().length > LOCATION_DESCRIPTION_MAX) problems.description = 'too_long';
  return problems;
}

/** Unit utama dulu, lalu urut kode unit. */
export function orderedUnits(units: readonly LocationUnit[]): LocationUnit[] {
  return [...units].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      a.unitCode.localeCompare(b.unitCode, 'id', { numeric: true }),
  );
}

/** Nilai filter gedung untuk unit di lapisan Area Luar (tidak punya gedung). */
export const OUTDOOR_BUILDING = 'outdoor';

/** Semua filter berlaku bersamaan. */
export interface LocationFilter {
  query: string;
  categoryId: CategoryId | null;
  building: BuildingId | typeof OUTDOOR_BUILDING | null;
  floorId: FloorId | null;
  /** Hanya lokasi yang belum tertaut ke unit. */
  unlinkedOnly: boolean;
}

export const EMPTY_LOCATION_FILTER: LocationFilter = {
  query: '',
  categoryId: null,
  building: null,
  floorId: null,
  unlinkedOnly: false,
};

function inBuilding(unit: LocationUnit, building: LocationFilter['building']): boolean {
  if (building === null) return true;
  return building === OUTDOOR_BUILDING ? unit.buildingId === null : unit.buildingId === building;
}

/**
 * Gedung dan lantai cocok bila salah satu unit lokasi ada di sana. Pencarian (tanpa
 * membedakan huruf besar/kecil dan diakritik) mencakup nama, kode lokasi, dan kode unit.
 */
export function matchesLocationFilter(location: Location, filter: LocationFilter): boolean {
  if (filter.unlinkedOnly && location.units.length > 0) return false;
  if (filter.categoryId && !location.categoryIds.includes(filter.categoryId)) return false;
  if (filter.building !== null || filter.floorId !== null) {
    const placed = location.units.some(
      (unit) =>
        inBuilding(unit, filter.building) &&
        (filter.floorId === null || unit.floorId === filter.floorId),
    );
    if (!placed) return false;
  }
  const query = normalizeSearchText(filter.query);
  if (!query) return true;
  return [location.name, location.code ?? '', ...location.units.map((u) => u.unitCode)].some(
    (text) => normalizeSearchText(text).includes(query),
  );
}

const collator = new Intl.Collator('id-ID', { numeric: true, sensitivity: 'base' });

export function filterLocations(
  locations: readonly Location[],
  filter: LocationFilter,
): Location[] {
  return locations
    .filter((location) => matchesLocationFilter(location, filter))
    .sort(
      (a, b) => collator.compare(a.name, b.name) || collator.compare(a.code ?? '', b.code ?? ''),
    );
}

/** Unit di venue beserta lokasi aktif yang memakainya, untuk memilih unit lokasi. */
export interface VenueUnit {
  featureId: FeatureId;
  unitCode: string;
  unitStatus: UnitStatus | null;
  floorId: FloorId;
  floorName: string;
  floorLevel: number;
  buildingId: BuildingId | null;
  buildingName: string | null;
  /** Lokasi yang memakai unit ini dan bukan nonaktif permanen. */
  holders: { locationId: LocationId; name: string }[];
}

/** Lokasi aktif lain yang memakai unit, atau `null` bila unit boleh dipilih lokasi `selfId`. */
export function otherHolder(
  unit: Pick<VenueUnit, 'holders'>,
  selfId: LocationId | null,
): VenueUnit['holders'][number] | null {
  return unit.holders.find((holder) => holder.locationId !== selfId) ?? null;
}

/** Saran untuk kolom "ketik kode unit": cocok persis, lalu berawalan, lalu memuat teksnya. */
export function suggestUnits(units: readonly VenueUnit[], query: string, limit = 8): VenueUnit[] {
  const value = normalizeLocationCode(query);
  if (!value) return [];
  const rank = (code: string) => (code === value ? 0 : code.startsWith(value) ? 1 : 2);
  return units
    .filter((unit) => unit.unitCode.toUpperCase().includes(value))
    .sort(
      (a, b) =>
        rank(a.unitCode.toUpperCase()) - rank(b.unitCode.toUpperCase()) ||
        collator.compare(a.unitCode, b.unitCode),
    )
    .slice(0, limit);
}
