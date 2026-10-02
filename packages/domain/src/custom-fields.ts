import { z } from 'zod';
import type { FieldDefinitionId, LocationTypeId } from './ids';
import { checkUniqueName, type NameProblem } from './names';
import { SNAPSHOT_FIELD_TYPES, type SnapshotFieldValue } from './snapshot';

/** Enum `field_type` di migrasi 0001. */
export const FIELD_TYPES = SNAPSHOT_FIELD_TYPES;
export type FieldType = (typeof FIELD_TYPES)[number];

/** Definisi field kustom per tipe lokasi (tabel `field_definitions`). */
export interface CustomField {
  key: string;
  label: string;
  type: FieldType;
  /** Opsi untuk jenis `select`. */
  options: readonly string[];
  isRequired: boolean;
  isVisible: boolean;
  isSearchable: boolean;
}

export const FIELD_LABEL_MAX = 60;
export const FIELD_TEXT_MAX = 500;

/** Kunci dari label, sesuai constraint `^[a-z][a-z0-9_]*$` dan unik di tipe lokasinya. */
export function fieldKeyFromLabel(label: string, taken: readonly string[]): string {
  let base = label
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  if (!base) base = 'field';
  else if (!/^[a-z]/.test(base)) base = `f_${base}`;
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

export type CustomFieldProblem =
  | 'label_required'
  | 'label_too_long'
  | 'options_required'
  | 'options_duplicate'
  | 'key_duplicate';

export function checkCustomField(
  field: CustomField,
  others: readonly Pick<CustomField, 'key'>[],
): CustomFieldProblem[] {
  const problems: CustomFieldProblem[] = [];
  const label = field.label.trim();
  if (!label) problems.push('label_required');
  else if (label.length > FIELD_LABEL_MAX) problems.push('label_too_long');
  if (field.type === 'select') {
    const options = field.options.map((o) => o.trim()).filter(Boolean);
    if (options.length === 0) problems.push('options_required');
    const lower = options.map((o) => o.toLocaleLowerCase('id'));
    if (new Set(lower).size !== lower.length) problems.push('options_duplicate');
  }
  if (others.some((o) => o.key === field.key)) problems.push('key_duplicate');
  return problems;
}

const LINK = /^(https?:\/\/|mailto:|tel:)/i;

function valueSchema(field: CustomField): z.ZodType<SnapshotFieldValue> {
  switch (field.type) {
    case 'number':
      return z.number().finite();
    case 'select':
      return z.string().refine((v) => field.options.includes(v), 'Pilih salah satu opsi.');
    case 'link':
      return z
        .string()
        .trim()
        .max(FIELD_TEXT_MAX)
        .refine((v) => LINK.test(v), 'Tautan harus diawali http://, https://, mailto:, atau tel:.');
    default:
      return z.string().trim().min(1).max(FIELD_TEXT_MAX);
  }
}

/**
 * Skema nilai `locations.custom_fields` untuk satu tipe: field wajib harus ada, field opsional
 * boleh tidak ada, kunci lain dibiarkan (sisa tipe lama) agar tidak hilang tanpa sengaja.
 */
export function customFieldsSchema(fields: readonly CustomField[]) {
  const shape: Record<string, z.ZodType<SnapshotFieldValue | undefined>> = {};
  for (const field of fields) {
    shape[field.key] = field.isRequired ? valueSchema(field) : valueSchema(field).optional();
  }
  return z.looseObject(shape);
}

/** Teks isian formulir untuk nilai tersimpan. */
export function customFieldInput(value: unknown): string {
  if (typeof value === 'number') return String(value).replace('.', ',');
  return typeof value === 'string' ? value : '';
}

/**
 * Isian formulir (teks) menjadi nilai bertipe per field, dengan pesan galat per kunci. Isian
 * kosong pada field opsional tidak disimpan.
 */
export function parseCustomFieldInputs(
  fields: readonly CustomField[],
  inputs: Readonly<Record<string, string>>,
): { values: Record<string, SnapshotFieldValue>; errors: Record<string, string> } {
  const values: Record<string, SnapshotFieldValue> = {};
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const raw = (inputs[field.key] ?? '').trim();
    if (!raw) {
      if (field.isRequired) errors[field.key] = `${field.label} wajib diisi.`;
      continue;
    }
    const candidate = field.type === 'number' ? Number(raw.replace(',', '.')) : raw;
    if (field.type === 'number' && !Number.isFinite(candidate)) {
      errors[field.key] = `${field.label} harus berupa angka.`;
      continue;
    }
    const result = valueSchema(field).safeParse(candidate);
    if (result.success) values[field.key] = result.data;
    else errors[field.key] = result.error.issues[0]?.message ?? `${field.label} tidak valid.`;
  }
  return { values, errors };
}

/**
 * Nilai yang tetap berlaku setelah lokasi pindah tipe: kunci yang juga ada di tipe baru dengan
 * jenis yang sama. Sisanya dilaporkan agar formulir bisa meminta konfirmasi.
 */
export function keepFieldsOf(
  values: Readonly<Record<string, unknown>>,
  from: readonly CustomField[],
  to: readonly CustomField[],
): { kept: Record<string, unknown>; dropped: string[] } {
  const before = new Map(from.map((f) => [f.key, f.type]));
  const after = new Map(to.map((f) => [f.key, f.type]));
  const kept: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    const type = after.get(key);
    if (type !== undefined && (before.get(key) ?? type) === type) kept[key] = value;
    else dropped.push(key);
  }
  return { kept, dropped };
}

/** Field yang tersimpan, dengan id dan urutan tampil. */
export interface FieldDefinition extends CustomField {
  id: FieldDefinitionId;
  sortOrder: number;
}

/** Tipe lokasi venue beserta field kustomnya, terurut. */
export interface LocationType {
  id: LocationTypeId;
  name: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  fields: FieldDefinition[];
}

export interface LocationTypeInput {
  name: string;
  icon: string | null;
  color: string | null;
}

export const LOCATION_TYPE_NAME_MAX = 60;

/** Nama tipe lokasi unik per venue, tanpa membedakan huruf besar/kecil. */
export function checkLocationTypeName(
  name: string,
  others: readonly { id: string; name: string }[],
  selfId: string | null,
): NameProblem[] {
  return checkUniqueName(name, others, selfId, LOCATION_TYPE_NAME_MAX);
}

/** Pindah satu langkah atau ke posisi baru (drag); hasilnya urutan baru 0..n-1 seluruh field. */
export function reorderFields<T extends { id: string; sortOrder: number }>(
  fields: readonly T[],
  id: string,
  toIndex: number,
): { id: T['id']; sortOrder: number }[] {
  const ordered = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
  const from = ordered.findIndex((f) => f.id === id);
  if (from >= 0) {
    const [moved] = ordered.splice(from, 1);
    const to = Math.max(0, Math.min(ordered.length, toIndex));
    if (moved) ordered.splice(to, 0, moved);
  }
  return ordered.map((f, index) => ({ id: f.id, sortOrder: index }));
}
