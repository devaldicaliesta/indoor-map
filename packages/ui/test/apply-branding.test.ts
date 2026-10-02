import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio, WCAG_AA_TEXT } from '../src/lib/contrast';
import {
  applyBranding,
  BRAND_DEFAULTS,
  brandingTokens,
  primaryTextCheck,
  routeLineCheck,
} from '../src/theme/apply-branding';

const tokenOf = (tokens: Record<string, string>, name: string) => {
  const value = tokens[name];
  if (!value) throw new Error(`${name} tidak ada`);
  return value;
};

describe('BRAND_DEFAULTS', () => {
  it('sama dengan nilai di tokens.css', () => {
    const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
    const value = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`))?.[1];
    expect(BRAND_DEFAULTS).toEqual({
      signal: value('signal'),
      signalSoft: value('signal-soft'),
      route: value('route'),
      ink: value('ink'),
      white: value('on-strong'),
      canvas: value('canvas'),
    });
  });
});

describe('brandingTokens', () => {
  it('tanpa branding tidak menimpa token apa pun', () => {
    expect(brandingTokens({ primaryColor: null, routeColor: null })).toEqual({});
  });

  it('kuning muda sebagai warna utama tetap memakai teks --ink yang terbaca', () => {
    const tokens = brandingTokens({ primaryColor: '#fff6b3', routeColor: null });
    expect(tokens['--signal']).toBe('#fff6b3');
    expect(tokens['--on-signal']).toBe(BRAND_DEFAULTS.ink);
    expect(contrastRatio(tokenOf(tokens, '--on-signal'), '#fff6b3')).toBeGreaterThanOrEqual(
      WCAG_AA_TEXT,
    );
  });

  it('warna utama gelap memakai teks putih', () => {
    const tokens = brandingTokens({ primaryColor: '#0b1f4d', routeColor: null });
    expect(tokens['--on-signal']).toBe(BRAND_DEFAULTS.white);
  });

  it('abu-abu tengah: --ink tidak lolos AA, maka putih', () => {
    const tokens = brandingTokens({ primaryColor: '#767676', routeColor: null });
    expect(contrastRatio(BRAND_DEFAULTS.ink, '#767676')).toBeLessThan(WCAG_AA_TEXT);
    expect(tokens['--on-signal']).toBe(BRAND_DEFAULTS.white);
  });

  it.each(['#000000', '#0b1f4d', '#ffc20e', '#ffffff', '#e4002b', '#767676'])(
    'latar seleksi dari warna utama %s tetap terbaca dengan --ink',
    (primary) => {
      const soft = tokenOf(
        brandingTokens({ primaryColor: primary, routeColor: null }),
        '--signal-soft',
      );
      expect(contrastRatio(BRAND_DEFAULTS.ink, soft)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    },
  );

  it('warna bawaan menghasilkan --signal-soft yang sama dengan token', () => {
    const tokens = brandingTokens({ primaryColor: BRAND_DEFAULTS.signal, routeColor: null });
    expect(tokens['--signal-soft']).toBe(BRAND_DEFAULTS.signalSoft);
  });

  it('warna rute terang memakai teks --ink, gelap memakai putih', () => {
    expect(brandingTokens({ primaryColor: null, routeColor: '#ffd84d' })).toEqual({
      '--route': '#ffd84d',
      '--on-route': BRAND_DEFAULTS.ink,
    });
    expect(brandingTokens({ primaryColor: null, routeColor: '#e4002b' })['--on-route']).toBe(
      BRAND_DEFAULTS.white,
    );
  });
});

describe('pemeriksaan untuk formulir Branding', () => {
  it('melaporkan warna teks dan kontras di atas warna utama', () => {
    expect(primaryTextCheck('#fff6b3')).toMatchObject({ text: 'ink', passes: true });
    expect(primaryTextCheck('#0b1f4d')).toMatchObject({ text: 'white', passes: true });
    // Tidak ada yang lolos: tetap dipilih yang paling kontras dan dilaporkan.
    const grey = primaryTextCheck('#7a7a7a');
    expect(grey.passes).toBe(false);
    expect(grey.ratio).toBeLessThan(WCAG_AA_TEXT);
  });

  it('garis rute yang terlalu pucat di atas latar peta diberi peringatan', () => {
    expect(routeLineCheck(BRAND_DEFAULTS.route).passes).toBe(true);
    expect(routeLineCheck('#fff6b3').passes).toBe(false);
  });
});

describe('applyBranding', () => {
  it('memasang token di elemen lalu melepasnya lagi', () => {
    const props = new Map<string, string>();
    const element = {
      style: {
        setProperty: (name: string, value: string) => void props.set(name, value),
        removeProperty: (name: string) => {
          const value = props.get(name) ?? '';
          props.delete(name);
          return value;
        },
      },
    };
    const restore = applyBranding(element, { primaryColor: '#0b1f4d', routeColor: '#e4002b' });
    expect(props.get('--signal')).toBe('#0b1f4d');
    expect(props.get('--route')).toBe('#e4002b');
    restore();
    expect(props.size).toBe(0);
  });
});
