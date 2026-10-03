import { describe, expect, it } from 'vitest';
import { categoryUnitColors, tintColor } from '../src/tint';

describe('warna unit kategori', () => {
  it('mencampur dengan putih menurut takaran', () => {
    expect(tintColor('#000000', 0)).toBe('#000000');
    expect(tintColor('#000000', 1)).toBe('#ffffff');
    expect(tintColor('#3b6fb6', 0.5)).toBe('#9db7db');
    expect(tintColor('bukan', 0.5)).toBe('bukan');
  });

  it('isi pastel lebih terang dari garis tepinya', () => {
    const { fill, outline } = categoryUnitColors('#d2452f');
    const lightness = (hex: string) =>
      [1, 3, 5].reduce((sum, i) => sum + Number.parseInt(hex.slice(i, i + 2), 16), 0);
    expect(lightness(fill)).toBeGreaterThan(lightness(outline));
  });
});
