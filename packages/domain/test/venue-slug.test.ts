import { describe, expect, it } from 'vitest';
import { parseVenueRef, SlugPointerSchema, VenueSlugSchema } from '../src';

const VENUE = '1b000000-0000-4000-8000-0000000000bb';

describe('VenueSlugSchema', () => {
  it.each(['demo', 'rs-harapan', 'kampus-2', 'abc'])('menerima %s', (slug) => {
    expect(VenueSlugSchema.safeParse(slug).success).toBe(true);
  });

  it.each([
    ['huruf besar', 'Demo'],
    ['spasi', 'rs harapan'],
    ['tanda hubung di tepi', '-demo'],
    ['tanda hubung ganda', 'rs--harapan'],
    ['terlalu pendek', 'ab'],
    ['terlalu panjang', 'a'.repeat(61)],
    ['berbentuk UUID', VENUE],
    ['garis miring', 'demo/lain'],
  ])('menolak %s', (_, slug) => {
    expect(VenueSlugSchema.safeParse(slug).success).toBe(false);
  });
});

describe('parseVenueRef', () => {
  it('UUID dibaca sebagai id venue', () => {
    expect(parseVenueRef(VENUE)).toEqual({ kind: 'id', venueId: VENUE });
  });

  it('selain UUID dibaca sebagai slug', () => {
    expect(parseVenueRef('demo')).toEqual({ kind: 'slug', slug: 'demo' });
  });

  it('bukan id dan bukan slug ditolak', () => {
    expect(parseVenueRef('Bukan Slug')).toBeNull();
    expect(parseVenueRef(undefined)).toBeNull();
  });
});

describe('SlugPointerSchema', () => {
  it('penunjuk berisi id venue yang sah', () => {
    expect(SlugPointerSchema.parse({ venueId: VENUE })).toEqual({ venueId: VENUE });
    expect(SlugPointerSchema.safeParse({ venueId: 'demo' }).success).toBe(false);
  });
});
