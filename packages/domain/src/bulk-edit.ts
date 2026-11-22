import { type CustomField, keepFieldsOf } from './custom-fields';
import type { OpeningHours, OpeningSpan } from './hours';
import type { CategoryId, LocationId, LocationTypeId } from './ids';
import type { Category, Location, LocationStatus } from './location';

/** Sama dengan `app.bulk_edit_max()` di migrasi 0074. */
export const BULK_EDIT_MAX = 1000;

export type BulkLocationChange =
  | { kind: 'status'; status: LocationStatus; openingDate: string | null }
  | { kind: 'type'; typeId: LocationTypeId }
  | { kind: 'category_add'; categoryId: CategoryId }
  | { kind: 'category_remove'; categoryId: CategoryId }
  | { kind: 'hours'; weekly: OpeningHours['weekly'] };

export type BulkChangeKind = BulkLocationChange['kind'];

export const BULK_CHANGE_LABELS: Record<BulkChangeKind, string> = {
  status: 'Ubah status',
  type: 'Ubah tipe',
  category_add: 'Tambah kategori',
  category_remove: 'Lepas kategori',
  hours: 'Ganti jam operasional mingguan',
};

export interface BulkEditContext {
  statusLabel: (status: LocationStatus) => string;
  types: readonly { id: LocationTypeId; name: string; fields: readonly CustomField[] }[];
  categories: readonly Pick<Category, 'id' | 'name' | 'locationTypeId'>[];
}

export type BulkEditProblem =
  | 'empty_selection'
  | 'too_many'
  | 'opening_date_required'
  | 'unknown_type'
  | 'unknown_category'
  | 'category_type_mismatch'
  | 'hours_format';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Aturan yang sama dengan `bulk_edit_locations`; server tetap memeriksa ulang. */
export function checkBulkChange(
  locations: readonly Pick<Location, 'locationTypeId'>[],
  change: BulkLocationChange,
  context: Pick<BulkEditContext, 'types' | 'categories'>,
): BulkEditProblem[] {
  const problems: BulkEditProblem[] = [];
  if (locations.length === 0) problems.push('empty_selection');
  if (locations.length > BULK_EDIT_MAX) problems.push('too_many');
  switch (change.kind) {
    case 'status':
      if (
        change.status === 'coming_soon' &&
        !(change.openingDate && DATE.test(change.openingDate))
      ) {
        problems.push('opening_date_required');
      }
      break;
    case 'type':
      if (!context.types.some((t) => t.id === change.typeId)) problems.push('unknown_type');
      break;
    case 'category_add':
    case 'category_remove': {
      const category = context.categories.find((c) => c.id === change.categoryId);
      if (!category) problems.push('unknown_category');
      else if (
        change.kind === 'category_add' &&
        locations.some((l) => l.locationTypeId !== category.locationTypeId)
      ) {
        problems.push('category_type_mismatch');
      }
      break;
    }
    case 'hours':
      if (
        change.weekly.length !== 7 ||
        change.weekly.flat().some((s) => !TIME.test(s.opens) || !TIME.test(s.closes))
      ) {
        problems.push('hours_format');
      }
      break;
  }
  return problems;
}

export const BULK_EDIT_PROBLEM_MESSAGES: Record<BulkEditProblem, string> = {
  empty_selection: 'Pilih minimal satu lokasi.',
  too_many: `Edit massal paling banyak ${BULK_EDIT_MAX.toLocaleString('id-ID')} lokasi sekaligus.`,
  opening_date_required: 'Tanggal buka wajib diisi untuk status segera buka.',
  unknown_type: 'Pilih tipe lokasi.',
  unknown_category: 'Pilih kategori.',
  category_type_mismatch:
    'Kategori ini hanya untuk lokasi bertipe sama. Saring tabel per tipe lalu pilih ulang.',
  hours_format: 'Jam operasional tidak valid. Gunakan jam JJ:MM.',
};

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const;

const spansText = (spans: readonly OpeningSpan[]) =>
  spans.length === 0 ? 'libur' : spans.map((s) => `${s.opens}–${s.closes}`).join(', ');

/** Ringkasan jam mingguan, hari berurutan dengan jam sama digabung: `Sen–Jum 08:00–16:00`. */
export function weeklySummary(weekly: OpeningHours['weekly']): string {
  if (weekly.every((d) => d.length === 0)) return 'Belum diatur';
  const parts: string[] = [];
  let start = 0;
  for (let i = 1; i <= weekly.length; i += 1) {
    const same = i < weekly.length && spansText(weekly[i] ?? []) === spansText(weekly[start] ?? []);
    if (same) continue;
    const label = i - 1 === start ? DAYS[start] : `${DAYS[start]}–${DAYS[i - 1]}`;
    parts.push(`${label} ${spansText(weekly[start] ?? [])}`);
    start = i;
  }
  return parts.join(' · ');
}

export interface BulkPreviewRow {
  id: LocationId;
  name: string;
  before: string;
  after: string;
  changed: boolean;
  /** Akibat tambahan, mis. kategori yang ikut dilepas saat pindah tipe. */
  note: string | null;
}

const listOf = (names: readonly string[]) => (names.length ? names.join(', ') : '—');

/** Pratinjau per lokasi sebelum edit massal disimpan. */
export function previewBulkChange(
  locations: readonly Location[],
  change: BulkLocationChange,
  context: BulkEditContext,
): BulkPreviewRow[] {
  const categoryName = new Map(context.categories.map((c) => [c.id as string, c.name]));
  const categoriesOf = (location: Location) =>
    location.categoryIds.flatMap((id) => categoryName.get(id) ?? []);
  const typeOf = (id: LocationTypeId) => context.types.find((t) => t.id === id);

  const previewOne = (location: Location): BulkPreviewRow => {
    const row = { id: location.id, name: location.name, note: null as string | null };
    switch (change.kind) {
      case 'status': {
        const dateText = (status: LocationStatus, date: string | null) =>
          status === 'coming_soon' && date
            ? `${context.statusLabel(status)} (${date})`
            : context.statusLabel(status);
        const before = dateText(location.status, location.openingDate);
        const after = dateText(change.status, change.openingDate);
        return { ...row, before, after, changed: before !== after };
      }
      case 'type': {
        const from = typeOf(location.locationTypeId);
        const to = typeOf(change.typeId);
        const changed = location.locationTypeId !== change.typeId;
        const notes: string[] = [];
        if (changed) {
          const dropped = location.categoryIds.flatMap((id) => {
            const category = context.categories.find((c) => c.id === id);
            return category && category.locationTypeId !== change.typeId ? [category.name] : [];
          });
          if (dropped.length) notes.push(`kategori dilepas: ${dropped.join(', ')}`);
          const fields = keepFieldsOf(location.customFields, from?.fields ?? [], to?.fields ?? []);
          if (fields.dropped.length) notes.push(`field dilepas: ${fields.dropped.join(', ')}`);
        }
        return {
          ...row,
          before: from?.name ?? '—',
          after: to?.name ?? '—',
          changed,
          note: notes.length ? notes.join('; ') : null,
        };
      }
      case 'category_add':
      case 'category_remove': {
        const before = categoriesOf(location);
        const target = categoryName.get(change.categoryId) ?? '';
        const has = location.categoryIds.includes(change.categoryId);
        const afterNames =
          change.kind === 'category_add'
            ? has
              ? before
              : [...before, target]
            : before.filter((name) => name !== target);
        return {
          ...row,
          before: listOf(before),
          after: listOf(afterNames),
          changed: change.kind === 'category_add' ? !has : has,
        };
      }
      case 'hours': {
        const before = weeklySummary(location.hours.weekly);
        const after = weeklySummary(change.weekly);
        return { ...row, before, after, changed: before !== after };
      }
    }
  };
  return locations.map((location) => previewOne(location));
}

/** Bentuk `p_change` untuk RPC `bulk_edit_locations`. */
export function bulkChangePayload(change: BulkLocationChange): Record<string, unknown> {
  switch (change.kind) {
    case 'status':
      return {
        kind: 'status',
        status: change.status,
        opening_date: change.status === 'coming_soon' ? change.openingDate : null,
      };
    case 'type':
      return { kind: 'type', type_id: change.typeId };
    case 'category_add':
    case 'category_remove':
      return { kind: change.kind, category_id: change.categoryId };
    case 'hours':
      return {
        kind: 'hours',
        hours: change.weekly.flatMap((spans, i) =>
          spans.map((s) => ({ weekday: i + 1, opens_at: s.opens, closes_at: s.closes })),
        ),
      };
  }
}

/** Edit massal yang tersimpan (tanpa nilai sebelumnya, yang hanya dibaca server). */
export interface LocationBulkEdit {
  id: string;
  change: Record<string, unknown>;
  locationCount: number;
  createdAt: string;
  createdBy: string | null;
  undoneAt: string | null;
}

/** Keterangan singkat edit massal tersimpan untuk banner undo dan audit. */
export function describeStoredBulkChange(
  change: Record<string, unknown>,
  context: BulkEditContext,
): string {
  const kind = change.kind;
  if (kind === 'status' && typeof change.status === 'string') {
    return `Status → ${context.statusLabel(change.status as LocationStatus)}`;
  }
  if (kind === 'type') {
    return `Tipe → ${context.types.find((t) => t.id === change.type_id)?.name ?? 'tipe lain'}`;
  }
  if (kind === 'category_add' || kind === 'category_remove') {
    const name = context.categories.find((c) => c.id === change.category_id)?.name ?? 'kategori';
    return `${kind === 'category_add' ? 'Tambah' : 'Lepas'} kategori ${name}`;
  }
  if (kind === 'hours') return 'Jam operasional mingguan diganti';
  return 'Edit massal';
}
