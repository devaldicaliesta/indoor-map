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
