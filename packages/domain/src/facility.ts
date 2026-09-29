import type { FacilityTypeId, VenueId } from './ids';

/**
 * Piktogram bawaan (05-desain-ui.md "Ruang, bentuk, ikon"); gambarnya di
 * `packages/ui/src/pictograms`. Urutan ini dipakai di pemilih ikon.
 */
export const PICTOGRAM_KEYS = [
  'toilet-male',
  'toilet-female',
  'toilet-accessible',
  'prayer-room',
  'atm',
  'first-aid',
  'information',
  'fire-extinguisher',
  'assembly-point',
  'emergency-exit',
  'elevator',
  'escalator',
  'stairs',
  'parking',
] as const;
export type PictogramKey = (typeof PICTOGRAM_KEYS)[number];

/** Ikon jenis fasilitas: piktogram bawaan, atau gambar unggahan di Storage `public-assets`. */
export type FacilityIcon =
  | { kind: 'builtin'; key: PictogramKey }
  | { kind: 'upload'; path: string };

const BUILTIN_PREFIX = 'builtin:';

/** `facility_types.icon_path`: `builtin:<kunci>` untuk piktogram bawaan, selain itu path Storage. */
export function parseFacilityIcon(iconPath: string | null): FacilityIcon | null {
  if (!iconPath) return null;
  if (iconPath.startsWith(BUILTIN_PREFIX)) {
    const key = iconPath.slice(BUILTIN_PREFIX.length);
    return (PICTOGRAM_KEYS as readonly string[]).includes(key)
      ? { kind: 'builtin', key: key as PictogramKey }
      : null;
  }
  return { kind: 'upload', path: iconPath };
}

export function facilityIconPath(icon: FacilityIcon | null): string | null {
  if (!icon) return null;
  return icon.kind === 'builtin' ? `${BUILTIN_PREFIX}${icon.key}` : icon.path;
}

export interface FacilityType {
  id: FacilityTypeId;
  venueId: VenueId;
  name: string;
  icon: FacilityIcon | null;
  /** Fasilitas keselamatan (APAR, titik kumpul, pintu darurat) berlatar merah di peta. */
  isSafety: boolean;
  sortOrder: number;
}

export interface FacilityTypeInput {
  name: string;
  isSafety: boolean;
  /** Ikon unggahan diisi lewat repository setelah berkasnya tersimpan. */
  icon: FacilityIcon | null;
}

export const FACILITY_TYPE_NAME_MAX = 60;
export type FacilityTypeNameProblem = 'required' | 'too_long' | 'duplicate';

/** Nama unik per venue; dibandingkan tanpa membedakan huruf besar/kecil agar "Toilet" dan "toilet" tidak kembar. */
export function checkFacilityTypeName(
  name: string,
  others: readonly { id: string; name: string }[],
  selfId: string | null,
): FacilityTypeNameProblem[] {
  const value = name.trim();
  if (!value) return ['required'];
  if (value.length > FACILITY_TYPE_NAME_MAX) return ['too_long'];
  const lower = value.toLocaleLowerCase('id');
  const clash = others.some(
    (t) => t.id !== selfId && t.name.trim().toLocaleLowerCase('id') === lower,
  );
  return clash ? ['duplicate'] : [];
}

/** Urutan tampil: `sort_order`, lalu nama. */
export function sortFacilityTypes<T extends Pick<FacilityType, 'name' | 'sortOrder'>>(
  types: readonly T[],
): T[] {
  return [...types].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'id'));
}

/** Ikon unggahan: SVG atau PNG ≤ 200 kB (FR-MAP-07, T-112). */
export const MAX_FACILITY_ICON_BYTES = 200 * 1024;
export type FacilityIconFormat = 'svg' | 'png';
export type FacilityIconFileProblem = 'empty' | 'too_large' | 'unsupported_type';
export type FacilityIconFileCheck =
  | { ok: true; format: FacilityIconFormat }
  | { ok: false; problem: FacilityIconFileProblem };

const ICON_MIME: Record<string, FacilityIconFormat> = {
  'image/svg+xml': 'svg',
  'image/png': 'png',
};
const ICON_EXTENSION: Record<string, FacilityIconFormat> = { svg: 'svg', png: 'png' };

/** MIME (bila dikirim browser) dan ekstensi harus sepakat. */
export function checkFacilityIconFile(file: {
  name: string;
  type: string;
  size: number;
}): FacilityIconFileCheck {
  const byExtension = ICON_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''];
  const byMime = file.type ? ICON_MIME[file.type] : byExtension;
  if (!byExtension || byMime !== byExtension) return { ok: false, problem: 'unsupported_type' };
  if (file.size === 0) return { ok: false, problem: 'empty' };
  if (file.size > MAX_FACILITY_ICON_BYTES) return { ok: false, problem: 'too_large' };
  return { ok: true, format: byExtension };
}
