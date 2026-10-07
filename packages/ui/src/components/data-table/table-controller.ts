import { useMemo, useState } from 'react';
import {
  DEFAULT_PAGE_SIZE,
  type FilterUpdate,
  type FilterValues,
  type TableController,
  type TableState,
} from './table-state';

export type TableChange = (state: TableState) => TableState;

function applyFilterUpdates(
  filters: FilterValues,
  updates: Readonly<Record<string, FilterUpdate>>,
): FilterValues {
  const next: Record<string, readonly string[]> = { ...filters };
  for (const [key, update] of Object.entries(updates)) {
    next[key] = typeof update === 'function' ? update(filters[key] ?? []) : update;
  }
  return next;
}

/**
 * Pengubah keadaan tabel di atas satu fungsi `update`, sama untuk tabel yang keadaannya di URL
 * maupun di memori. Cari, filter, dan ukuran halaman kembali ke halaman 1.
 */
export function tableController(
  state: TableState,
  update: (change: TableChange) => void,
): TableController {
  return {
    state,
    setQuery: (q) => update((s) => ({ ...s, q, page: 1 })),
    setFilter: (key, change) =>
      update((s) => ({ ...s, filters: applyFilterUpdates(s.filters, { [key]: change }), page: 1 })),
    setFilters: (changes) =>
      update((s) => ({ ...s, filters: applyFilterUpdates(s.filters, changes), page: 1 })),
    clearFilters: () => update((s) => ({ ...s, q: '', filters: {}, page: 1 })),
    setPage: (page) => update((s) => ({ ...s, page })),
    setSize: (size) => update((s) => ({ ...s, size, page: 1 })),
  };
}

/**
 * Keadaan tabel di memori, untuk tabel di dalam sheet atau dialog (lantai, riwayat denah,
 * pratinjau impor): tabelnya hilang saat ditutup, jadi tidak ada yang dipulihkan dari URL.
 */
export function useLocalTableState(initial: Partial<TableState> = {}): TableController {
  const [state, setState] = useState<TableState>(() => ({
    q: '',
    filters: {},
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    ...initial,
  }));
  return useMemo(() => tableController(state, setState), [state]);
}
