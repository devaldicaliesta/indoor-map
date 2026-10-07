import { normalizeSearchText } from '@indoor/domain';

/** Pilihan baris per halaman setiap tabel Admin (docs/20-F2-fase-2.md §2.5). */
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export const isPageSize = (value: number): value is PageSize =>
  (PAGE_SIZES as readonly number[]).includes(value);

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBase {
  /** Nama parameter URL. */
  key: string;
  label: string;
}

/**
 * Filter tabel. `options` boleh `undefined` selama pilihan masih dimuat; nilai di URL baru
 * diperiksa setelah pilihan tersedia agar tautan yang dibagikan tidak terhapus saat memuat.
 */
export type FilterDef =
  | (FilterBase & {
      kind: 'select';
      options: readonly FilterOption[] | undefined;
      /** Teks pilihan "semua", mis. "Semua kategori". */
      allLabel: string;
    })
  | (FilterBase & { kind: 'multi'; options: readonly FilterOption[] | undefined })
  | (FilterBase & { kind: 'dateRange' });

/** select: `[nilai]`; multi: nilai-nilai; rentang tanggal: `[dari, sampai]` (YYYY-MM-DD atau ''). */
export type FilterValues = Readonly<Record<string, readonly string[]>>;

export interface TableState {
  q: string;
  filters: FilterValues;
  /** Mulai dari 1. */
  page: number;
  size: PageSize;
}

/** Nilai baru filter, atau fungsi dari nilai terbaru (aman untuk klik beruntun yang cepat). */
export type FilterUpdate = readonly string[] | ((current: readonly string[]) => readonly string[]);

/** Keadaan tabel beserta pengubahnya; disediakan `useTableState` (status di URL). */
export interface TableController {
  state: TableState;
  setQuery: (q: string) => void;
  setFilter: (key: string, update: FilterUpdate) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setSize: (size: PageSize) => void;
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function dateRangeOf(values: readonly string[] | undefined): { from: string; to: string } {
  const [from = '', to = ''] = values ?? [];
  return { from, to };
}

/** Nilai filter apa adanya; rentang tanggal tetap dua posisi `[dari, sampai]`. */
export function filterValues(state: TableState, key: string): readonly string[] {
  return state.filters[key] ?? [];
}

/** Filter berlaku bila ada nilai yang tidak kosong (rentang `['', '']` tidak berlaku). */
export const isFilterActive = (values: readonly string[] | undefined): boolean =>
  (values ?? []).some((value) => value !== '');

export function hasActiveFilters(state: TableState): boolean {
  return state.q.trim() !== '' || Object.values(state.filters).some(isFilterActive);
}

export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size));
}

/** Halaman yang sah untuk jumlah data itu: halaman di luar jangkauan pindah ke halaman terakhir. */
export function clampPage(page: number, total: number, size: number): number {
  return Math.min(Math.max(1, page), pageCount(total, size));
}

/** Nomor baris pertama dan terakhir halaman (mulai 1) untuk teks "26–50 dari 212". */
export function pageBounds(
  page: number,
  size: number,
  total: number,
): { first: number; last: number } {
  if (total === 0) return { first: 0, last: 0 };
  const first = (clampPage(page, total, size) - 1) * size + 1;
  return { first, last: Math.min(first + size - 1, total) };
}

/**
 * Nomor halaman yang ditampilkan: pertama, terakhir, dan halaman di sekitar halaman aktif;
 * `null` menandai elipsis. Jumlah tombol tetap kecil berapa pun banyaknya halaman.
 */
export function pageWindow(page: number, count: number, around = 1): (number | null)[] {
  const pages = new Set([1, count]);
  for (let p = page - around; p <= page + around; p++) if (p >= 1 && p <= count) pages.add(p);
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => {
    const previous = sorted[i - 1];
    if (previous === undefined || p - previous === 1) return [p];
    // Celah satu halaman lebih jelas ditampilkan nomornya daripada elipsis.
    return p - previous === 2 ? [previous + 1, p] : [null, p];
  });
}

/** Tanggal kalender (YYYY-MM-DD) sebuah waktu di zona waktu itu. */
export function calendarDate(timestamp: string | Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(timestamp));
}

/** Waktu jatuh di rentang tanggal [dari, sampai] (inklusif); batas kosong berarti terbuka. */
export function withinDateRange(
  timestamp: string | Date,
  values: readonly string[] | undefined,
  timeZone?: string,
): boolean {
  const { from, to } = dateRangeOf(values);
  const date = calendarDate(timestamp, timeZone);
  return (!from || date >= from) && (!to || date <= to);
}

/** Penyaringan dan pembagian halaman di klien untuk tabel kecil. */
export interface ClientQuery<Row> {
  /** Teks yang dicari pada satu baris; tanpa membedakan huruf besar/kecil dan diakritik. */
  text: (row: Row) => readonly (string | null | undefined)[];
  /** Kecocokan per filter; hanya dipanggil bila filter itu punya nilai. */
  filters?: Readonly<Record<string, (row: Row, values: readonly string[]) => boolean>>;
}

export interface ClientPage<Row> {
  rows: Row[];
  total: number;
  /** Halaman yang benar-benar ditampilkan (sudah dibatasi ke halaman terakhir). */
  page: number;
}

export function queryRows<Row>(
  rows: readonly Row[],
  state: TableState,
  query: ClientQuery<Row>,
): ClientPage<Row> {
  const needle = normalizeSearchText(state.q);
  const active = Object.entries(query.filters ?? {}).flatMap(([key, match]) => {
    const values = filterValues(state, key);
    return isFilterActive(values) ? [(row: Row) => match(row, values)] : [];
  });
  const matched = rows.filter(
    (row) =>
      active.every((match) => match(row)) &&
      (!needle ||
        query.text(row).some((text) => text && normalizeSearchText(text).includes(needle))),
  );
  const page = clampPage(state.page, matched.length, state.size);
  const start = (page - 1) * state.size;
  return { rows: matched.slice(start, start + state.size), total: matched.length, page };
}
