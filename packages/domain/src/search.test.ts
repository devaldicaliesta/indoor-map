import { describe, expect, it } from 'vitest';
import {
  matchToken,
  normalizeSearchText,
  prepareSearch,
  queryTokens,
  scoreEntry,
  searchEntries,
  searchWords,
  withinOneEdit,
} from './search';

describe('normalizeSearchText', () => {
  it('huruf kecil, tanpa diakritik, spasi dirapikan', () => {
    expect(normalizeSearchText('  Kafé   Crème ')).toBe('kafe creme');
    expect(normalizeSearchText('RADIOLOGI')).toBe('radiologi');
    expect(normalizeSearchText('')).toBe('');
  });
});

describe('searchWords', () => {
  it('tanda baca di tepi dibuang; kode bersambung menyumbang potongan per bagian', () => {
    expect(searchWords('(radiologi) gu-l1-020, rad.01')).toEqual([
      'radiologi',
      'gu-l1-020',
      'l1-020',
      '020',
      'rad.01',
      '01',
    ]);
    expect(searchWords('  ')).toEqual([]);
  });

  it('kata kueri tidak dipecah per bagian', () => {
    expect(queryTokens('  GU-L1-020, Lab ')).toEqual(['gu-l1-020', 'lab']);
    expect(queryTokens('— ')).toEqual([]);
  });
});

describe('withinOneEdit', () => {
  it.each([
    ['radiologi', 'radiologi'],
    ['radilogi', 'radiologi'], // satu huruf hilang
    ['radiologii', 'radiologi'], // satu huruf lebih
    ['radiologu', 'radiologi'], // satu huruf salah
    ['raidologi', 'radiologi'], // dua huruf bersebelahan tertukar
    ['', 'a'],
  ])('%s ≈ %s', (a, b) => {
    expect(withinOneEdit(a, b)).toBe(true);
    expect(withinOneEdit(b, a)).toBe(true);
  });

  it.each([
    ['radlogi', 'radiologi'], // dua huruf hilang
    ['rodiolagi', 'radiologi'], // dua huruf salah
    ['ab', 'ba x'],
    ['abc', 'cab'],
  ])('%s ≠ %s', (a, b) => {
    expect(withinOneEdit(a, b)).toBe(false);
  });
});

describe('matchToken', () => {
  const words = searchWords('radiologi rad-01 gu-l1-020');

  it('sama persis, awalan, lalu salah ketik ringan', () => {
    expect(matchToken('radiologi', words)).toBe('exact');
    expect(matchToken('rad', words)).toBe('prefix');
    expect(matchToken('020', words)).toBe('exact');
    expect(matchToken('l1-0', words)).toBe('prefix');
    expect(matchToken('radilogi', words)).toBe('typo');
    expect(matchToken('raidologi', words)).toBe('typo');
  });

  it('awalan yang sedang diketik boleh salah satu huruf mulai 5 huruf', () => {
    expect(matchToken('radil', words)).toBe('typo');
    expect(matchToken('radiolgi', words)).toBe('typo');
  });

  it('kata kueri < 5 huruf tidak ditoleransi salah ketik', () => {
    expect(matchToken('rid', words)).toBeNull();
    expect(matchToken('rdio', words)).toBeNull();
    expect(matchToken('labirin', words)).toBeNull();
  });

  it('kode dan angka harus tepat: kode unit tidak menemukan unit sebelahnya', () => {
    expect(matchToken('gu-l1-021', words)).toBeNull();
    expect(matchToken('rad-02', words)).toBeNull();
    expect(matchToken('0200', searchWords('1203 020'))).toBeNull();
  });
});

describe('scoreEntry dan searchEntries', () => {
  const entries = [
    { id: 'rad', text: 'Radiologi RAD-01 GU-L1-020 Rontgen' },
    { id: 'tunggu', text: 'Ruang Tunggu Ümum' },
    { id: 'rapat', text: 'Ruang Rapat' },
    { id: 'radio', text: 'Ruang Radio' },
    { id: 'toilet', text: 'Toilet' },
    { id: 'toilet-lobi', text: 'Toilet Lobi' },
  ];
  const prepared = prepareSearch(entries);
  const ids = (query: string) => searchEntries(prepared, query).map((m) => m.entry.id);

  it('semua kata kueri harus cocok', () => {
    expect(ids('ruang tunggu')).toEqual(['tunggu']);
    expect(ids('ruang umum')).toEqual(['tunggu']);
    expect(ids('ruang')).toEqual(['radio', 'rapat', 'tunggu']);
  });

  it('"radilogi" menemukan Radiologi; kode unit, kode lokasi, dan alias bisa dicari', () => {
    expect(ids('radilogi')).toEqual(['rad']);
    expect(ids('RADIOLOGI')).toEqual(['rad']);
    expect(ids('gu-l1-020')).toEqual(['rad']);
    expect(ids('rad-01')).toEqual(['rad']);
    expect(ids('rontgen')).toEqual(['rad']);
  });

  it('nama yang diawali kueri dan nama yang lebih pendek lebih dulu', () => {
    expect(ids('radio')).toEqual(['rad', 'radio']);
    expect(ids('toilet')).toEqual(['toilet', 'toilet-lobi']);
  });

  it('kueri kosong atau tanpa huruf tidak menghasilkan apa pun', () => {
    expect(ids('')).toEqual([]);
    expect(ids(' - ')).toEqual([]);
    expect(scoreEntry([], prepared[0] ?? { text: '', words: [] })).toBeNull();
  });

  it('skor sama diurutkan dengan pemecah seri dari pemanggil', () => {
    const tied = prepareSearch([
      { id: 'b', text: 'lab' },
      { id: 'a', text: 'lab' },
    ]);
    const byId = searchEntries(tied, 'lab', (x, y) => x.id.localeCompare(y.id));
    expect(byId.map((m) => m.entry.id)).toEqual(['a', 'b']);
  });
});
