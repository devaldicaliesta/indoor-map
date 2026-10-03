import { describe, expect, it } from 'vitest';
import { type SystemFormValues, toPatch, validate } from './system-form-model';

const base: SystemFormValues = {
  publicVisitorUrl: 'https://peta.rs-harapan.id',
  defaultTimezone: 'Asia/Jakarta',
  defaultLanguage: 'id',
  smtpHost: 'smtp.rs-harapan.id',
  smtpPort: '587',
  smtpUsername: 'noreply',
  smtpPassword: '',
  smtpFrom: 'Peta RS Harapan <noreply@rs-harapan.id>',
  basemapTileUrl: '',
  basemapAttribution: '',
};

describe('validate', () => {
  it('nilai lengkap dan benar tidak punya error', () => {
    expect(validate(base)).toEqual({});
  });

  it('pesan menyebut cara memperbaiki', () => {
    const errors = validate({
      ...base,
      publicVisitorUrl: 'https://peta.id/',
      smtpPort: '99999',
      smtpFrom: 'noreply',
    });
    expect(errors.publicVisitorUrl).toContain('garis miring');
    expect(errors.smtpPort).toContain('587');
    expect(errors.smtpFrom).toContain('Contoh');
  });

  it('SMTP boleh dikosongkan', () => {
    expect(
      validate({ ...base, smtpHost: '', smtpPort: '', smtpFrom: '', publicVisitorUrl: '' }),
    ).toEqual({});
  });
});

describe('toPatch', () => {
  it('isian kosong menjadi null dan port menjadi angka; password tidak ikut', () => {
    expect(toPatch({ ...base, smtpUsername: '  ', smtpPassword: 'rahasia' })).toEqual({
      publicVisitorUrl: 'https://peta.rs-harapan.id',
      defaultTimezone: 'Asia/Jakarta',
      defaultLanguage: 'id',
      smtpHost: 'smtp.rs-harapan.id',
      smtpPort: 587,
      smtpUsername: null,
      smtpFrom: 'Peta RS Harapan <noreply@rs-harapan.id>',
      basemapTileUrl: null,
      basemapAttribution: null,
    });
  });
});

describe('peta dasar', () => {
  it('kosong = tanpa peta dasar; URL tile wajib {z}/{x}/{y} dan atribusi', () => {
    expect(validate(base)).toEqual({});
    const errors = validate({ ...base, basemapTileUrl: 'https://tile.contoh.id/{z}.png' });
    expect(errors.basemapTileUrl).toContain('{z}, {x}, dan {y}');
    expect(errors.basemapAttribution).toContain('atribusi');
    expect(
      validate({ ...base, basemapAttribution: '<a href="x">OSM</a>' }).basemapAttribution,
    ).toContain('tanpa < atau >');
    expect(
      validate({
        ...base,
        basemapTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        basemapAttribution: '© OpenStreetMap contributors',
      }),
    ).toEqual({});
  });
});
