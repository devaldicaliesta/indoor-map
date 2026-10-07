import {
  DEFAULT_PAGE_SIZE,
  type FilterDef,
  ISO_DATE,
  isPageSize,
  type PageSize,
  type TableState,
} from '@indoor/ui';

export interface TableUrlOptions {
  filters: readonly FilterDef[];
  /** Awalan parameter bila satu halaman punya lebih dari satu tabel (mis. `kat.`). */
  prefix?: string;
  defaultSize?: PageSize;
}

/** Kata kunci yang lebih panjang dari ini dipotong; tidak ada nama data sepanjang itu. */
const MAX_QUERY = 200;
const RANGE = '..';

/** Tanggal kalender yang benar-benar ada (2026-02-30 ditolak, bukan digeser ke Maret). */
function validDate(value: string): string {
  if (!ISO_DATE.test(value)) return '';
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().startsWith(value) ? value : '';
}

function readFilter(def: FilterDef, raw: string | null): string[] {
  if (!raw) return [];
  if (def.kind === 'dateRange') {
    const [from = '', to = ''] = raw.split(RANGE).map(validDate);
    if (!from && !to) return [];
    return from && to && from > to ? [to, from] : [from, to];
  }
  const values = [...new Set(raw.split(',').map((value) => value.trim()))].filter(Boolean);
  // Selama pilihan masih dimuat nilainya dipertahankan; setelah itu nilai asing dibuang.
  const known = def.options
    ? values.filter((value) => def.options?.some((option) => option.value === value))
    : values;
  return def.kind === 'select' ? known.slice(0, 1) : known;
}

/**
 * Keadaan tabel dari URL. Nilai yang rusak (`page=abc`, `size=7`, nilai filter yang tidak ada)
 * dinormalisasi ke nilai sah tanpa galat; halaman di atas halaman terakhir dibatasi DataTable
 * setelah jumlah data diketahui.
 */
export function readTableState(params: URLSearchParams, options: TableUrlOptions): TableState {
  const name = (key: string) => `${options.prefix ?? ''}${key}`;
  const page = Number(params.get(name('page')));
  const size = Number(params.get(name('size')));
  const filters: Record<string, string[]> = {};
  for (const def of options.filters) {
    const values = readFilter(def, params.get(name(def.key)));
    if (values.length) filters[def.key] = values;
  }
  return {
    q: (params.get(name('q')) ?? '').slice(0, MAX_QUERY),
    filters,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    size: isPageSize(size) ? size : (options.defaultSize ?? DEFAULT_PAGE_SIZE),
  };
}

/** Menulis keadaan ke URL: nilai bawaan tidak ditulis, parameter lain di URL tetap. */
export function writeTableState(
  params: URLSearchParams,
  state: TableState,
  options: TableUrlOptions,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = (key: string, value: string | null) => {
    const name = `${options.prefix ?? ''}${key}`;
    if (value) next.set(name, value);
    else next.delete(name);
  };
  set('q', state.q.trim() ? state.q : null);
  set('page', state.page > 1 ? String(state.page) : null);
  set(
    'size',
    state.size === (options.defaultSize ?? DEFAULT_PAGE_SIZE) ? null : String(state.size),
  );
  for (const def of options.filters) {
    const values = state.filters[def.key] ?? [];
    if (def.kind === 'dateRange') {
      const [from = '', to = ''] = values;
      set(def.key, from || to ? `${from}${RANGE}${to}` : null);
    } else {
      set(def.key, values.filter(Boolean).join(',') || null);
    }
  }
  return next;
}
