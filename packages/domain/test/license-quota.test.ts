import { describe, expect, it } from 'vitest';
import {
  daysRemaining,
  importTooLarge,
  isQuotaFull,
  licenseNotice,
  quotaBlockMessage,
  uploadTooLarge,
} from '../src/license-quota';

describe('isQuotaFull', () => {
  it('penuh saat pemakaian mencapai kuota', () => {
    expect(isQuotaFull({ kind: 'infoPoints', used: 10, quota: 10 })).toBe(true);
    expect(isQuotaFull({ kind: 'infoPoints', used: 9, quota: 10 })).toBe(false);
    expect(isQuotaFull({ kind: 'infoPoints', used: 12, quota: 10 })).toBe(true);
  });

  it('tanpa lisensi atau data belum dimuat tidak dianggap penuh', () => {
    expect(isQuotaFull({ kind: 'venues', used: 3, quota: null })).toBe(false);
    expect(isQuotaFull(undefined)).toBe(false);
  });
});

describe('daysRemaining', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  it('membulatkan ke atas sisa hari', () => {
    expect(daysRemaining('2026-10-04T00:00:00Z', now)).toBe(1);
    expect(daysRemaining('2026-11-02T12:00:00Z', now)).toBe(30);
  });
  it('nol setelah berakhir', () => {
    expect(daysRemaining('2026-10-01T00:00:00Z', now)).toBe(0);
  });
});

describe('licenseNotice', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  it('pengingat mulai H-30', () => {
    expect(licenseNotice('2026-12-01T00:00:00Z', now)).toBeNull();
    expect(licenseNotice('2026-11-02T12:00:00Z', now)).toEqual({ kind: 'reminder', days: 30 });
    expect(licenseNotice('2026-10-10T12:00:00Z', now)).toEqual({ kind: 'reminder', days: 7 });
    expect(licenseNotice('2026-10-04T12:00:00Z', now)).toEqual({ kind: 'reminder', days: 1 });
  });
  it('masa tenggang 14 hari setelah berakhir, lalu tidak ada banner', () => {
    expect(licenseNotice('2026-10-02T12:00:00Z', now)).toEqual({
      kind: 'grace',
      graceEndsAt: '2026-10-16T12:00:00.000Z',
    });
    expect(licenseNotice('2026-09-18T12:00:00Z', now)).toBeNull();
  });
});

describe('batas trial (T-504)', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  const limits = { maxUploadMb: 20, importRows: 500 };

  it('trial selalu menampilkan sisa hari, lalu masa tenggang seperti lisensi biasa', () => {
    expect(licenseNotice('2026-10-17T12:00:00Z', now, { trial: true })).toEqual({
      kind: 'trial',
      days: 14,
    });
    expect(licenseNotice('2026-10-02T12:00:00Z', now, { trial: true })).toEqual({
      kind: 'grace',
      graceEndsAt: '2026-10-16T12:00:00.000Z',
    });
  });

  it('pesan kuota trial dan paket', () => {
    const usage = { kind: 'locations', used: 300, quota: 300 } as const;
    expect(quotaBlockMessage(usage, true)).toBe('Batas trial tercapai (Lokasi 300/300).');
    expect(quotaBlockMessage(usage, false)).toBe('Kuota paket tercapai (Lokasi 300/300).');
  });

  it('berkas 21 MB dan impor 501 baris ditolak; tanpa batas selalu boleh', () => {
    expect(uploadTooLarge(20 * 1024 * 1024, limits, true)).toBeNull();
    expect(uploadTooLarge(21 * 1024 * 1024, limits, true)).toBe(
      'Batas trial tercapai: berkas 21,0 MB, paling besar 20 MB.',
    );
    expect(importTooLarge(500, limits, true)).toBeNull();
    expect(importTooLarge(501, limits, true)).toMatch(/501 baris, paling banyak 500/);
    const free = { maxUploadMb: null, importRows: null };
    expect(uploadTooLarge(10 ** 10, free, false)).toBeNull();
    expect(importTooLarge(10 ** 6, free, false)).toBeNull();
  });
});
