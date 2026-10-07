import type { FilterDef, FilterUpdate, PageSize, TableController, TableState } from '@indoor/ui';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { readTableState, type TableUrlOptions, writeTableState } from './table-url';

/** Identitas filter yang memengaruhi pembacaan URL (kunci, jenis, dan nilai pilihan). */
const signature = (filters: readonly FilterDef[]) =>
  JSON.stringify(
    filters.map((def) => [
      def.key,
      def.kind,
      'options' in def ? def.options?.map((o) => o.value) : null,
    ]),
  );

/**
 * Cari, filter, halaman, dan ukuran halaman tabel disimpan di URL (`?q=…&status=a,b&page=2`)
 * agar bisa dibagikan dan bertahan saat dimuat ulang. Setiap perubahan cari/filter/ukuran
 * kembali ke halaman 1. URL yang rusak ditulis ulang ke nilai sahnya.
 */
export function useTableState(options: TableUrlOptions): TableController {
  const [params, setParams] = useSearchParams();
  const latest = useRef(options);
  latest.current = options;
  const key = signature(options.filters);
  const search = params.toString();

  // Dibaca ulang hanya bila URL atau pilihan filter berubah, bukan setiap render.
  const state = useMemo(
    () => readTableState(new URLSearchParams(search), latest.current),
    [search, key, options.prefix, options.defaultSize],
  );

  const update = useCallback(
    (change: (state: TableState) => TableState) =>
      setParams(
        (previous) => {
          const current = readTableState(previous, latest.current);
          return writeTableState(previous, change(current), latest.current);
        },
        { replace: true },
      ),
    [setParams],
  );

  // Normalisasi: URL rusak (`size=7`, nilai filter asing) diganti dengan bentuk sahnya.
  useEffect(() => {
    const current = new URLSearchParams(search);
    const normalized = writeTableState(current, state, latest.current);
    if (normalized.toString() !== current.toString()) setParams(normalized, { replace: true });
  }, [search, state, setParams]);

  return useMemo(
    () => ({
      state,
      setQuery: (q: string) => update((s) => ({ ...s, q, page: 1 })),
      setFilter: (filterKey: string, change: FilterUpdate) =>
        update((s) => {
          const values = typeof change === 'function' ? change(s.filters[filterKey] ?? []) : change;
          return { ...s, filters: { ...s.filters, [filterKey]: values }, page: 1 };
        }),
      clearFilters: () => update((s) => ({ ...s, q: '', filters: {}, page: 1 })),
      setPage: (page: number) => update((s) => ({ ...s, page })),
      setSize: (size: PageSize) => update((s) => ({ ...s, size, page: 1 })),
    }),
    [state, update],
  );
}
