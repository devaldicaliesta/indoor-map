import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  readableTextOn,
  relativeLuminance,
  WCAG_AA_TEXT,
  WCAG_AA_UI,
} from '../src/lib/contrast';

// Nilai diambil langsung dari tokens.css agar test gagal jika token berubah tanpa dicek.
const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const rootBlock = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
const tokens = Object.fromEntries(
  [...rootBlock.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/gi)].map(([, name, hex]) => [name, hex]),
) as Record<string, string>;

function token(name: string): string {
  const value = tokens[name];
  if (!value) throw new Error(`token --${name} tidak ada di tokens.css`);
  return value;
}

describe('rumus kontras', () => {
  it('hitam di atas putih = 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5);
  });

  it('readableTextOn memilih teks yang lolos AA', () => {
    expect(readableTextOn('#ffc20e', ['#ffffff', '#111418'])).toBe('#111418');
    expect(readableTextOn('#1463ff', ['#111418', '#ffffff'])).toBe('#ffffff');
  });
});

describe('pasangan teks/latar token lolos WCAG AA (4,5:1)', () => {
  const textPairs: [string, string][] = [
    ['ink', 'surface'],
    ['ink', 'canvas'],
    ['ink', 'signal'],
    ['ink', 'signal-soft'],
    ['ink-muted', 'surface'],
    ['ink-muted', 'canvas'],
    ['on-strong', 'danger'],
    ['on-strong', 'route'],
    ['surface', 'ink'],
    ['danger', 'surface'],
    ['ok', 'surface'],
  ];

  // --warn (4,24:1) hanya untuk elemen non-teks (titik, ikon); teks peringatan memakai --ink.
  it.each(textPairs)('--%s di atas --%s', (fg, bg) => {
    expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });
});

describe('elemen UI non-teks lolos 3:1', () => {
  const uiPairs: [string, string][] = [
    ['ok', 'surface'],
    ['warn', 'surface'],
    ['danger', 'surface'],
    ['route', 'surface'],
    ['ink-muted', 'surface'],
    ['ink-muted', 'canvas'],
  ];

  // Batas input/select memakai --ink-muted; --line (1,4:1) hanya untuk garis pemisah.
  it.each(uiPairs)('titik/garis --%s di atas --%s', (fg, bg) => {
    expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(WCAG_AA_UI);
  });
});
