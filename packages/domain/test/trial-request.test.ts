import { describe, expect, it } from 'vitest';
import {
  checkHostedTrialRequest,
  checkTrialRequest,
  createRateLimiter,
} from '../src/trial-request';

const valid = {
  name: 'Rina Wijaya',
  institution: 'Mal Contoh Raya',
  title: 'Manajer Operasional',
  email: 'Rina@MalContoh.co.id',
  phone: '+62 812-3456-7890',
  buildingType: 'mall',
  buildingSize: '20k-50k',
  durationDays: 14,
  installId: '',
  consent: true,
  language: 'en',
};

describe('checkTrialRequest (T-505)', () => {
  it('isian lengkap lolos; email dirapikan, bahasa konfirmasi terbawa', () => {
    const result = checkTrialRequest(valid);
    expect(result).toEqual({
      ok: true,
      value: { ...valid, email: 'rina@malcontoh.co.id', installId: '', language: 'en' },
    });
    const withId = checkTrialRequest({
      ...valid,
      durationDays: '30',
      installId: '00000000-0000-4000-8000-0000000DE701',
    });
    expect(withId.ok && withId.value).toMatchObject({
      durationDays: 30,
      installId: '00000000-0000-4000-8000-0000000de701',
    });
  });

  it('isian wajib kosong, email salah, durasi di luar 14–30, persetujuan belum dicentang', () => {
    const result = checkTrialRequest({
      ...valid,
      name: '  ',
      email: 'bukan-email',
      durationDays: 31,
      consent: false,
      buildingType: '',
      buildingSize: 'raksasa',
      phone: 'abc',
      installId: 'bukan-id',
    });
    expect(result).toEqual({
      ok: false,
      problems: {
        name: 'required',
        email: 'invalid',
        phone: 'invalid',
        buildingType: 'required',
        buildingSize: 'invalid',
        durationDays: 'out_of_range',
        installId: 'invalid',
        consent: 'required',
      },
    });
    expect(checkTrialRequest({ ...valid, durationDays: 13 })).toMatchObject({
      problems: { durationDays: 'out_of_range' },
    });
    expect(checkTrialRequest({ ...valid, durationDays: 14.5 })).toMatchObject({
      problems: { durationDays: 'invalid' },
    });
    expect(checkTrialRequest({ ...valid, title: 'x'.repeat(101) })).toMatchObject({
      problems: { title: 'too_long' },
    });
  });

  it('baris baru penyisip header email ditolak; HTML diterima sebagai teks biasa', () => {
    expect(
      checkTrialRequest({ ...valid, institution: 'Mal\r\nBcc: korban@contoh.id' }),
    ).toMatchObject({ ok: false, problems: { institution: 'invalid' } });
    expect(checkTrialRequest({ ...valid, email: 'a@b.id\nBcc: c@d.id' })).toMatchObject({
      ok: false,
    });
    const html = checkTrialRequest({ ...valid, institution: '<b>Mal</b>' });
    expect(html.ok && html.value.institution).toBe('<b>Mal</b>');
  });
});

describe('createRateLimiter', () => {
  it('lebih dari 5 per menit per alamat ditolak; alamat lain dan menit berikutnya boleh', () => {
    const allow = createRateLimiter(5, 60_000);
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(allow('1.2.3.4', t + i)).toBe(true);
    expect(allow('1.2.3.4', t + 10)).toBe(false);
    expect(allow('5.6.7.8', t + 10)).toBe(true);
    expect(allow('1.2.3.4', t + 60_010)).toBe(true);
  });
});

describe('checkHostedTrialRequest (T-614)', () => {
  it('tanpa lama trial dan ID instalasi; isian lain diperiksa sama', () => {
    const { durationDays: _days, installId: _id, ...hosted } = valid;
    expect(checkHostedTrialRequest(hosted)).toEqual({
      ok: true,
      value: { ...hosted, email: 'rina@malcontoh.co.id' },
    });
  });

  it('lama trial dan ID instalasi dari form lama diabaikan, bukan ditolak', () => {
    const result = checkHostedTrialRequest({ ...valid, durationDays: 99, installId: 'x' });
    expect(result.ok).toBe(true);
    expect(result.ok && 'durationDays' in result.value).toBe(false);
  });

  it('isian tidak sah tetap ditolak', () => {
    expect(checkHostedTrialRequest({ ...valid, email: 'bukan-email', consent: false })).toEqual({
      ok: false,
      problems: { email: 'invalid', consent: 'required' },
    });
  });
});
