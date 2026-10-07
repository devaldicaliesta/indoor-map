import { toDataError } from './errors';

/** Sama dengan `max_rows` PostgREST di supabase/config.toml; satu permintaan tidak pernah lebih. */
export const PAGE_SIZE = 1000;

/**
 * Mengambil semua baris lewat beberapa permintaan `range`. PostgREST memotong hasil di
 * `max_rows` tanpa galat, sehingga lantai dengan lebih dari 1.000 fitur akan terpotong
 * diam-diam bila hanya diambil sekali. Query harus berurutan stabil (misalnya `order('id')`).
 */
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw toDataError(error);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return rows;
  }
}

/** Permintaan satu halaman tabel yang disaring di server (DataTable di Admin). */
export interface PageQuery<Filters> {
  q: string;
  filters: Filters;
  /** Mulai dari 1. */
  page: number;
  size: number;
}

export interface Page<Row> {
  rows: Row[];
  /** Semua baris yang cocok dan boleh dibaca role ini (RLS), bukan hanya halaman ini. */
  total: number;
}

/** Batas `range()` PostgREST (inklusif) untuk halaman itu. */
export function pageRange(page: number, size: number): { from: number; to: number } {
  const from = (Math.max(1, Math.floor(page)) - 1) * size;
  return { from, to: from + size - 1 };
}

type PageResponse<Row> = PromiseLike<{
  data: Row[] | null;
  error: { code?: string } | null;
  count: number | null;
}>;

/**
 * Satu halaman beserta total memakai `range()` dan `count: 'exact'`. `request` membangun query
 * yang sama untuk rentang mana pun. PostgREST menolak rentang di luar jumlah data (PGRST103,
 * mis. baris terakhir halaman itu baru dihapus); hasilnya kosong dengan total yang benar
 * sehingga DataTable bisa pindah ke halaman terakhir.
 */
export async function listPage<Row, T>(
  request: (from: number, to: number) => PageResponse<Row>,
  query: Pick<PageQuery<unknown>, 'page' | 'size'>,
  map: (rows: Row[]) => T[] | Promise<T[]>,
): Promise<Page<T>> {
  const { from, to } = pageRange(query.page, query.size);
  const { data, error, count } = await request(from, to);
  if (error?.code === 'PGRST103') {
    const head = await request(0, 0);
    if (head.error) throw toDataError(head.error);
    return { rows: [], total: head.count ?? 0 };
  }
  if (error) throw toDataError(error);
  return { rows: await map(data ?? []), total: count ?? 0 };
}
