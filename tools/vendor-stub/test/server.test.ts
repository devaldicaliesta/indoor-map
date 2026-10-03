import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LICENSE_PUBLIC_KEY } from '../../../packages/domain/src/license.publicKey.ts';
import { importLicensePublicKey, verifyLicense } from '../../../packages/domain/src/license.ts';
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

const activate = (licenseKey: string, instanceId: string) =>
  fetch(`${base}/v1/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey, instanceId }),
  });

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
});
