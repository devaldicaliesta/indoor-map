import { describe, expect, it } from 'vitest';
import {
  matchWord,
  normalizeSearchText,
  prepareSearchEntries,
  queryWords,
  scoreWords,
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

describe('kata pencarian', () => {
  it('tanda baca memisahkan kata dan bentuk tanpa tanda baca ikut disimpan', () => {
    expect(searchWords('Radiologi RAD-01 gf-a01')).toEqual([
      'radiologi',
      'rad',
      '01',
      'rad01',
      'gf',
      'a01',
      'gfa01',
    ]);
    expect(searchWords(' - ')).toEqual([]);
  });

  it('kueri dipecah di spasi dan tanda baca', () => {
    expect(queryWords('  GF-A01  Radio ')).toEqual(['gf', 'a01', 'radio']);
    expect(queryWords('—')).toEqual([]);
  });
});

describe('jarak edit paling banyak satu', () => {
  it.each([
    ['radiologi', 'radiologi'],
    ['radilogi', 'radiologi'],
    ['radiologii', 'radiologi'],
    ['radiologu', 'radiologi'],
    ['radiolgoi', 'radiologi'],
    ['', 'a'],
  ])('%s ≈ %s', (a, b) => {
    expect(withinOneEdit(a, b)).toBe(true);
    expect(withinOneEdit(b, a)).toBe(true);
  });

  it.each([
    ['radlogi', 'radiologi'],
    ['rdaiolgoi', 'radiologi'],
    ['radiolxyi', 'radiologi'],
    ['', 'ab'],
  ])('%s ≠ %s', (a, b) => {
    expect(withinOneEdit(a, b)).toBe(false);
  });
});

describe('cocok per kata', () => {
  it('sama persis dan awalan', () => {
    expect(matchWord('radiologi', 'radiologi')).toBe('exact');
    expect(matchWord('rad', 'radiologi')).toBe('prefix');
    expect(matchWord('logi', 'radiologi')).toBeNull();
  });

  it('salah ketik satu huruf untuk kata ≥ 5 huruf, juga selagi mengetik', () => {
    expect(matchWord('radilogi', 'radiologi')).toBe('typo');
    expect(matchWord('radilo', 'radiologi')).toBe('typo');
    expect(matchWord('radiolgoi', 'radiologi')).toBe('typo');
    expect(matchWord('radiologix', 'radiologi')).toBe('typo');
  });

  it('kata pendek dan kode yang mengandung angka harus persis', () => {
    expect(matchWord('rdio', 'radio')).toBeNull();
    expect(matchWord('gfa02', 'gfa01')).toBeNull();
    expect(matchWord('kantor', 'kantin')).toBeNull();
  });
});

describe('skor teks', () => {
  const words = searchWords('Radiologi RAD-01 GF-A01 rontgen');

  it('semua kata kueri harus cocok', () => {
    expect(scoreWords(['radio', 'rontgen'], words)).not.toBeNull();
    expect(scoreWords(['radio', 'apotek'], words)).toBeNull();
    expect(scoreWords([], words)).toBeNull();
  });

  it('mencatat salah ketik, frasa utuh, dan kata yang sama persis', () => {
    expect(scoreWords(['radilogi'], words)).toEqual({ typos: 1, phrase: false, exact: 0 });
    expect(scoreWords(['rad', '01'], words)).toEqual({ typos: 0, phrase: true, exact: 2 });
    expect(scoreWords(['rontgen', 'rad'], words)).toEqual({ typos: 0, phrase: false, exact: 2 });
    expect(scoreWords(['gfa01'], words)).toEqual({ typos: 0, phrase: true, exact: 1 });
  });
});

describe('searchEntries', () => {
  const entries = prepareSearchEntries([
    { id: 'kardiologi', text: 'kardiologi' },
    { id: 'radiologi', text: 'radiologi rad-01 gf-a01' },
    { id: 'radio', text: 'ruang radio' },
    { id: 'lab', text: 'laboratorium gf-a02' },
    { id: 'apotik', text: 'apotik' },
    { id: 'apotek', text: 'apotek' },
  ]);
  const ids = (query: string) => searchEntries(entries, query).map((hit) => hit.entry.id);

  it('"radilogi" menemukan Radiologi', () => {
    expect(ids('radilogi')).toEqual(['radiologi']);
    expect(ids('RADIOLOGI')).toEqual(['radiologi']);
  });

  it('kode lokasi dan kode unit bisa dicari, dengan atau tanpa tanda baca', () => {
    expect(ids('RAD-01')).toEqual(['radiologi']);
    expect(ids('rad01')).toEqual(['radiologi']);
    expect(ids('gf-a0')).toEqual(['radiologi', 'lab']);
    expect(ids('GF-A02')).toEqual(['lab']);
  });

  it('tanpa salah ketik lebih dulu, lalu kata yang sama persis; skor sama tetap urut masukan', () => {
    expect(ids('apotek')).toEqual(['apotek', 'apotik']);
    expect(ids('apotik')).toEqual(['apotik', 'apotek']);
    expect(ids('radio')).toEqual(['radio', 'radiologi']);
    expect(ids('apot')).toEqual(['apotik', 'apotek']);
  });

  it('kueri kosong atau tanpa huruf/angka tidak menghasilkan apa pun', () => {
    expect(ids('')).toEqual([]);
    expect(ids('  -- ')).toEqual([]);
  });
});
