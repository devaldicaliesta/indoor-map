import { customFieldInput, type LocationType, parseCustomFieldInputs } from './custom-fields';
import {
  checkLocationCode,
  LOCATION_DESCRIPTION_MAX,
  LOCATION_NAME_MAX,
  type Location,
  type LocationStatus,
  normalizeLocationCode,
  type VenueUnit,
} from './location';
import type { SnapshotFieldValue } from './snapshot';

/** Kolom standar template import, sebelum kolom field kustom (per kunci field). */
export const IMPORT_STANDARD_COLUMNS = [
  'kode_lokasi',
  'nama',
  'kategori',
  'deskripsi',
  'status',
  'tanggal_buka',
  'kode_unit',
] as const;

const STATUS_VALUES: Record<string, LocationStatus> = {
  aktif: 'active',
  segera_buka: 'coming_soon',
  nonaktif_sementara: 'inactive_temporary',
  nonaktif_permanen: 'inactive_permanent',
};

/** Kolom template untuk satu tipe; field gambar tidak bisa diisi dari berkas. */
export function importHeader(type: LocationType): string[] {
  return [
    ...IMPORT_STANDARD_COLUMNS,
    ...type.fields.filter((f) => f.type !== 'image').map((f) => f.key),
  ];
}

export interface ImportContext {
  type: LocationType;
  /** Kategori milik tipe ini. */
  categories: readonly { id: string; name: string }[];
  units: readonly VenueUnit[];
  /** Semua lokasi venue (semua tipe), untuk kode unik dan pencocokan. */
  locations: readonly Location[];
}

/**
 * Isi yang ditulis untuk satu baris. Pada baris yang memperbarui, `null` berarti dipertahankan
 * (sel kosong tidak menghapus data); field kustom digabung dengan nilai lama.
 */
export interface ImportWrite {
  id: string | null;
  code: string | null;
  name: string;
  description: string | null;
  status: LocationStatus | null;
  openingDate: string | null;
  categoryIds: string[] | null;
  unitIds: string[] | null;
  customFields: Record<string, SnapshotFieldValue>;
}

export interface ImportRow {
  /** Nomor baris di berkas (judul kolom = 1). */
  line: number;
  action: 'create' | 'update' | 'invalid';
  locationId: string | null;
  name: string;
  errors: { column: string; message: string }[];
  write: ImportWrite | null;
}

export interface ImportPlan {
  rows: ImportRow[];
  missingColumns: string[];
  unknownColumns: string[];
}

const split = (cell: string) =>
  cell
    .split(/[;,]/)
    .map((v) => v.trim())
    .filter(Boolean);

/** `YYYY-MM-DD`, `DD/MM/YYYY`, atau nomor seri tanggal Excel; `null` bila tidak dikenali. */
export function parseImportDate(value: string): string | null {
  const text = value.trim();
  let year: number;
  let month: number;
  let day: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  if (iso) [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (dmy) [year, month, day] = [Number(dmy[3]), Number(dmy[2]), Number(dmy[1])];
  else if (/^\d{5}$/.test(text)) {
    // Nomor seri Excel: hari sejak 30 Desember 1899.
    const date = new Date(Date.UTC(1899, 11, 30) + Number(text) * 86_400_000);
    return date.toISOString().slice(0, 10);
  } else return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) return null;
  return date.toISOString().slice(0, 10);
}

function statusOf(cell: string): LocationStatus | 'invalid' | null {
  const key = cell.trim().toLowerCase().replace(/\s+/g, '_');
  if (!key) return null;
  return STATUS_VALUES[key] ?? 'invalid';
}

/**
 * Rencana import dari tabel (baris pertama = judul kolom): tiap baris menjadi lokasi baru,
 * pembaruan lokasi yang ada (dicocokkan kode lokasi, atau kode unit bila kode kosong), atau
 * gagal dengan alasan per kolom. Tidak ada yang ditulis di sini.
 */
export function planImport(
  table: readonly (readonly string[])[],
  context: ImportContext,
): ImportPlan {
  const [header = [], ...body] = table;
  const columns = header.map((h) => h.trim().toLowerCase());
  const known = new Set(importHeader(context.type));
  const missingColumns = columns.includes('nama') ? [] : ['nama'];
  const unknownColumns = columns.filter((c) => c && !known.has(c));
  if (missingColumns.length) return { rows: [], missingColumns, unknownColumns };

  const unitsByCode = new Map(context.units.map((u) => [normalizeLocationCode(u.unitCode), u]));
  const byCode = new Map(
    context.locations.filter((l) => l.code).map((l) => [normalizeLocationCode(l.code ?? ''), l]),
  );
  const categories = new Map(
    context.categories.map((c) => [c.name.trim().toLocaleLowerCase('id'), c.id]),
  );
  const seenCodes = new Set<string>();
  const seenUnits = new Map<string, number>();
  const rows: ImportRow[] = [];

  body.forEach((cells, index) => {
    const line = index + 2;
    const get = (column: string) => {
      const i = columns.indexOf(column);
      return i >= 0 ? (cells[i] ?? '').trim() : '';
    };
    const errors: ImportRow['errors'] = [];
    const fail = (column: string, message: string) => errors.push({ column, message });

    const name = get('nama');
    const code = normalizeLocationCode(get('kode_lokasi'));
    const unitCodes = split(get('kode_unit')).map(normalizeLocationCode);

    // Lokasi yang diperbarui: kode lokasi, atau lokasi yang menempati unit pertama.
    let target: Location | undefined;
    if (code) {
      target = byCode.get(code);
      if (seenCodes.has(code))
        fail('kode_lokasi', `Kode ${code} muncul lebih dari sekali di berkas.`);
      seenCodes.add(code);
      if (target && target.locationTypeId !== context.type.id) {
        fail('kode_lokasi', `Kode ${code} dipakai lokasi "${target.name}" bertipe lain.`);
      }
      const problem = target ? null : checkLocationCode(code, context.locations, null);
      if (problem?.problem === 'format')
        fail('kode_lokasi', 'Kode hanya huruf, angka, titik, garis miring, atau tanda hubung.');
      if (problem?.problem === 'too_long') fail('kode_lokasi', 'Kode terlalu panjang.');
    } else if (unitCodes[0]) {
      const holder = unitsByCode.get(unitCodes[0])?.holders[0];
      target = context.locations.find(
        (l) => l.id === holder?.locationId && l.locationTypeId === context.type.id,
      );
    }
    const selfId = target?.id ?? null;

    if (!name) fail('nama', 'Nama wajib diisi.');
    else if (name.length > LOCATION_NAME_MAX)
      fail('nama', `Nama maksimal ${LOCATION_NAME_MAX} karakter.`);

    const description = get('deskripsi');
    if (description.length > LOCATION_DESCRIPTION_MAX) {
      fail('deskripsi', `Deskripsi maksimal ${LOCATION_DESCRIPTION_MAX} karakter.`);
    }

    const categoryNames = split(get('kategori'));
    const categoryIds: string[] = [];
    for (const categoryName of categoryNames) {
      const id = categories.get(categoryName.toLocaleLowerCase('id'));
      if (id) categoryIds.push(id);
      else fail('kategori', `Kategori "${categoryName}" tidak ada di tipe ${context.type.name}.`);
    }

    const status = statusOf(get('status'));
    if (status === 'invalid') {
      fail('status', 'Status: aktif, segera_buka, nonaktif_sementara, atau nonaktif_permanen.');
    }
    const resolvedStatus =
      status === 'invalid' ? null : (status ?? (target ? target.status : 'active'));
    const dateCell = get('tanggal_buka');
    const openingDate = dateCell ? parseImportDate(dateCell) : (target?.openingDate ?? null);
    if (dateCell && !openingDate) fail('tanggal_buka', 'Tanggal: YYYY-MM-DD atau DD/MM/YYYY.');
    else if (resolvedStatus === 'coming_soon' && !openingDate) {
      fail('tanggal_buka', 'Tanggal buka wajib untuk status segera buka.');
    }

    const unitIds: string[] = [];
    for (const unitCode of unitCodes) {
      const unit = unitsByCode.get(unitCode);
      if (!unit) {
        fail('kode_unit', `Unit ${unitCode} tidak ada di peta.`);
        continue;
      }
      const other = unit.holders.find((h) => h.locationId !== selfId);
      const earlier = seenUnits.get(unit.featureId);
      if (other) fail('kode_unit', `Unit ${unitCode} sudah ditempati "${other.name}".`);
      else if (earlier !== undefined)
        fail('kode_unit', `Unit ${unitCode} juga dipakai baris ${earlier}.`);
      seenUnits.set(unit.featureId, line);
      unitIds.push(unit.featureId);
    }

    // Field kustom: nilai lama menjadi dasar, sel yang terisi menggantikannya.
    const inputs: Record<string, string> = Object.fromEntries(
      Object.entries(target?.customFields ?? {}).map(([k, v]) => [k, customFieldInput(v)]),
    );
    for (const field of context.type.fields) {
      const cell = get(field.key);
      if (cell && field.type !== 'image') inputs[field.key] = cell;
    }
    const parsed = parseCustomFieldInputs(context.type.fields, inputs);
    for (const field of context.type.fields) {
      const message = parsed.errors[field.key];
      if (message) fail(field.key, message);
    }

    if (errors.length > 0 || !resolvedStatus) {
      rows.push({ line, action: 'invalid', locationId: selfId, name, errors, write: null });
      return;
    }
    rows.push({
      line,
      action: target ? 'update' : 'create',
      locationId: selfId,
      name,
      errors,
      write: {
        id: selfId,
        code: code || (target?.code ?? null),
        name,
        description: description || (target ? null : ''),
        status: target && !status ? null : resolvedStatus,
        openingDate: resolvedStatus === 'coming_soon' ? openingDate : null,
        categoryIds: categoryNames.length ? categoryIds : target ? null : [],
        unitIds: unitCodes.length ? unitIds : target ? null : [],
        customFields: parsed.values,
      },
    });
  });
  return { rows, missingColumns, unknownColumns };
}
