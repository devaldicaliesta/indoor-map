import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { fetchAllPages } from '../src/pagination';

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
