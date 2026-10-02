import { describe, expect, it } from 'vitest';
import {
  brandDisplayName,
  brandingJson,
  checkBranding,
  EMPTY_BRANDING,
  MAX_DISPLAY_NAME_LENGTH,
  parseBranding,
} from '../src';

describe('parseBranding', () => {
  it('membaca jsonb branding; warna dijadikan huruf kecil dan nama dirapikan', () => {
    expect(
      parseBranding({
        displayName: '  RS   Sehat  Sentosa ',
        primaryColor: '#0B1F4D',
        routeColor: '#e4002b',
      }),
    ).toEqual({
      displayName: 'RS Sehat Sentosa',
      primaryColor: '#0b1f4d',
      routeColor: '#e4002b',
    });
  });

  it('entri rusak dibuang per kunci, bukan seluruh branding', () => {
    expect(
      parseBranding({ displayName: 42, primaryColor: 'kuning', routeColor: '#1463ff' }),
    ).toEqual({ displayName: null, primaryColor: null, routeColor: '#1463ff' });
    expect(parseBranding({ displayName: '   ' })).toEqual(EMPTY_BRANDING);
    expect(parseBranding(null)).toEqual(EMPTY_BRANDING);
    expect(parseBranding([])).toEqual(EMPTY_BRANDING);
  });

  it('nama yang terlalu panjang dipotong agar header tetap rapi', () => {
    const long = 'Ä'.repeat(MAX_DISPLAY_NAME_LENGTH + 10);
    expect(parseBranding({ displayName: long }).displayName).toBe(
      'Ä'.repeat(MAX_DISPLAY_NAME_LENGTH),
    );
  });
});

describe('checkBranding', () => {
  it('isian kosong berarti memakai bawaan', () => {
    expect(checkBranding({ displayName: '', primaryColor: ' ', routeColor: '' })).toEqual({
      ok: true,
      value: EMPTY_BRANDING,
    });
  });

  it('isian sah dirapikan', () => {
    expect(
      checkBranding({
        displayName: ' Kampus  Utara ',
        primaryColor: '#FFF6B3',
        routeColor: '#0B1F4D',
      }),
    ).toEqual({
      ok: true,
      value: { displayName: 'Kampus Utara', primaryColor: '#fff6b3', routeColor: '#0b1f4d' },
    });
  });

  it('melaporkan setiap isian yang salah', () => {
    expect(
      checkBranding({
        displayName: 'x'.repeat(MAX_DISPLAY_NAME_LENGTH + 1),
        primaryColor: 'merah',
        routeColor: '#12345',
      }),
    ).toEqual({
      ok: false,
      problems: {
        displayName: 'too_long',
        primaryColor: 'invalid_color',
        routeColor: 'invalid_color',
      },
    });
  });
});

describe('brandingJson dan brandDisplayName', () => {
  it('hanya kunci yang diisi yang disimpan', () => {
    expect(brandingJson(EMPTY_BRANDING)).toEqual({});
    expect(
      brandingJson({ displayName: 'Kampus', primaryColor: null, routeColor: '#0b1f4d' }),
    ).toEqual({ displayName: 'Kampus', routeColor: '#0b1f4d' });
  });

  it('nama tampilan jatuh ke nama venue bila kosong', () => {
    expect(brandDisplayName('RS Kenari', null)).toBe('RS Kenari');
    expect(brandDisplayName('RS Kenari', undefined)).toBe('RS Kenari');
    expect(brandDisplayName('RS Kenari', EMPTY_BRANDING)).toBe('RS Kenari');
    expect(brandDisplayName('RS Kenari', { ...EMPTY_BRANDING, displayName: 'Kenari' })).toBe(
      'Kenari',
    );
  });
});
