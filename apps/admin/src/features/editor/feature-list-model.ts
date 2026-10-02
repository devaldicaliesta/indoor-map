import type { FloorFeature } from '@indoor/data';
import { FEATURE_KINDS, type FeatureKind } from '@indoor/domain';

/** Tinggi baris tetap (px) agar posisi setiap baris bisa dihitung tanpa merender semuanya. */
export const GROUP_ROW_PX = 32;
export const ITEM_ROW_PX = 28;

export interface ListItem {
  id: string;
  kind: FeatureKind;
  /** Teks utama: kode unit, nama, atau nama jenis fasilitas. */
  label: string;
  /** Nama di samping kode unit, bila keduanya ada. */
  detail: string | null;
  /** Kode unit ditulis dengan huruf monospace. */
  isCode: boolean;
}

export type ListRow =
  | { type: 'group'; kind: FeatureKind; count: number; expanded: boolean }
  | ({ type: 'item' } & ListItem);

/** Huruf kecil tanpa diakritik, untuk pencarian yang tidak peka huruf besar/kecil. */
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function toListItem(
  feature: FloorFeature,
  facilityTypeName: (id: string) => string | undefined,
  fallback: (kind: FeatureKind) => string,
): ListItem {
  const p = feature.properties;
  const typeName = p.facilityTypeId ? facilityTypeName(p.facilityTypeId) : undefined;
  if (p.unitCode) {
    return { id: p.id, kind: p.kind, label: p.unitCode, detail: p.name ?? null, isCode: true };
  }
  return {
    id: p.id,
    kind: p.kind,
    label: p.name ?? typeName ?? fallback(p.kind),
    // Fasilitas bernama tetap menyebut jenisnya, misalnya "Lantai 1 barat · Toilet Pria".
    detail: p.name && typeName ? typeName : null,
    isCode: false,
  };
}

export function matchesSearch(item: ListItem, query: string): boolean {
  if (!query) return true;
  return [item.label, item.detail].some((text) => text && normalizeSearch(text).includes(query));
}

const collator = new Intl.Collator('id-ID', { numeric: true, sensitivity: 'base' });

/**
 * Baris datar untuk daftar tervirtualisasi: judul grup per jenis (urutan `FEATURE_KINDS`)
 * diikuti fitur yang cocok bila grup terbuka. Saat mencari, grup yang punya hasil selalu
 * terbuka dan jumlahnya adalah jumlah yang cocok.
 */
export function buildRows(
  items: readonly ListItem[],
  options: { query: string; isExpanded: (kind: FeatureKind) => boolean },
): ListRow[] {
  const query = normalizeSearch(options.query);
  const byKind = new Map<FeatureKind, ListItem[]>();
  for (const item of items) {
    if (!matchesSearch(item, query)) continue;
    const list = byKind.get(item.kind) ?? [];
    list.push(item);
    byKind.set(item.kind, list);
  }
  const rows: ListRow[] = [];
  for (const kind of FEATURE_KINDS) {
    const list = byKind.get(kind);
    if (!list) continue;
    const expanded = query !== '' || options.isExpanded(kind);
    rows.push({ type: 'group', kind, count: list.length, expanded });
    if (!expanded) continue;
    list.sort((a, b) => collator.compare(a.label, b.label));
    for (const item of list) rows.push({ type: 'item', ...item });
  }
  return rows;
}

/** Fitur pertama yang cocok dengan teks pencarian, dalam urutan daftar. */
export function firstMatch(items: readonly ListItem[], query: string): ListItem | undefined {
  const row = buildRows(items, { query, isExpanded: () => true }).find((r) => r.type === 'item');
  return row?.type === 'item' ? row : undefined;
}

export const rowHeight = (row: ListRow) => (row.type === 'group' ? GROUP_ROW_PX : ITEM_ROW_PX);

/** Posisi atas setiap baris; elemen terakhir adalah tinggi total daftar. */
export function rowOffsets(rows: readonly ListRow[]): number[] {
  const offsets = [0];
  for (const row of rows) offsets.push((offsets.at(-1) ?? 0) + rowHeight(row));
  return offsets;
}

/** Indeks baris pertama yang bagian bawahnya melewati `y` (pencarian biner). */
function rowAt(offsets: readonly number[], y: number): number {
  let low = 0;
  let high = offsets.length - 2;
  while (low < high) {
    const mid = (low + high) >> 1;
    if ((offsets[mid + 1] ?? 0) <= y) low = mid + 1;
    else high = mid;
  }
  return Math.max(0, low);
}

/** Rentang baris yang dirender: yang terlihat ditambah cadangan di atas dan bawah. */
export function visibleRange(
  offsets: readonly number[],
  scrollTop: number,
  viewportHeight: number,
  overscan = 8,
): { start: number; end: number } {
  const count = offsets.length - 1;
  if (count <= 0) return { start: 0, end: 0 };
  const first = rowAt(offsets, scrollTop);
  const last = rowAt(offsets, scrollTop + Math.max(viewportHeight, 1) - 1);
  return { start: Math.max(0, first - overscan), end: Math.min(count, last + 1 + overscan) };
}

/** `scrollTop` baru agar baris `index` terlihat utuh, atau `null` bila sudah terlihat. */
export function revealScrollTop(
  offsets: readonly number[],
  index: number,
  scrollTop: number,
  viewportHeight: number,
): number | null {
  const top = offsets[index];
  const bottom = offsets[index + 1];
  if (top === undefined || bottom === undefined) return null;
  if (top < scrollTop) return top;
  if (bottom > scrollTop + viewportHeight) return bottom - viewportHeight;
  return null;
}
