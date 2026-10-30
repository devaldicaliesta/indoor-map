import { describe, expect, it } from 'vitest';
import { userDataExportFilename } from '../src';

describe('userDataExportFilename', () => {
  it('memakai email dan tanggal export', () => {
    expect(userDataExportFilename('Budi@RS-Harapan.id', '2026-10-30T03:45:54.428759+00:00')).toBe(
      'data-akun-budi-rs-harapan-id-2026-10-30.json',
    );
  });

  it('membuang karakter yang tidak aman di nama berkas', () => {
    expect(userDataExportFilename('../a b+c@x.id', '2026-01-02T00:00:00Z')).toBe(
      'data-akun-a-b-c-x-id-2026-01-02.json',
    );
  });

  it('tetap punya nama saat email atau tanggal tidak terbaca', () => {
    expect(userDataExportFilename('@@', 'bukan tanggal')).toBe('data-akun-pengguna.json');
  });
});
