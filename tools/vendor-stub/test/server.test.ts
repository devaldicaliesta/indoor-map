import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LICENSE_PUBLIC_KEY } from '../../../packages/domain/src/license.publicKey.ts';
import {
  importLicensePublicKey,
  type LicenseFile,
  verifyLicense,
} from '../../../packages/domain/src/license.ts';
import { createVendorStub, licenseIdFor } from '../src/server';

let base = '';
let close: () => void;

beforeAll(async () => {
  const server = await createVendorStub();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => server.close();
});
afterAll(() => close());

const post = (path: string, body: Record<string, unknown>) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const activate = (licenseKey: string, instanceId: string) =>
  post('/v1/activate', { licenseKey, instanceId });

interface CheckinReply {
  status: 'active' | 'revoked';
  serverTime: string;
  license?: LicenseFile;
}

const issue = async (licenseKey: string, instanceId: string) =>
  (await (await activate(licenseKey, instanceId)).json()) as LicenseFile;

describe('vendor-stub', () => {
  it('menerbitkan lisensi sah (kunci dev) untuk instance pemanggil', async () => {
    const response = await activate('DEV-ONLINE-0001', 'inst-a');
    expect(response.status).toBe(200);
    const file = await response.json();
    const key = await importLicensePublicKey(LICENSE_PUBLIC_KEY);
    const result = await verifyLicense(file, key, 'inst-a', new Date());
    expect(result.valid).toBe(true);
    expect(file).toMatchObject({
      licenseId: licenseIdFor('DEV-ONLINE-0001'),
      plan: 'professional',
    });
    expect(JSON.stringify(file)).not.toContain('DEV-ONLINE-0001');
  });

  it('kunci yang sama tidak bisa dipakai instalasi lain', async () => {
    expect((await activate('DEV-ONLINE-0001', 'inst-a')).status).toBe(200);
    const other = await activate('DEV-ONLINE-0001', 'inst-b');
    expect(other.status).toBe(409);
  });

  it('kunci tidak dikenal ditolak', async () => {
    expect((await activate('KUNCI-PALSU', 'inst-a')).status).toBe(404);
  });

  it('aktivasi ulang oleh instance yang sama mengembalikan berkas yang sudah terbit', async () => {
    const first = await issue('DEV-STARTER-0002', 'inst-c');
    const again = await issue('DEV-STARTER-0002', 'inst-c');
    expect(again).toEqual(first);
  });
});

describe('vendor-stub check-in', () => {
  const licenseId = licenseIdFor('DEV-STARTER-0002');
  const checkin = (instanceId: string) => post('/v1/checkin', { licenseId, instanceId });
  const reply = async (instanceId: string) =>
    (await (await checkin(instanceId)).json()) as CheckinReply;

  it('mengirim berkas terbaru beserta waktu server vendor', async () => {
    const issued = await issue('DEV-STARTER-0002', 'inst-c');
    expect((await checkin('inst-c')).status).toBe(200);
    const active = await reply('inst-c');
    expect(active).toMatchObject({ status: 'active', license: issued });
    expect(Math.abs(Date.parse(active.serverTime) - Date.now())).toBeLessThan(5_000);
  });

  it('perpanjangan menerbitkan ulang berkas sah dengan masa berlaku lebih panjang', async () => {
    const before = await issue('DEV-STARTER-0002', 'inst-c');
    expect((await post('/v1/vendor/renew', { licenseId, days: 30 })).status).toBe(200);
    const { license } = await reply('inst-c');
    if (!license) throw new Error('Berkas lisensi tidak dikirim.');
    expect(Date.parse(license.validUntil) - Date.parse(before.validUntil)).toBe(30 * 86_400_000);
    expect(license.validFrom).toBe(before.validFrom);
    const key = await importLicensePublicKey(LICENSE_PUBLIC_KEY);
    expect((await verifyLicense(license, key, 'inst-c', new Date())).valid).toBe(true);
  });

  it('lisensi yang dicabut dilaporkan revoked tanpa berkas', async () => {
    expect((await post('/v1/vendor/revoke', { licenseId })).status).toBe(200);
    const revoked = await reply('inst-c');
    expect(revoked.status).toBe('revoked');
    expect(revoked.license).toBeUndefined();
  });

  it('lisensi tidak dikenal atau milik instalasi lain ditolak', async () => {
    expect(
      (await post('/v1/checkin', { licenseId: 'LIC-ASING', instanceId: 'inst-c' })).status,
    ).toBe(404);
    expect((await checkin('inst-lain')).status).toBe(409);
  });
});
