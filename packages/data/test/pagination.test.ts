import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { fetchAllPages, listPage, pageRange } from '../src/pagination';

const source = Array.from({ length: 2503 }, (_, i) => i);

describe('fetchAllPages', () => {
  it('mengambil semua halaman sampai halaman terakhir tidak penuh', async () => {
    const calls: [number, number][] = [];
    const rows = await fetchAllPages(async (from, to) => {
      calls.push([from, to]);
      return { data: source.slice(from, to + 1), error: null };
    });
    expect(rows).toEqual(source);
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it('tepat satu halaman penuh butuh satu permintaan tambahan yang kosong', async () => {
    let calls = 0;
    const rows = await fetchAllPages(async (from, to) => {
      calls++;
      return { data: source.slice(0, 1000).slice(from, to + 1), error: null };
    });
    expect(rows).toHaveLength(1000);
    expect(calls).toBe(2);
  });

  it('galat PostgREST menjadi DataError', async () => {
    await expect(
      fetchAllPages(async () => ({ data: null, error: { code: '42501', message: 'x' } })),
    ).rejects.toBeInstanceOf(DataError);
  });
});

describe('listPage (tabel server)', () => {
  const rows = Array.from({ length: 53 }, (_, i) => ({ id: i + 1 }));
  const request = async (from: number, to: number) =>
    from >= rows.length && rows.length > 0
      ? { data: null, error: { code: 'PGRST103', message: 'range' }, count: null }
      : { data: rows.slice(from, to + 1), error: null, count: rows.length };

  it('rentang halaman dan total dari count exact', async () => {
    expect(pageRange(1, 25)).toEqual({ from: 0, to: 24 });
    expect(pageRange(3, 25)).toEqual({ from: 50, to: 74 });
    expect(pageRange(0, 10)).toEqual({ from: 0, to: 9 });
    const page = await listPage(request, { page: 3, size: 25 }, (r) => r.map((x) => x.id));
    expect(page).toEqual({ rows: [51, 52, 53], total: 53 });
  });

  it('halaman di luar jangkauan (PGRST103) kosong dengan total yang benar', async () => {
    const page = await listPage(request, { page: 9, size: 25 }, (r) => r);
    expect(page).toEqual({ rows: [], total: 53 });
  });

  it('galat lain menjadi DataError', async () => {
    await expect(
      listPage(
        async () => ({ data: null, error: { code: '42501', message: 'x' }, count: null }),
        { page: 1, size: 10 },
        (r) => r,
      ),
    ).rejects.toBeInstanceOf(DataError);
  });
});
