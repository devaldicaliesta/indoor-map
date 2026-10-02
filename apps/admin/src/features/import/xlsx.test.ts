import { describe, expect, it } from 'vitest';
import { columnName, readXlsx, writeXlsx } from './xlsx';

describe('XLSX', () => {
  it('nama kolom A…Z, AA, AB', () => {
    expect([0, 25, 26, 27, 701].map(columnName)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ']);
  });

  it('tulis lalu baca mengembalikan tabel teks yang sama, termasuk karakter khusus', () => {
    const table = [
      ['kode_lokasi', 'nama', 'deskripsi'],
      ['A-1', 'Kafe <Senja> & "Teman"', 'Baris satu\nbaris dua'],
      ['', 'Tanpa kode', ''],
    ];
    expect(readXlsx(writeXlsx(table))).toEqual([
      ['kode_lokasi', 'nama', 'deskripsi'],
      ['A-1', 'Kafe <Senja> & "Teman"', 'Baris satu\nbaris dua'],
      ['', 'Tanpa kode'],
    ]);
  });

  it('berkas yang bukan XLSX ditolak dengan pesan', () => {
    expect(() => readXlsx(new Uint8Array([1, 2, 3]))).toThrow('Berkas bukan XLSX yang sah.');
  });
});

describe('XLSX karakter kontrol', () => {
  it('karakter kontrol yang tidak sah di XML dibuang, tab dan baris baru dipertahankan', () => {
    expect(readXlsx(writeXlsx([['a\u0001b\tc\nd']]))).toEqual([['ab\tc\nd']]);
  });
});
