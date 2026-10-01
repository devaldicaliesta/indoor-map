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
    });
  });
});
