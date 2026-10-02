import type { Branding } from '@indoor/domain';
import { contrastRatio, readableTextOn, WCAG_AA_TEXT, WCAG_AA_UI } from '../lib/contrast';

/** Nilai token bawaan di tokens.css yang dipakai untuk menghitung branding (dijaga test). */
export const BRAND_DEFAULTS = {
  signal: '#ffc20e',
  signalSoft: '#ffe9a8',
  route: '#1463ff',
  ink: '#111418',
  white: '#ffffff',
  canvas: '#f2f3ef',
} as const;

// --signal-soft bawaan adalah 36% --signal di atas putih; rasio yang sama dipakai untuk warna
// utama venue sehingga latar seleksi tetap pucat dan --ink di atasnya lolos AA.
const SOFT_RATIO = 0.36;

type BrandColors = Pick<Branding, 'primaryColor' | 'routeColor'>;

function mixWithWhite(hex: string, ratio: number): string {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return `#${channels
    .map((c) =>
      Math.round(c * ratio + 255 * (1 - ratio))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/**
 * Token CSS yang ditimpa branding venue. Warna teks di atas warna utama dan warna rute dipilih
 * otomatis (--ink lebih dulu untuk warna utama, putih lebih dulu untuk rute) agar lolos WCAG AA.
 */
export function brandingTokens(branding: BrandColors): Record<string, string> {
  const tokens: Record<string, string> = {};
  const { primaryColor, routeColor } = branding;
  if (primaryColor) {
    tokens['--signal'] = primaryColor;
    tokens['--signal-soft'] = mixWithWhite(primaryColor, SOFT_RATIO);
    tokens['--on-signal'] = readableTextOn(primaryColor, [
      BRAND_DEFAULTS.ink,
      BRAND_DEFAULTS.white,
    ]);
  }
  if (routeColor) {
    tokens['--route'] = routeColor;
    tokens['--on-route'] = readableTextOn(routeColor, [BRAND_DEFAULTS.white, BRAND_DEFAULTS.ink]);
  }
  return tokens;
}

interface StyleTarget {
  style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>;
}

/** Memasang token branding di `target` (biasanya `<html>`); hasilnya mengembalikan token bawaan. */
export function applyBranding(target: StyleTarget, branding: BrandColors): () => void {
  const tokens = brandingTokens(branding);
  for (const [name, value] of Object.entries(tokens)) target.style.setProperty(name, value);
  return () => {
    for (const name of Object.keys(tokens)) target.style.removeProperty(name);
  };
}

export interface ContrastCheck {
  ratio: number;
  passes: boolean;
}

/** Warna teks yang akan dipakai di atas warna utama, untuk ditampilkan di formulir Branding. */
export function primaryTextCheck(
  primaryColor: string,
): ContrastCheck & { text: 'ink' | 'white'; color: string } {
  const color = readableTextOn(primaryColor, [BRAND_DEFAULTS.ink, BRAND_DEFAULTS.white]);
  const ratio = contrastRatio(color, primaryColor);
  return {
    text: color === BRAND_DEFAULTS.ink ? 'ink' : 'white',
    color,
    ratio,
    passes: ratio >= WCAG_AA_TEXT,
  };
}

/** Garis rute harus terlihat di atas latar peta (elemen non-teks, 3:1). */
export function routeLineCheck(routeColor: string): ContrastCheck {
  const ratio = contrastRatio(routeColor, BRAND_DEFAULTS.canvas);
  return { ratio, passes: ratio >= WCAG_AA_UI };
}
