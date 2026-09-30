/** Rasio kontras WCAG 2.x antara dua warna hex (#rgb atau #rrggbb). */

export const WCAG_AA_TEXT = 4.5;
export const WCAG_AA_UI = 3;

function parseHex(hex: string): [number, number, number] {
  const value = hex.trim().replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`Warna hex tidak valid: ${hex}`);
  }
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

function channel(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(channel) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Warna teks pertama dari `candidates` yang lolos AA di atas `background`;
 * jika tidak ada, yang kontrasnya tertinggi (dipakai branding venue).
 */
export function readableTextOn(background: string, candidates: readonly string[]): string {
  const first = candidates[0];
  if (first === undefined) {
    throw new Error('Minimal satu kandidat warna teks');
  }
  const passing = candidates.find((c) => contrastRatio(c, background) >= WCAG_AA_TEXT);
  if (passing) return passing;
  return candidates.reduce(
    (best, c) => (contrastRatio(c, background) > contrastRatio(best, background) ? c : best),
    first,
  );
}
