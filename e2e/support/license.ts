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

/** Keadaan check-in instalasi bersih: jam sekarang, belum pernah check-in, tanpa permintaan. */
export function resetCheckin() {
  sql(`update public.installation
       set last_seen_at = now(), last_checkin_at = null, checkin_error = null,
           checkin_requested_at = null
       where id;`);
}

/**
 * Check-in terjadwal seperti pg_cron saat jatuh tempo (app.license_tick → pg_net → Edge
 * Function → vendor), lalu menunggu hasilnya tercatat.
 */
export async function runScheduledCheckin() {
  sql(`update public.installation
       set last_checkin_at = now() - interval '25 hours', checkin_error = null
       where id;
       select app.license_tick();`);
  const until = Date.now() + 20_000;
  const done = () =>
    sql(`select last_checkin_at > now() - interval '1 minute' or checkin_error is not null
         from public.installation`) === 't';
  while (!done()) {
    if (Date.now() > until) throw new Error('Check-in terjadwal tidak selesai dalam 20 detik.');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
