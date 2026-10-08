import { beforeAll, describe, expect, it } from 'vitest';
import {
  canonicalize,
  importLicensePublicKey,
  isTrialLicense,
  type LicenseFile,
  type LicensePayload,
  licenseSigningBytes,
  readLicensePayload,
  TRIAL_FEATURES,
  TRIAL_PLAN,
  TRIAL_QUOTA,
  toBase64,
  trialDaysProblem,
  verifyLicense,
} from '../src/license';
import { LICENSE_PUBLIC_KEY } from '../src/license.publicKey';

const INSTANCE = 'inst-7f3a9c';
const NOW = new Date('2026-10-03T00:00:00Z');

const payload = (): LicensePayload => ({
  licenseId: 'LIC-2026-0001',
  client: 'RS Contoh Sehat',
  plan: 'professional',
  validFrom: '2026-01-01T00:00:00Z',
  validUntil: '2027-01-01T00:00:00Z',
  quota: { venues: 2, buildings: 5, floors: 30, infoPoints: 10 },
  features: ['3d', 'info_point'],
  instanceId: INSTANCE,
  issuedAt: '2025-12-20T08:00:00Z',
});

let keys: CryptoKeyPair;
let publicKey: CryptoKey;

async function sign(p: LicensePayload, privateKey = keys.privateKey): Promise<LicenseFile> {
  const signature = await crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    licenseSigningBytes(p),
  );
  return { ...p, signature: toBase64(new Uint8Array(signature)) };
}

beforeAll(async () => {
  keys = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
  publicKey = await importLicensePublicKey(toBase64(raw));
});

describe('canonicalize', () => {
  it('mengurutkan kunci secara rekursif tanpa spasi', () => {
    expect(canonicalize({ b: 1, a: { d: [2, { z: true, y: null }], c: 'x' } })).toBe(
      '{"a":{"c":"x","d":[2,{"y":null,"z":true}]},"b":1}',
    );
  });

  it('urutan kunci tidak mengubah hasil', () => {
    const p = payload();
    const reordered = Object.fromEntries(Object.entries(p).reverse()) as unknown as LicensePayload;
    expect(canonicalize(reordered as never)).toBe(canonicalize(p as never));
  });
});

describe('verifyLicense', () => {
  it('menerima lisensi bertanda tangan sah untuk instalasi ini', async () => {
    const file = await sign(payload());
    const result = await verifyLicense(file, publicKey, INSTANCE, NOW);
    expect(result).toEqual({ valid: true, license: payload() });
  });

  it('tetap sah setelah melewati JSON (spasi dan urutan kunci berbeda)', async () => {
    const file = await sign(payload());
    const text = JSON.stringify(Object.fromEntries(Object.entries(file).reverse()), null, 2);
    expect((await verifyLicense(JSON.parse(text), publicKey, INSTANCE, NOW)).valid).toBe(true);
  });

  it('menolak berkas yang diubah satu karakter di bagian mana pun', async () => {
    const file = await sign(payload());
    const text = JSON.stringify(file);
    const tampered = [
      text.replace('RS Contoh Sehat', 'RS Contoh Sehau'),
      text.replace('"venues":2', '"venues":3'),
      text.replace('2027-01-01', '2028-01-01'),
      text.replace('"3d"', '"4d"'),
      text.replace('professional', 'professionaL'),
    ];
    for (const variant of tampered) {
      expect(variant).not.toBe(text);
      const result = await verifyLicense(JSON.parse(variant), publicKey, INSTANCE, NOW);
      expect(result).toEqual({ valid: false, reason: 'bad_signature' });
    }
    // Satu karakter di tanda tangannya sendiri.
    const sig = file.signature;
    const flipped = `${sig[0] === 'A' ? 'B' : 'A'}${sig.slice(1)}`;
    expect(
      (await verifyLicense({ ...file, signature: flipped }, publicKey, INSTANCE, NOW)).valid,
    ).toBe(false);
  });

  it('menolak lisensi untuk instance lain', async () => {
    const file = await sign(payload());
    expect(await verifyLicense(file, publicKey, 'inst-lain', NOW)).toEqual({
      valid: false,
      reason: 'wrong_instance',
    });
  });

  it('menolak lisensi yang kedaluwarsa atau belum berlaku', async () => {
    const file = await sign(payload());
    expect(
      await verifyLicense(file, publicKey, INSTANCE, new Date('2027-01-01T00:00:00Z')),
    ).toEqual({
      valid: false,
      reason: 'expired',
    });
    expect(
      await verifyLicense(file, publicKey, INSTANCE, new Date('2025-12-31T23:59:59Z')),
    ).toEqual({
      valid: false,
      reason: 'not_yet_valid',
    });
  });

  it('menolak tanda tangan dari kunci lain', async () => {
    const other = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
      'sign',
      'verify',
    ])) as CryptoKeyPair;
    const file = await sign(payload(), other.privateKey);
    expect(await verifyLicense(file, publicKey, INSTANCE, NOW)).toEqual({
      valid: false,
      reason: 'bad_signature',
    });
  });

  it('menolak bentuk yang salah dan kunci tambahan yang tidak ditandatangani', async () => {
    const file = await sign(payload());
    const cases: unknown[] = [
      null,
      'lisensi',
      [],
      { ...file, signature: undefined },
      { ...file, signature: 'bukan base64!' },
      { ...file, extra: 'tidak ditandatangani' },
      { ...file, quota: { ...file.quota, venues: -1 } },
      { ...file, quota: { ...file.quota, extra: 1 } },
      { ...file, validUntil: '2027-01-01' },
      { ...file, validUntil: file.validFrom },
      { ...file, features: [1] },
    ];
    for (const value of cases) {
      expect(await verifyLicense(value, publicKey, INSTANCE, NOW)).toEqual({
        valid: false,
        reason: 'malformed',
      });
    }
  });
});

describe('kunci publik vendor', () => {
  it('kunci yang ditanam di kode adalah kunci Ed25519 32 bait', async () => {
    await expect(importLicensePublicKey(LICENSE_PUBLIC_KEY)).resolves.toBeDefined();
    await expect(importLicensePublicKey('AAAA')).rejects.toThrow();
  });

  it('readLicensePayload mengembalikan salinan, bukan objek masukan', () => {
    const p = payload();
    const read = readLicensePayload(p);
    expect(read).toEqual(p);
    expect(read?.quota).not.toBe(p.quota);
  });
});

describe('batas trial (T-504)', () => {
  const trial = (): LicensePayload => ({
    ...payload(),
    plan: TRIAL_PLAN,
    validUntil: '2026-01-15T00:00:00Z',
    quota: { ...TRIAL_QUOTA },
    features: [...TRIAL_FEATURES],
  });

  it('batas tambahan terbaca dan tetap ikut tanda tangan; lisensi lama tanpa batas tambahan tetap sah', async () => {
    const file = await sign(trial());
    const result = await verifyLicense(file, publicKey, INSTANCE, new Date('2026-01-05T00:00:00Z'));
    expect(result.valid && result.license.quota).toEqual(TRIAL_QUOTA);
    expect(result.valid && isTrialLicense(result.license)).toBe(true);
    // Kuota diedit setelah ditandatangani: tanda tangan tidak cocok.
    const edited = { ...file, quota: { ...file.quota, locations: 100_000 } };
    expect(await verifyLicense(edited, publicKey, INSTANCE, NOW)).toEqual({
      valid: false,
      reason: 'bad_signature',
    });
    // Batas tambahan yang dihapus dari berkas juga ketahuan.
    const { locations: _dropped, ...fewer } = file.quota;
    expect(await verifyLicense({ ...file, quota: fewer }, publicKey, INSTANCE, NOW)).toMatchObject({
      valid: false,
      reason: 'bad_signature',
    });
    const old = await verifyLicense(await sign(payload()), publicKey, INSTANCE, NOW);
    expect(old.valid && Object.keys(old.license.quota)).toEqual([
      'venues',
      'buildings',
      'floors',
      'infoPoints',
    ]);
  });

  it('sebagian batas tambahan saja boleh; kunci tak dikenal dan nilai negatif ditolak', () => {
    const base = payload();
    expect(
      readLicensePayload({ ...base, quota: { ...base.quota, publishPerDay: 5 } })?.quota,
    ).toEqual({ ...base.quota, publishPerDay: 5 });
    expect(readLicensePayload({ ...base, quota: { ...base.quota, rooms: 5 } })).toBeNull();
    expect(readLicensePayload({ ...base, quota: { ...base.quota, users: -1 } })).toBeNull();
    expect(readLicensePayload({ ...base, quota: { ...base.quota, storageMb: 1.5 } })).toBeNull();
    const { venues: _v, ...missing } = base.quota;
    expect(readLicensePayload({ ...base, quota: { ...missing, users: 5 } })).toBeNull();
  });

  it('lama trial 14–30 hari', () => {
    expect(trialDaysProblem(14)).toBeNull();
    expect(trialDaysProblem(30)).toBeNull();
    expect(trialDaysProblem(13)).toMatch(/14–30/);
    expect(trialDaysProblem(31)).toMatch(/14–30/);
    expect(trialDaysProblem(14.5)).toMatch(/bulat/);
    expect(isTrialLicense(payload())).toBe(false);
  });
});
