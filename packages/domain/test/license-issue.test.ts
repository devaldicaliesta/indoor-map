import { describe, expect, it } from 'vitest';
import {
  importLicensePublicKey,
  licenseSigningBytes,
  TRIAL_QUOTA,
  toBase64,
  verifyLicense,
} from '../src/license';
import {
  type LicenseIssueRequest,
  licenseIssueDefaults,
  licensePayloadFor,
  newLicenseId,
  PAID_DEFAULT_QUOTA,
  readLicenseIssueRequest,
  trialIssueDefaults,
} from '../src/license-issue';

const INSTALLATION = '0b9f3c2e-1d4a-4c6b-8e7f-123456789abc';
const INSTANCE = '7f3a9c10-0000-4000-8000-000000000001';

const input = (overrides: Record<string, unknown> = {}) => ({
  installationId: INSTALLATION,
  plan: 'professional',
  validFrom: '2026-11-15',
  validUntil: '2027-11-15',
  quota: { ...PAID_DEFAULT_QUOTA, locations: 500 },
  features: ['info_point', '3d'],
  ...overrides,
});

const request = (overrides: Record<string, unknown> = {}): LicenseIssueRequest => {
  const check = readLicenseIssueRequest(input(overrides));
  if (!check.ok) throw new Error(check.message);
  return check.request;
};

describe('readLicenseIssueRequest', () => {
  it('menerima permintaan sah dan mengurutkan fitur seperti daftar fitur berbayar', () => {
    expect(request()).toEqual({ ...input(), features: ['3d', 'info_point'] });
  });

  it('menolak kunci yang tidak dikenal', () => {
    expect(readLicenseIssueRequest({ ...input(), instanceId: INSTANCE }).ok).toBe(false);
  });

  it.each([
    ['installationId', 'bukan-uuid'],
    ['plan', '   '],
    ['validFrom', '2026-02-30'],
    ['validUntil', '2026-11-15'],
    ['features', ['3d', 'teleport']],
    ['quota', { venues: 1, buildings: 1, floors: 10 }],
    ['quota', { ...PAID_DEFAULT_QUOTA, venues: -1 }],
    ['quota', { ...PAID_DEFAULT_QUOTA, rooms: 3 }],
    ['quota', { ...PAID_DEFAULT_QUOTA, users: 1.5 }],
  ])('menolak %s = %j', (key, value) => {
    expect(readLicenseIssueRequest(input({ [key]: value })).ok).toBe(false);
  });

  it('paket trial wajib 14–30 hari', () => {
    expect(readLicenseIssueRequest(input({ plan: 'trial', validUntil: '2026-11-20' }))).toEqual({
      ok: false,
      message: 'Lama trial harus 14–30 hari.',
    });
    expect(
      readLicenseIssueRequest(
        input({ plan: 'trial', validUntil: '2026-12-15', quota: TRIAL_QUOTA }),
      ).ok,
    ).toBe(true);
  });

  it('kuota pilihan yang kosong dianggap tidak dibatasi', () => {
    expect(request({ quota: { ...PAID_DEFAULT_QUOTA, users: null } }).quota).toEqual(
      PAID_DEFAULT_QUOTA,
    );
  });
});

describe('licensePayloadFor', () => {
  const context = {
    licenseId: 'LIC-ABCDEF12',
    client: 'RS Contoh Sehat',
    instanceId: INSTANCE,
    issuedAt: new Date('2026-11-15T03:04:05.678Z'),
  };

  it('menghasilkan payload yang lolos verifikasi aktivasi setelah ditandatangani', async () => {
    const payload = licensePayloadFor(request(), context);
    expect(payload).not.toBeNull();
    if (!payload) return;
    expect(payload.validFrom).toBe('2026-11-15T00:00:00Z');
    expect(payload.issuedAt).toBe('2026-11-15T03:04:05Z');
    const keys = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
      'sign',
      'verify',
    ])) as CryptoKeyPair;
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      keys.privateKey,
      licenseSigningBytes(payload),
    );
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
    const file = { ...payload, signature: toBase64(new Uint8Array(signature)) };
    const result = await verifyLicense(
      JSON.parse(JSON.stringify(file)),
      await importLicensePublicKey(toBase64(raw)),
      INSTANCE,
      new Date('2026-12-01T00:00:00Z'),
    );
    expect(result).toEqual({ valid: true, license: payload });
  });

  it('menolak nama klien kosong', () => {
    expect(licensePayloadFor(request(), { ...context, client: ' ' })).toBeNull();
  });
});

describe('newLicenseId', () => {
  it('memakai 8 karakter heksadesimal pertama dalam huruf besar', () => {
    expect(newLicenseId('ab12cd34-ef56-4000-8000-000000000000')).toBe('LIC-AB12CD34');
  });
});

describe('licenseIssueDefaults', () => {
  const current = {
    licenseId: 'LIC-1',
    client: 'RS',
    plan: 'professional',
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2027-01-01T00:00:00Z',
    quota: { venues: 2, buildings: 3, floors: 12, infoPoints: 4, users: 9 },
    features: ['3d'],
    instanceId: INSTANCE,
    issuedAt: '2026-01-01T00:00:00Z',
  };

  it('instalasi tanpa lisensi memakai batas berbayar bawaan selama setahun', () => {
    expect(licenseIssueDefaults(null, '2026-11-15')).toEqual({
      plan: '',
      validFrom: '2026-11-15',
      validUntil: '2027-11-15',
      quota: PAID_DEFAULT_QUOTA,
      features: [],
    });
  });

  it('perpanjangan menyambung setahun dari akhir lisensi yang masih berlaku', () => {
    expect(licenseIssueDefaults(current, '2026-11-15')).toMatchObject({
      plan: 'professional',
      validFrom: '2026-11-15',
      validUntil: '2028-01-01',
      quota: current.quota,
      features: ['3d'],
    });
  });

  it('lisensi yang sudah berakhir diperpanjang setahun dari hari ini', () => {
    expect(licenseIssueDefaults(current, '2027-03-01').validUntil).toBe('2028-03-01');
  });

  it('lisensi trial diterbitkan ulang sebagai trial 30 hari yang lolos validasi', () => {
    const defaults = licenseIssueDefaults({ ...current, plan: 'trial' }, '2026-11-15');
    expect(defaults).toEqual(trialIssueDefaults('2026-11-15'));
    expect(readLicenseIssueRequest({ installationId: INSTALLATION, ...defaults }).ok).toBe(true);
  });
});
