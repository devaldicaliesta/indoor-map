import { describe, expect, it } from 'vitest';
import { encodeQr, qrSvgPath } from '../src';

const URL = 'https://peta.contoh.id/v/10000000-0000-4000-8000-000000000001?o=0123456789ab';

/** Finder 7×7 di pojok (x, y): cincin luar gelap, cincin kedua terang, inti 3×3 gelap. */
function hasFinder(m: boolean[][], x: number, y: number) {
  for (let dy = 0; dy < 7; dy++) {
    for (let dx = 0; dx < 7; dx++) {
      const d = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      if (m[y + dy]?.[x + dx] !== (d !== 2)) return false;
    }
  }
  return true;
}

// Hasil encoder ini dibaca decoder OpenCV saat dibuat (versi 1, 2, 5, 13, 32, termasuk UTF-8);
// test di sini menjaga struktur dan memastikan keluaran tidak berubah diam-diam.
describe('encodeQr', () => {
  it('versi terkecil yang muat: ukuran 21 + 4 per versi', () => {
    expect(encodeQr('A')).toHaveLength(21);
    expect(encodeQr(URL)).toHaveLength(37);
    expect(encodeQr('x'.repeat(300))).toHaveLength(69);
  });

  it('tiga finder dan pola timing di tempatnya', () => {
    const m = encodeQr(URL);
    const n = m.length;
    expect(hasFinder(m, 0, 0) && hasFinder(m, n - 7, 0) && hasFinder(m, 0, n - 7)).toBe(true);
    for (let i = 8; i < n - 8; i++) {
      expect(m[6]?.[i]).toBe(i % 2 === 0);
      expect(m[i]?.[6]).toBe(i % 2 === 0);
    }
    expect(m[n - 8]?.[8]).toBe(true);
  });

  it('deterministik', () => {
    const rows = (m: boolean[][]) => m.map((r) => r.map(Number).join(''));
    expect(rows(encodeQr(URL))).toEqual(rows(encodeQr(URL)));
    expect(rows(encodeQr('A')).join('\n')).toMatchInlineSnapshot(`
      "111111101001001111111
      100000101111101000001
      101110100010101011101
      101110101101101011101
      101110100111001011101
      100000100101101000001
      111111101010101111111
      000000001101100000000
      101101110011101001011
      010110010101111001000
      110011101101000001101
      101101000001001111100
      100111100100100100100
      000000001011001001001
      111111101001100101000
      100000101100000110110
      101110100110111110001
      101110101111001111110
      101110101010101100000
      100000100010010100101
      111111101000010010000"
    `);
  });

  it('teks terlalu panjang ditolak', () => {
    expect(() => encodeQr('x'.repeat(3000))).toThrow();
  });

  it('path SVG: satu persegi per modul gelap, bergeser zona tenang', () => {
    const path = qrSvgPath([
      [true, false],
      [false, true],
    ]);
    expect(path).toBe('M4 4h1v1h-1zM5 5h1v1h-1z');
  });
});
