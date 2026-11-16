import type { FacilityTypeId, VenueId } from './ids';
import { checkUniqueName, type NameProblem, sortByOrder } from './names';
import { isPictogramKey, type PictogramKey } from './pictograms';

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
    return isPictogramKey(key) ? { kind: 'builtin', key } : null;
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
export type FacilityTypeNameProblem = NameProblem;

/** Nama unik per venue, tanpa membedakan huruf besar/kecil. */
export function checkFacilityTypeName(
  name: string,
  others: readonly { id: string; name: string }[],
  selfId: string | null,
): FacilityTypeNameProblem[] {
  return checkUniqueName(name, others, selfId, FACILITY_TYPE_NAME_MAX);
}

/** Urutan tampil: `sort_order`, lalu nama. */
export const sortFacilityTypes = sortByOrder;

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
