import type { FilterDef, TableState } from '@indoor/ui';
import { describe, expect, it } from 'vitest';
import {
  pendingAfterRender,
  readTableState,
  type TableUrlOptions,
  writeTableState,
} from './table-url';

const FILTERS: FilterDef[] = [
  {
    kind: 'multi',
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Aktif' },
      { value: 'coming_soon', label: 'Segera buka' },
      { value: 'closed', label: 'Nonaktif' },
    ],
  },
  {
    kind: 'select',
    key: 'kategori',
    label: 'Kategori',
    allLabel: 'Semua kategori',
    options: [
      { value: 'poli', label: 'Poli' },
      { value: 'lab', label: 'Lab' },
    ],
  },
  { kind: 'dateRange', key: 'tanggal', label: 'Tanggal' },
];
const OPTIONS: TableUrlOptions = { filters: FILTERS };
const read = (query: string, options = OPTIONS) =>
  readTableState(new URLSearchParams(query), options);

describe('readTableState', () => {
  it('membaca kata kunci, filter, halaman, dan ukuran halaman', () => {
    expect(
      read(
        'q=radi%C3%B3&status=active,closed&kategori=lab&tanggal=2026-10-01..2026-10-07&page=3&size=50',
      ),
    ).toEqual({
      q: 'radió',
      filters: {
        status: ['active', 'closed'],
        kategori: ['lab'],
        tanggal: ['2026-10-01', '2026-10-07'],
      },
      page: 3,
      size: 50,
    });
  });

  it('URL rusak dinormalisasi ke nilai sah tanpa galat (TC-TBL-05)', () => {
    expect(read('page=abc&size=7&status=bogus,active,active&kategori=lab,poli,xyz')).toEqual({
      q: '',
      filters: { status: ['active'], kategori: ['lab'] },
      page: 1,
      size: 25,
    });
    expect(read('page=-2&size=1000').page).toBe(1);
    expect(read('page=2.5').page).toBe(1);
    // Halaman terlalu besar dibiarkan; DataTable membatasinya setelah jumlah data diketahui.
    expect(read('page=999').page).toBe(999);
    expect(read('tanggal=bukan..tanggal').filters).toEqual({});
    expect(read('tanggal=2026-02-30..').filters).toEqual({});
    expect(read('tanggal=2026-10-07..2026-10-01').filters.tanggal).toEqual([
      '2026-10-01',
      '2026-10-07',
    ]);
    expect(read('tanggal=..2026-10-07').filters.tanggal).toEqual(['', '2026-10-07']);
  });

  it('nilai filter dipertahankan selama pilihannya masih dimuat', () => {
    const loading: TableUrlOptions = {
      filters: [
        { kind: 'select', key: 'kategori', label: 'Kategori', allLabel: '', options: undefined },
      ],
    };
    expect(read('kategori=uuid-belum-dimuat', loading).filters).toEqual({
      kategori: ['uuid-belum-dimuat'],
    });
  });

  it('awalan memisahkan dua tabel di satu halaman', () => {
    const params = 'q=lokasi&kat.q=poli&kat.page=2';
    expect(read(params).q).toBe('lokasi');
    expect(read(params, { ...OPTIONS, prefix: 'kat.' })).toMatchObject({ q: 'poli', page: 2 });
  });
});

describe('writeTableState', () => {
  const state: TableState = {
    q: 'radio',
    filters: { status: ['active', 'coming_soon'], tanggal: ['2026-10-01', ''] },
    page: 2,
    size: 100,
  };

  it('nilai bawaan tidak ditulis; parameter lain di URL tetap', () => {
    const written = writeTableState(new URLSearchParams('tab=all&q=lama'), state, OPTIONS);
    expect(Object.fromEntries(written)).toEqual({
      tab: 'all',
      q: 'radio',
      status: 'active,coming_soon',
      tanggal: '2026-10-01..',
      page: '2',
      size: '100',
    });
    const reset = writeTableState(written, { q: ' ', filters: {}, page: 1, size: 25 }, OPTIONS);
    expect(reset.toString()).toBe('tab=all');
  });

  it('bolak-balik URL ↔ keadaan tidak mengubah apa pun (salin URL ke tab baru, TC-TBL-04)', () => {
    const url = writeTableState(new URLSearchParams(), state, OPTIONS);
    expect(readTableState(url, OPTIONS)).toEqual(state);
  });
});

describe('pendingAfterRender (perubahan beruntun sebelum render)', () => {
  it('tulisan yang sudah dirender keluar dari antrean, yang belum tetap', () => {
    expect(pendingAfterRender(['a=1', 'a=1,2'], 'a=1')).toEqual(['a=1,2']);
    expect(pendingAfterRender(['a=1', 'a=1,2'], 'a=1,2')).toEqual([]);
  });

  it('URL lain (tombol Back) mengosongkan antrean', () => {
    expect(pendingAfterRender(['a=1', 'a=1,2'], 'b=3')).toEqual([]);
    expect(pendingAfterRender([], 'a=1')).toEqual([]);
  });
});
