import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as paths from '../src/brand/logo-paths';

// Semua turunan logo dibuat scripts/brand-assets.mjs dari satu sumber. Test ini gagal bila sumber
// diubah tanpa menjalankan ulang skrip, atau bila turunan disunting manual.
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const source = read('../src/brand/panduarah-logo.svg');

function parts(svg: string): Record<string, { fill: string; d: string }> {
  return Object.fromEntries(
    [...svg.matchAll(/<path id="([^"]+)" fill="([^"]+)" fill-rule="evenodd" d="([^"]+)"\/>/g)].map(
      ([, id = '', fill = '', d = '']) => [id, { fill, d }],
    ),
  );
}

const viewBox = (svg: string) => /<svg[^>]*\sviewBox="([^"]+)"/.exec(svg)?.[1];
const original = parts(source);

describe('logo PanduArah', () => {
  it('sumber berisi simbol biru, simbol kuning, dan tulisan', () => {
    expect(Object.keys(original)).toEqual(['symbol-blue', 'symbol-yellow', 'wordmark']);
    expect(viewBox(source)).toBe(`0 0 ${paths.LOGO_WIDTH} ${paths.LOGO_HEIGHT}`);
    expect(source).toContain(
      `<view id="symbol" viewBox="0 0 ${paths.SYMBOL_WIDTH} ${paths.LOGO_HEIGHT}"/>`,
    );
  });

  it('path komponen React sama dengan sumber', () => {
    expect(paths.SYMBOL_BLUE).toBe(original['symbol-blue']?.d);
    expect(paths.SYMBOL_YELLOW).toBe(original['symbol-yellow']?.d);
    expect(paths.WORDMARK).toBe(original.wordmark?.d);
  });

  it('warna token --brand-* sama dengan warna berkas sumber', () => {
    const tokens = read('../src/styles/tokens.css');
    const token = (name: string) =>
      new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, 'i').exec(tokens)?.[1];
    expect(token('brand-blue')?.toUpperCase()).toBe(original['symbol-blue']?.fill);
    expect(token('brand-yellow')?.toUpperCase()).toBe(original['symbol-yellow']?.fill);
    expect(token('brand-ink')?.toUpperCase()).toBe(original.wordmark?.fill);
  });

  it('simbol saja: tanpa tulisan, lebar dari <view id="symbol">', () => {
    const symbol = read('../src/brand/panduarah-symbol.svg');
    expect(viewBox(symbol)).toBe(`0 0 ${paths.SYMBOL_WIDTH} ${paths.LOGO_HEIGHT}`);
    expect(parts(symbol)).toEqual({
      'symbol-blue': original['symbol-blue'],
      'symbol-yellow': original['symbol-yellow'],
    });
    // Favicon Admin dan Visitor memakai berkas simbol yang sama.
    expect(read('../../../apps/admin/public/favicon.svg')).toBe(symbol);
    expect(read('../../../apps/visitor/public/icons/favicon.svg')).toBe(symbol);
  });

  it('varian putih: bentuk sama, semua bagian putih, tanpa kotak latar', () => {
    for (const [file, ids] of [
      ['../src/brand/panduarah-logo-white.svg', ['symbol-blue', 'symbol-yellow', 'wordmark']],
      ['../src/brand/panduarah-symbol-white.svg', ['symbol-blue', 'symbol-yellow']],
    ] as const) {
      const white = read(file);
      expect(white).not.toMatch(/<rect|background/);
      const found = parts(white);
      expect(Object.keys(found)).toEqual(ids);
      for (const id of ids) expect(found[id]).toEqual({ fill: '#FFFFFF', d: original[id]?.d });
    }
  });
});
