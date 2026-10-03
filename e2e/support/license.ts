import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type LicensePayload, licenseSigningBytes, toBase64 } from '@indoor/domain/license';

// Keadaan lisensi (tanpa lisensi, instalasi baru) sengaja tidak bisa dibuat lewat API, jadi
// disiapkan langsung di database lokal sebagai postgres.
const dbUrl = process.env.E2E_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

export const sql = (statements: string): string =>
  execFileSync('psql', [dbUrl, '-Atq', '-v', 'ON_ERROR_STOP=1', '-c', statements], {
    encoding: 'utf8',
  }).trim();

const DEV_KEY = fileURLToPath(
  new URL('../../tools/license-cli/dev-keys/license-private.pkcs8.b64', import.meta.url),
);

/** Berkas lisensi bertanda tangan kunci dev untuk instance lokal. */
export async function devLicenseFile(overrides: Partial<LicensePayload> = {}) {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(readFileSync(DEV_KEY, 'utf8').trim(), 'base64'),
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
  const payload: LicensePayload = {
    licenseId: `LIC-E2E-${randomUUID().slice(0, 6).toUpperCase()}`,
    client: 'RS Uji E2E',
    plan: 'professional',
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2099-01-01T00:00:00Z',
    quota: { venues: 5, buildings: 10, floors: 50, infoPoints: 10 },
    features: ['3d', 'info_point'],
    instanceId: sql('select instance_id from public.installation'),
    issuedAt: '2026-10-01T00:00:00Z',
    ...overrides,
  };
  const signature = await crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    licenseSigningBytes(payload),
  );
  return { ...payload, signature: toBase64(new Uint8Array(signature)) };
}

/** Lisensi yang sedang berlaku (dari seed), untuk dipasang kembali setelah test. */
export function currentLicenseId(): string {
  return sql('select id from public.licenses where is_current');
}

export function releaseLicense() {
  sql('update public.licenses set is_current = false where is_current;');
}

export function restoreLicense(id: string) {
  sql(`update public.licenses set is_current = false where is_current;
       update public.licenses set is_current = true where id = '${id}';`);
}
