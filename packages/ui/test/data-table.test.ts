import { describe, expect, it } from 'vitest';
import { type TableChange, tableController } from '../src/components/data-table/table-controller';
import {
  clampPage,
  filterValues,
  hasActiveFilters,
  isFilterActive,
  pageBounds,
  pageWindow,
  queryRows,
  type TableController,
  type TableState,
  withinDateRange,
  withRangeEnd,
} from '../src/components/data-table/table-state';

const state = (patch: Partial<TableState> = {}): TableState => ({
  q: '',
  filters: {},
  page: 1,
  size: 25,
  ...patch,
});

interface Room {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'closed';
  floor: string;
}

const ROOMS: Room[] = Array.from({ length: 53 }, (_, i) => ({
  id: i + 1,
  name: i === 7 ? 'Kafé Lumière' : `Ruang ${String(i + 1).padStart(2, '0')}`,
  code: `R-${i + 1}`,
  status: i % 3 === 0 ? 'closed' : 'active',
  floor: i < 20 ? 'GF' : 'L1',
}));

const QUERY = {
  text: (room: Room) => [room.name, room.code],
  filters: {
    status: (room: Room, values: readonly string[]) => values.includes(room.status),
    floor: (room: Room, values: readonly string[]) => values.includes(room.floor),
  },
};

describe('pembagian halaman', () => {
  it('nomor baris dan halaman di luar jangkauan pindah ke halaman terakhir', () => {
    expect(pageBounds(2, 25, 53)).toEqual({ first: 26, last: 50 });
    expect(pageBounds(3, 25, 53)).toEqual({ first: 51, last: 53 });
    expect(pageBounds(9, 25, 53)).toEqual({ first: 51, last: 53 });
    expect(pageBounds(1, 25, 0)).toEqual({ first: 0, last: 0 });
    expect(clampPage(999, 53, 25)).toBe(3);
    expect(clampPage(0, 53, 25)).toBe(1);
    expect(clampPage(4, 0, 25)).toBe(1);
  });

  it('nomor halaman: pertama, terakhir, sekitar halaman aktif, dan elipsis', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(1, 4)).toEqual([1, 2, 3, 4]);
    expect(pageWindow(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
    // Celah satu halaman tidak dijadikan elipsis.
    expect(pageWindow(4, 10)).toEqual([1, 2, 3, 4, 5, null, 10]);
  });
});

describe('queryRows (tabel kecil di klien)', () => {
  it('semua halaman berurutan tanpa baris ganda atau hilang', () => {
    for (const size of [10, 25, 50, 100] as const) {
      const ids: number[] = [];
      for (let page = 1; page <= Math.ceil(ROOMS.length / size); page++) {
        const result = queryRows(ROOMS, state({ page, size }), QUERY);
        expect(result.total).toBe(53);
        ids.push(...result.rows.map((room) => room.id));
      }
      expect(ids).toEqual(ROOMS.map((room) => room.id));
    }
  });

  it('cari tanpa membedakan huruf besar/kecil dan diakritik', () => {
    expect(queryRows(ROOMS, state({ q: 'kafe lumiere' }), QUERY).rows.map((r) => r.id)).toEqual([
      8,
    ]);
    expect(queryRows(ROOMS, state({ q: 'r-5' }), QUERY).rows.map((r) => r.code)).toEqual([
      'R-5',
      'R-50',
      'R-51',
      'R-52',
      'R-53',
    ]);
    expect(queryRows(ROOMS, state({ q: '%_\\' }), QUERY).total).toBe(0);
  });

  it('filter berlaku bersamaan (irisan); filter tanpa nilai diabaikan', () => {
    const closed = queryRows(ROOMS, state({ filters: { status: ['closed'] } }), QUERY);
    expect(closed.total).toBe(18);
    const closedGf = queryRows(
      ROOMS,
      state({ filters: { status: ['closed'], floor: ['GF'] } }),
      QUERY,
    );
    expect(closedGf.total).toBe(7);
    expect(closedGf.rows.every((r) => r.status === 'closed' && r.floor === 'GF')).toBe(true);
    expect(queryRows(ROOMS, state({ filters: { status: [] } }), QUERY).total).toBe(53);
  });

  it('halaman terlalu besar ditampilkan sebagai halaman terakhir', () => {
    const result = queryRows(ROOMS, state({ page: 999, size: 10 }), QUERY);
    expect(result.page).toBe(6);
    expect(result.rows.map((r) => r.id)).toEqual([51, 52, 53]);
  });
});

describe('filter aktif dan rentang tanggal', () => {
  it('kata kunci atau nilai filter apa pun membuat filter aktif', () => {
    expect(hasActiveFilters(state())).toBe(false);
    expect(hasActiveFilters(state({ filters: { tanggal: ['', ''] } }))).toBe(false);
    expect(hasActiveFilters(state({ q: ' ' }))).toBe(false);
    expect(hasActiveFilters(state({ q: 'radio' }))).toBe(true);
    expect(hasActiveFilters(state({ filters: { tanggal: ['2026-10-01', ''] } }))).toBe(true);
  });

  it('rentang tanggal tetap dua posisi: batas "dari" kosong tidak menggeser batas "sampai"', () => {
    const only = state({ filters: { tanggal: ['', '2026-10-06'] } });
    expect(filterValues(only, 'tanggal')).toEqual(['', '2026-10-06']);
    expect(isFilterActive(['', ''])).toBe(false);
    expect(isFilterActive(['', '2026-10-06'])).toBe(true);
    const rows = ['2026-10-05T03:00:00Z', '2026-10-07T03:00:00Z'];
    const result = queryRows(rows, only, {
      text: () => [],
      filters: { tanggal: (at, values) => withinDateRange(at, values, 'UTC') },
    });
    expect(result.rows).toEqual(['2026-10-05T03:00:00Z']);
  });

  it('rentang tanggal inklusif menurut zona waktu', () => {
    // 2026-10-06 18:30 UTC = 7 Oktober 01.30 WIB.
    const at = '2026-10-06T18:30:00Z';
    expect(withinDateRange(at, ['2026-10-07', '2026-10-07'], 'Asia/Jakarta')).toBe(true);
    expect(withinDateRange(at, ['2026-10-07', ''], 'UTC')).toBe(false);
    expect(withinDateRange(at, ['', '2026-10-06'], 'UTC')).toBe(true);
    expect(withinDateRange(at, [], 'UTC')).toBe(true);
  });
});

describe('tableController (perubahan keadaan tabel)', () => {
  /** Menjalankan aksi seperti setState fungsional: setiap perubahan membaca keadaan terbaru. */
  function run(initial: TableState, act: (table: TableController) => void): TableState {
    let current = initial;
    act(
      tableController(initial, (change: TableChange) => {
        current = change(current);
      }),
    );
    return current;
  }

  it('cari, filter, dan ukuran kembali ke halaman 1; pindah halaman tidak', () => {
    const start = state({ page: 4 });
    expect(run(start, (t) => t.setQuery('kafe'))).toMatchObject({ q: 'kafe', page: 1 });
    expect(run(start, (t) => t.setFilter('status', ['closed'])).page).toBe(1);
    expect(run(start, (t) => t.setSize(50))).toMatchObject({ size: 50, page: 1 });
    expect(run(start, (t) => t.setPage(7)).page).toBe(7);
  });

  it('pembaruan filter beruntun membaca nilai terbaru, bukan nilai saat dibuat', () => {
    const next = run(state(), (t) => {
      t.setFilter('floor', (values) => [...values, 'GF']);
      t.setFilter('floor', (values) => [...values, 'L1']);
    });
    expect(next.filters.floor).toEqual(['GF', 'L1']);
  });

  it('setFilters mengubah beberapa filter dalam satu perubahan; clearFilters mengosongkan semuanya', () => {
    const start = state({ q: 'ruang', filters: { building: ['a'], floor: ['a-1'] }, page: 3 });
    const switched = run(start, (t) => t.setFilters({ building: ['b'], floor: [] }));
    expect(switched).toMatchObject({ q: 'ruang', page: 1 });
    expect(switched.filters).toEqual({ building: ['b'], floor: [] });
    expect(run(start, (t) => t.clearFilters())).toMatchObject({ q: '', filters: {}, page: 1 });
  });
});

describe('withRangeEnd (mengubah satu ujung rentang tanggal)', () => {
  const range = { from: '2026-10-01', to: '2026-10-07' };

  it('ujung yang melewati ujung lain menggeser ujung itu, tidak menukar', () => {
    expect(withRangeEnd(range, 'from', '2026-10-09')).toEqual({
      from: '2026-10-09',
      to: '2026-10-09',
    });
    expect(withRangeEnd(range, 'to', '2026-09-28')).toEqual({
      from: '2026-09-28',
      to: '2026-09-28',
    });
  });

  it('di dalam rentang atau dikosongkan: ujung lain tetap', () => {
    expect(withRangeEnd(range, 'from', '2026-10-03')).toEqual({
      from: '2026-10-03',
      to: '2026-10-07',
    });
    expect(withRangeEnd(range, 'to', '')).toEqual({ from: '2026-10-01', to: '' });
    expect(withRangeEnd({ from: '', to: '' }, 'to', '2026-10-02')).toEqual({
      from: '',
      to: '2026-10-02',
    });
  });
});
