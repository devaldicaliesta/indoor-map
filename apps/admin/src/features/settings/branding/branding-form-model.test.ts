import { BRAND_DEFAULTS } from '@indoor/ui';
import { describe, expect, it } from 'vitest';
import {
  colorNotes,
  livePreview,
  toBrandingFormValues,
  validateBranding,
} from './branding-form-model';

const empty = { displayName: '', primaryColor: '', routeColor: '' };

describe('formulir branding', () => {
  it('branding tersimpan tampil di formulir; yang belum diatur kosong', () => {
    expect(
      toBrandingFormValues({ displayName: 'RS Kenari', primaryColor: '#0b1f4d', routeColor: null }),
    ).toEqual({ displayName: 'RS Kenari', primaryColor: '#0b1f4d', routeColor: '' });
  });

  it('isian sah menjadi branding; kosong berarti bawaan', () => {
    expect(validateBranding({ ...empty, displayName: ' Kampus  Utara ' })).toEqual({
      ok: true,
      branding: { displayName: 'Kampus Utara', primaryColor: null, routeColor: null },
    });
  });

  it('isian salah diberi pesan per kolom', () => {
    const result = validateBranding({
      displayName: 'x'.repeat(61),
      primaryColor: 'kuning',
      routeColor: '#1463ff',
    });
    expect(result).toEqual({
      ok: false,
      errors: {
        displayName: 'Nama tampilan maksimal 60 karakter.',
        primaryColor: 'Warna harus berformat #rrggbb, misalnya #0b1f4d.',
      },
    });
  });

  it('pratinjau memakai nama venue dan warna bawaan untuk isian kosong atau belum sah', () => {
    expect(
      livePreview({ ...empty, primaryColor: '#0B1F4D', routeColor: '#12' }, 'RS Kenari'),
    ).toEqual({ name: 'RS Kenari', primaryColor: '#0b1f4d', routeColor: null });
    expect(livePreview({ ...empty, displayName: 'Kenari' }, 'RS Kenari').name).toBe('Kenari');
  });
});

describe('catatan kontras', () => {
  it('menyebut warna teks yang dipakai di atas warna utama', () => {
    expect(colorNotes({ primaryColor: '#fff6b3', routeColor: null }).primary).toEqual({
      tone: 'ok',
      text: 'Teks di atas warna utama memakai warna gelap (kontras 16,8:1).',
    });
    expect(colorNotes({ primaryColor: '#0b1f4d', routeColor: null }).primary?.text).toMatch(
      /^Teks di atas warna utama memakai putih \(kontras /,
    );
  });

  it('memperingatkan bila tidak ada warna teks yang lolos AA atau garis rute terlalu pucat', () => {
    expect(colorNotes({ primaryColor: '#7a7a7a', routeColor: null }).primary?.tone).toBe('warn');
    expect(colorNotes({ primaryColor: null, routeColor: '#fff6b3' }).route).toEqual({
      tone: 'warn',
      text: 'Garis rute sulit terlihat di atas latar peta (kontras 1,0:1, disarankan minimal 3:1).',
    });
    expect(colorNotes({ primaryColor: null, routeColor: BRAND_DEFAULTS.route })).toEqual({
      primary: null,
      route: null,
    });
  });
});
