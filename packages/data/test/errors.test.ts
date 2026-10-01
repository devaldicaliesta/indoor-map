import { describe, expect, it } from 'vitest';
import { DataError, toDataError } from '../src/errors';

// Bentuk error PostgREST seperti yang dikembalikan supabase-js.
const postgrestError = (code: string, message = 'pesan asli') => ({
  code,
  message,
  details: null,
  hint: null,
});

describe('toDataError', () => {
  it.each([
    ['23505', 'conflict'],
    ['23503', 'conflict'],
    ['23514', 'invalid'],
    ['23502', 'invalid'],
    ['22P02', 'invalid'],
    ['22001', 'invalid'],
    ['42501', 'forbidden'],
    ['PGRST116', 'not_found'],
    ['PGRST301', 'forbidden'],
  ])('kode %s menjadi kind %s', (code, kind) => {
    const error = toDataError(postgrestError(code));
    expect(error).toBeInstanceOf(DataError);
    expect(error.kind).toBe(kind);
    expect(error.code).toBe(code);
  });

  it('pelanggaran RLS saat insert menjadi forbidden dengan pesan Bahasa Indonesia', () => {
    const error = toDataError(
      postgrestError('42501', 'new row violates row-level security policy for table "venues"'),
    );
    expect(error.kind).toBe('forbidden');
    expect(error.message).toBe('Anda tidak memiliki izin untuk tindakan ini.');
  });

  it('kode proyek IMxxx menampilkan pesan dari server', () => {
    const error = toDataError(
      postgrestError('IM409', 'Tidak bisa mengubah satu-satunya Super Admin aktif.'),
    );
    expect(error.kind).toBe('conflict');
    expect(error.message).toBe('Tidak bisa mengubah satu-satunya Super Admin aktif.');
  });

  it('menyimpan error asli sebagai cause', () => {
    const original = postgrestError('23505');
    expect(toDataError(original).cause).toBe(original);
  });

  it('kegagalan fetch menjadi network', () => {
    expect(toDataError(new TypeError('Failed to fetch')).kind).toBe('network');
    expect(toDataError({ code: '', message: 'TypeError: fetch failed' }).kind).toBe('network');
  });

  it('status HTTP dari Storage dipetakan (RLS Storage, ukuran berkas)', () => {
    expect(
      toDataError({ statusCode: '403', message: 'new row violates row-level security policy' })
        .kind,
    ).toBe('forbidden');
    const tooLarge = toDataError({ statusCode: '413', message: 'Payload too large' });
    expect(tooLarge.kind).toBe('invalid');
    expect(tooLarge.message).toContain('5 MB');
  });

  it('error yang tidak dikenal menjadi unknown', () => {
    expect(toDataError(postgrestError('XX000')).kind).toBe('unknown');
    expect(toDataError('teks').kind).toBe('unknown');
  });

  it('DataError diteruskan apa adanya', () => {
    const original = new DataError('conflict');
    expect(toDataError(original)).toBe(original);
  });
});
