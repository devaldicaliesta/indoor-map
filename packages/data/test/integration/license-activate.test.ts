import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { type LicensePayload, licenseSigningBytes, toBase64 } from '@indoor/domain/license';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createVendorStub, licenseIdFor } from '../../../../tools/vendor-stub/src/server';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const DEV_KEY = fileURLToPath(
  new URL('../../../../tools/license-cli/dev-keys/license-private.pkcs8.b64', import.meta.url),
);

const dbUrl = process.env.SUPABASE_DB_URL ?? '';

/** SQL langsung sebagai postgres untuk menyiapkan keadaan yang sengaja tidak bisa dicapai API. */
const sql = (statements: string) =>
  execFileSync('psql', [dbUrl, '-Atq', '-v', 'ON_ERROR_STOP=1', '-c', statements], {
    encoding: 'utf8',
  });

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function signedLicense(instanceId: string, overrides: Partial<LicensePayload> = {}) {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(readFileSync(DEV_KEY, 'utf8').trim(), 'base64'),
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
  const payload: LicensePayload = {
    licenseId: `LIC-INT-${randomUUID().slice(0, 6)}`,
    client: 'Klien Integrasi',
    plan: 'professional',
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2099-01-01T00:00:00Z',
    quota: { venues: 5, buildings: 10, floors: 50, infoPoints: 10 },
    features: ['3d', 'info_point'],
    instanceId,
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

// Butuh Edge Function lokal dan vendor-stub di port 8091 (dijalankan test ini).
describe.runIf(url && anonKey && serviceKey)('aktivasi lisensi', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let superAdmin: DataClient;
  let admin: DataClient;
  let editor: DataClient;
  let stub: Server;
  let instanceId = '';
  let original: { id: string } | null = null;

  async function signIn(role: 'super_admin' | 'admin' | 'editor') {
    const email = `${role}-${suffix}@license.test`;
    const created = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    const id = created.data.user?.id ?? '';
    userIds.push(id);
    await service.from('profiles').insert({ user_id: id, full_name: role, email, role });
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return createRepositories(db);
  }

  beforeAll(async () => {
    stub = await createVendorStub();
    await new Promise<void>((resolve) => stub.listen(8091, '0.0.0.0', resolve));
    superAdmin = await signIn('super_admin');
    admin = await signIn('admin');
    editor = await signIn('editor');
    instanceId = (await superAdmin.license.status()).instanceId;
    const { data } = await service
      .from('licenses')
      .select('id')
      .eq('is_current', true)
      .maybeSingle();
    original = data;
  });

  afterAll(async () => {
    stub?.close();
    // Lisensi semula (lisensi dev dari seed) dipasang lagi.
    if (original) {
      await service.from('licenses').update({ is_current: false }).eq('is_current', true);
      await service.from('licenses').update({ is_current: true }).eq('id', original.id);
    }
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it('status bisa dibaca tanpa login', async () => {
    const status = await createRepositories(newDb(anonKey)).license.status();
    expect(status).toEqual({ state: 'active', instanceId, needsAdmin: false });
  });

  it('tanpa lisensi API menolak perubahan; data tetap terbaca', async () => {
    await service.from('licenses').update({ is_current: false }).eq('is_current', true);
    expect((await admin.license.status()).state).toBe('missing');
    const error = await admin.venues
      .create({
        name: `Tanpa Lisensi ${suffix}`,
        address: null,
        center: { type: 'Point', coordinates: [106.8, -6.2] },
        timezone: 'Asia/Jakarta',
        type: 'custom',
      } as never)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataError);
    expect((error as DataError).kind).toBe('forbidden');
    await expect(admin.venues.list()).resolves.toBeDefined();
  });

  it('unggah manual: berkas sah dipasang, berkas diubah dan instance lain ditolak', async () => {
    const valid = await signedLicense(instanceId);
    const tampered = { ...valid, client: 'Klien Integrasl' };
    const tamperedError = await superAdmin.license
      .activateManual(tampered)
      .catch((e: unknown) => e);
    expect((tamperedError as DataError).message).toContain('Tanda tangan lisensi tidak cocok');

    const other = await signedLicense(randomUUID());
    const otherError = await superAdmin.license.activateManual(other).catch((e: unknown) => e);
    expect((otherError as DataError).message).toContain('instalasi lain');

    const installed = await superAdmin.license.activateManual(valid);
    expect(installed.licenseId).toBe(valid.licenseId);
    expect((await superAdmin.license.status()).state).toBe('active');
    const { data } = await service
      .from('licenses')
      .select('license_id, source')
      .eq('is_current', true)
      .single();
    expect(data).toEqual({ license_id: valid.licenseId, source: 'manual' });
  });

  it('aktivasi online ke vendor-stub; kunci tidak disimpan', async () => {
    const installed = await superAdmin.license.activateOnline('DEV-ONLINE-0001');
    expect(installed).toMatchObject({
      licenseId: licenseIdFor('DEV-ONLINE-0001'),
      plan: 'professional',
    });
    const { data } = await service
      .from('licenses')
      .select('payload, signature, source')
      .eq('is_current', true)
      .single();
    expect(data?.source).toBe('online');
    expect(JSON.stringify(data)).not.toContain('DEV-ONLINE-0001');

    const unknown = await superAdmin.license.activateOnline('KUNCI-PALSU').catch((e: unknown) => e);
    expect((unknown as DataError).message).toContain('Kunci lisensi tidak dikenal');
  });

  it('hanya Super Admin yang memasang lisensi; Super Admin pertama tidak bisa dibuat ulang', async () => {
    const valid = await signedLicense(instanceId);
    for (const client of [admin, editor, createRepositories(newDb(anonKey))]) {
      const error = await client.license.activateManual(valid).catch((e: unknown) => e);
      expect((error as DataError).kind).toBe('forbidden');
    }
    const again = await createRepositories(newDb(anonKey))
      .license.createFirstAdmin({
        fullName: 'Penyusup',
        email: `x-${suffix}@license.test`,
        password: 'Rahasia-123',
      })
      .catch((e: unknown) => e);
    expect((again as DataError).kind).toBe('forbidden');
  });

  it('instalasi baru: aktivasi tanpa login lalu Super Admin pertama dibuat sekali', async () => {
    // Keadaan instalasi baru: tanpa Super Admin aktif dan tanpa lisensi. Penjaga "Super Admin
    // terakhir" (benar menolak lewat API) dimatikan hanya selama menyiapkan keadaan ini.
    const admins = sql(`
      alter table public.profiles disable trigger profiles_guard_last_super_admin;
      update public.profiles set is_active = false where role = 'super_admin' and is_active
        returning user_id;
      alter table public.profiles enable trigger profiles_guard_last_super_admin;
      update public.licenses set is_current = false where is_current;`)
      .split('\n')
      .filter((line) => /^[0-9a-f-]{36}$/.test(line));
    const guest = createRepositories(newDb(anonKey));
    const email = `pertama-${suffix}@license.test`;
    try {
      expect(await guest.license.status()).toMatchObject({ state: 'missing', needsAdmin: true });
      const early = await guest.license
        .createFirstAdmin({ fullName: 'Pertama', email, password: 'Rahasia-123' })
        .catch((e: unknown) => e);
      expect((early as DataError).kind).toBe('conflict');

      await guest.license.activateManual(await signedLicense(instanceId));
      await guest.license.createFirstAdmin({ fullName: 'Pertama', email, password: 'Rahasia-123' });
      const { data: created } = await service
        .from('profiles')
        .select('user_id, role')
        .eq('email', email)
        .single();
      expect(created?.role).toBe('super_admin');
      if (created) userIds.push(created.user_id);
      expect((await guest.license.status()).needsAdmin).toBe(false);

      const second = await guest.license
        .createFirstAdmin({
          fullName: 'Kedua',
          email: `kedua-${suffix}@license.test`,
          password: 'Rahasia-123',
        })
        .catch((e: unknown) => e);
      expect((second as DataError).kind).toBe('forbidden');
    } finally {
      if (admins.length) {
        sql(`update public.profiles set is_active = true
             where user_id in (${admins.map((id) => `'${id}'`).join(',')});`);
      }
    }
  });
});
