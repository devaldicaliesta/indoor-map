/** `#rrggbb` dicampur putih: `amount` 0 = warna asli, 1 = putih. */
export function tintColor(hex: string, amount: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const value = Number.parseInt(match[1] as string, 16);
  const channel = (shift: number) => {
    const c = (value >> shift) & 0xff;
    return Math.round(c + (255 - c) * Math.min(1, Math.max(0, amount)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/**
 * Warna unit dari warna kategori, bergaya peta indoor komersial: isi pastel agar nama dan ikon
 * tetap terbaca, garis tepi lebih pekat dari warna yang sama.
 */
export function categoryUnitColors(hex: string): { fill: string; outline: string } {
  return { fill: tintColor(hex, 0.72), outline: tintColor(hex, 0.3) };
}
