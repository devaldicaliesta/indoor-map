import { describe, expect, it } from 'vitest';
import { readLicenseIssueRequest } from '../src/license-issue';
import {
  checkActivationRequest,
  isLicenseKeyStatus,
  LICENSE_KEY_ALPHABET,
  licenseKeyIssueRequest,
  maskedLicenseKey,
  normalizeLicenseKey,
  readLicenseKeyRequest,
} from '../src/license-key';

const KEY = 'ABCDE-FGHJK-MNPQR-STVWX-YZ012';
const CLIENT = '6f1b8a2e-3c4d-4e5f-8a9b-0c1d2e3f4a5b';
const INSTANCE = '11111111-2222-4333-8444-555555555555';
const QUOTA = { venues: 1, buildings: 2, floors: 10, infoPoints: 0 };

describe('normalizeLicenseKey', () => {
  it('menerima huruf kecil, spasi, dan tanpa tanda hubung', () => {
    expect(normalizeLicenseKey(' abcde fghjk mnpqr stvwx yz012 ')).toBe(KEY);
    expect(normalizeLicenseKey('ABCDEFGHJKMNPQRSTVWXYZ012')).toBe(KEY);
  });

  it('huruf yang mirip angka dibaca sebagai angka', () => {
    expect(normalizeLicenseKey('OOOOO-IIIII-LLLLL-00000-11111')).toBe(
      '00000-11111-11111-00000-11111',
    );
  });

  it('menolak panjang salah, huruf U, dan bukan teks', () => {
    expect(normalizeLicenseKey('ABCDE-FGHJK')).toBeNull();
    expect(normalizeLicenseKey('UBCDE-FGHJK-MNPQR-STVWX-YZ012')).toBeNull();
    expect(normalizeLicenseKey(12345)).toBeNull();
    expect(normalizeLicenseKey('A'.repeat(200))).toBeNull();
  });

  it('alfabet 32 karakter tanpa huruf yang membingungkan', () => {
    expect(LICENSE_KEY_ALPHABET).toHaveLength(32);
    expect(LICENSE_KEY_ALPHABET).not.toMatch(/[ILOU]/);
  });
});

describe('checkActivationRequest', () => {
  it('menormalkan kunci dan ID instalasi', () => {
    expect(
      checkActivationRequest({ licenseKey: KEY.toLowerCase(), instanceId: INSTANCE.toUpperCase() }),
    ).toEqual({ ok: true, request: { licenseKey: KEY, instanceId: INSTANCE } });
  });

  it('menolak kunci atau ID instalasi yang tidak valid', () => {
    expect(checkActivationRequest({ licenseKey: 'salah', instanceId: INSTANCE }).ok).toBe(false);
    expect(checkActivationRequest({ licenseKey: KEY, instanceId: 'bukan-uuid' }).ok).toBe(false);
    expect(checkActivationRequest(null).ok).toBe(false);
  });
});

describe('readLicenseKeyRequest', () => {
  const valid = {
    clientId: CLIENT,
    plan: 'Profesional',
    durationDays: 365,
    quota: QUOTA,
    features: ['3d'],
  };

  it('menerima permintaan yang sah', () => {
    expect(readLicenseKeyRequest(valid)).toEqual({ ok: true, request: valid });
  });

  it('menolak paket trial, masa berlaku di luar batas, dan isian asing', () => {
    expect(readLicenseKeyRequest({ ...valid, plan: 'trial' }).ok).toBe(false);
    expect(readLicenseKeyRequest({ ...valid, plan: ' ' }).ok).toBe(false);
    expect(readLicenseKeyRequest({ ...valid, durationDays: 0 }).ok).toBe(false);
    expect(readLicenseKeyRequest({ ...valid, durationDays: 3651 }).ok).toBe(false);
    expect(readLicenseKeyRequest({ ...valid, durationDays: 1.5 }).ok).toBe(false);
    expect(readLicenseKeyRequest({ ...valid, features: ['terbang'] }).ok).toBe(false);
    expect(readLicenseKeyRequest({ ...valid, quota: { venues: 1 } }).ok).toBe(false);
    expect(readLicenseKeyRequest({ ...valid, extra: true }).ok).toBe(false);
    expect(readLicenseKeyRequest({ ...valid, clientId: 'x' }).ok).toBe(false);
  });
});

describe('licenseKeyIssueRequest', () => {
  it('masa berlaku dihitung dari hari aktivasi dan lolos validasi penerbitan', () => {
    const request = licenseKeyIssueRequest(
      { plan: 'Profesional', durationDays: 365, quota: QUOTA, features: ['3d'] },
      INSTANCE,
      new Date('2026-11-15T17:45:00Z'),
    );
    expect(request.validFrom).toBe('2026-11-15');
    expect(request.validUntil).toBe('2027-11-15');
    expect(readLicenseIssueRequest(request).ok).toBe(true);
  });
});

describe('status dan tampilan kunci', () => {
  it('mengenali status yang tersimpan', () => {
    expect(isLicenseKeyStatus('available')).toBe(true);
    expect(isLicenseKeyStatus('expired')).toBe(false);
  });

  it('hanya lima karakter terakhir yang ditampilkan', () => {
    expect(maskedLicenseKey('YZ012')).toBe('XXXXX-XXXXX-XXXXX-XXXXX-YZ012');
  });
});
