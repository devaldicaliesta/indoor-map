import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from '../src';

describe('CSV', () => {
  it('kutip, pemisah dan baris baru di dalam sel, BOM, CRLF, baris kosong di akhir', () => {
    const text = '﻿kode,nama,deskripsi\r\nA-1,"Lab, Klinik","Lantai 1\nsayap ""timur"""\r\n,,\r\n';
    expect(parseCsv(text)).toEqual([
      ['kode', 'nama', 'deskripsi'],
      ['A-1', 'Lab, Klinik', 'Lantai 1\nsayap "timur"'],
    ]);
  });

  it('pemisah titik koma dari Excel berbahasa Indonesia', () => {
    expect(parseCsv('kode;nama\nA-1;Rp 1,5 juta\n')).toEqual([
      ['kode', 'nama'],
      ['A-1', 'Rp 1,5 juta'],
    ]);
  });

  it('toCsv lalu parseCsv mengembalikan tabel yang sama', () => {
    const table = [
      ['kode', 'nama'],
      ['A;1', 'Kafe "Senja", lantai 2\nbaris dua'],
    ];
    expect(parseCsv(toCsv(table))).toEqual(table);
  });
});
