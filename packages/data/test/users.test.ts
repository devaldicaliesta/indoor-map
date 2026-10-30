import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { toUserDataExport } from '../src/repositories/users';

describe('toUserDataExport', () => {
  it('membaca versi format dan waktu export, dokumen utuh untuk diunduh', () => {
    const document = {
      format: 'panduarah.user-data/1',
      exported_at: '2026-10-30T03:45:54+00:00',
      account: { email: 'ed@contoh.id' },
    };
    expect(toUserDataExport(document)).toEqual({
      format: 'panduarah.user-data/1',
      exportedAt: '2026-10-30T03:45:54+00:00',
      document,
    });
  });

  it('menolak jawaban server yang bukan dokumen export', () => {
    expect(() => toUserDataExport(null)).toThrow(DataError);
    expect(() => toUserDataExport([])).toThrow(DataError);
    expect(() => toUserDataExport({ format: 1 })).toThrow(DataError);
  });
});
