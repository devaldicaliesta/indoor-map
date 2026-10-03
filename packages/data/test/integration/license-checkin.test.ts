import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createVendorStub, licenseIdFor } from '../../../../tools/vendor-stub/src/server';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const dbUrl = process.env.SUPABASE_DB_URL ?? '';
const PASSWORD = 'Integrasi-2026!';
const DAY_MS = 86_400_000;
const STUB_PORT = 8091;
const LICENSE_ID = licenseIdFor('DEV-ONLINE-0001');

/** SQL langsung sebagai postgres untuk keadaan yang sengaja tidak bisa dicapai API. */
const sql = (statements: string) =>
  execFileSync('psql', [dbUrl, '-Atq', '-v', 'ON_ERROR_STOP=1', '-c', statements], {
    encoding: 'utf8',
  }).trim();

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const vendor = (path: string, body: Record<string, unknown>) =>
  fetch(`http://127.0.0.1:${STUB_PORT}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

async function waitFor(check: () => boolean, timeoutMs = 20_000) {
  const until = Date.now() + timeoutMs;
  while (!check()) {
    if (Date.now() > until) throw new Error('Check-in terjadwal tidak selesai tepat waktu.');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

const currentValidUntil = () =>
  sql(`select payload->>'validUntil' from public.licenses where is_current`);

// Butuh Edge Function lokal (license-activate, license-checkin) dan vendor-stub di port 8091
// (dijalankan test ini). Jam vendor bisa digeser untuk meniru jam server yang mundur.
describe.runIf(url && anonKey && serviceKey && dbUrl)('check-in lisensi', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let vendorShiftMs = 0;
  let superAdmin: DataClient;
  let admin: DataClient;
  let stub: Server;
  let original = '';

  async function signIn(role: 'super_admin' | 'admin') {
    const email = `${role}-${suffix}@checkin.test`;
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

  const listen = () =>
    new Promise<void>((resolve) => stub.listen(STUB_PORT, '0.0.0.0', () => resolve()));

  /** Admin mencoba menulis; `true` bila server mengizinkan. */
  async function adminCanWrite() {
    const name = `Check-in ${suffix} ${randomUUID().slice(0, 4)}`;
    const created = await admin.venues
      .create({
        name,
        address: null,
        center: { type: 'Point', coordinates: [106.8, -6.2] },
        timezone: 'Asia/Jakarta',
        type: 'custom',
      } as never)
      .then(() => true)
      .catch((error: unknown) => {
        if (error instanceof DataError && error.kind === 'forbidden') return false;
        throw error;
      });
    await service.from('venues').delete().eq('name', name);
    return created;
  }

  beforeAll(async () => {
    stub = await createVendorStub({ now: () => new Date(Date.now() + vendorShiftMs) });
    await listen();
    superAdmin = await signIn('super_admin');
    admin = await signIn('admin');
    original = sql('select id from public.licenses where is_current');
    sql(`update public.installation
         set last_seen_at = now(), last_checkin_at = null, checkin_error = null where id`);
    await superAdmin.license.activateOnline('DEV-ONLINE-0001');
  });

  afterAll(async () => {
    stub?.close();
    stub?.closeAllConnections();
    // Lisensi semula (lisensi dev dari seed) dan jam instalasi dipulihkan.
    sql(`update public.licenses set is_current = false where is_current;
         update public.licenses set is_current = true where id = '${original}';
         update public.installation
         set last_seen_at = now(), last_checkin_at = null, checkin_error = null,
             checkin_requested_at = null
         where id;`);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it('hanya Super Admin yang bisa check-in sekarang', async () => {
    for (const client of [admin, createRepositories(newDb(anonKey))]) {
      const error = await client.license.checkIn().catch((e: unknown) => e);
      expect((error as DataError).kind).toBe('forbidden');
    }
    expect(sql('select last_checkin_at is null from public.installation')).toBe('t');
  });

  it('perpanjangan di vendor diterima pada check-in berikutnya', async () => {
    const before = currentValidUntil();
    expect((await vendor('/v1/vendor/renew', { licenseId: LICENSE_ID, days: 30 })).status).toBe(
      200,
    );
    expect(await superAdmin.license.checkIn()).toEqual({ result: 'renewed' });
    expect(Date.parse(currentValidUntil()) - Date.parse(before)).toBe(30 * DAY_MS);
    expect(sql('select source from public.licenses where is_current')).toBe('checkin');
    expect(await superAdmin.license.checkIn()).toEqual({ result: 'unchanged' });
  });

  it('jadwal database menjalankan check-in lewat pg_net saat jatuh tempo', async () => {
    const before = currentValidUntil();
    await vendor('/v1/vendor/renew', { licenseId: LICENSE_ID, days: 10 });
    sql(`update public.installation set last_checkin_at = now() - interval '25 hours' where id;
         select app.license_tick();`);
    await waitFor(() => currentValidUntil() !== before);
    expect(Date.parse(currentValidUntil()) - Date.parse(before)).toBe(10 * DAY_MS);
    expect(
      sql("select last_checkin_at > now() - interval '1 minute' from public.installation"),
    ).toBe('t');
  });

  it('jam server mundur: lisensi tidak berlaku sampai jam diperbaiki', async () => {
    vendorShiftMs = 3 * DAY_MS;
    expect(await superAdmin.license.checkIn()).toEqual({ result: 'unchanged' });
    expect((await admin.license.status()).state).toBe('clock_behind');
    expect(await adminCanWrite()).toBe(false);

    vendorShiftMs = 0;
    expect(await superAdmin.license.checkIn()).toEqual({ result: 'unchanged' });
    expect((await admin.license.status()).state).toBe('active');
    expect(await adminCanWrite()).toBe(true);
  });

  it('vendor tidak terjangkau: sistem tetap berjalan dan alasannya dicatat', async () => {
    stub.close();
    stub.closeAllConnections();
    try {
      const reply = await superAdmin.license.checkIn();
      expect(reply).toEqual({ result: 'failed', message: 'Server vendor tidak bisa dihubungi.' });
      expect((await admin.license.status()).state).toBe('active');
      expect(await adminCanWrite()).toBe(true);
      expect(sql('select checkin_error from public.installation')).toBe(
        'Server vendor tidak bisa dihubungi.',
      );
    } finally {
      await listen();
    }
  });

  it('banner hanya setelah 7 hari tanpa check-in berhasil', async () => {
    sql(`update public.installation set last_checkin_at = now() - interval '6 days' where id`);
    expect(await admin.license.checkinOverdueSince()).toBeNull();
    const sinceMs = Number(
      sql(`update public.installation set last_checkin_at = now() - interval '8 days'
           where id returning floor(extract(epoch from last_checkin_at) * 1000)`),
    );
    const overdue = await admin.license.checkinOverdueSince();
    expect(Math.abs(Date.parse(overdue ?? '') - sinceMs)).toBeLessThan(2);
    await expect(
      createRepositories(newDb(anonKey)).license.checkinOverdueSince(),
    ).rejects.toBeInstanceOf(DataError);
  });

  it('lisensi yang dicabut vendor kedaluwarsa pada check-in berikutnya', async () => {
    expect((await vendor('/v1/vendor/revoke', { licenseId: LICENSE_ID })).status).toBe(200);
    expect(await superAdmin.license.checkIn()).toEqual({ result: 'revoked' });
    expect((await admin.license.status()).state).toBe('revoked');
    expect(await adminCanWrite()).toBe(false);
    expect(await superAdmin.license.checkinOverdueSince()).toBeNull();

    // Super Admin bisa membaca isi berkas dari tabel licenses; berkas itu tidak bisa dipasang ulang.
    const { data: revoked } = await service
      .from('licenses')
      .select('payload, signature')
      .eq('license_id', LICENSE_ID)
      .eq('is_current', true)
      .single();
    const file = {
      ...(revoked?.payload as Record<string, unknown>),
      signature: revoked?.signature,
    };
    const error = await superAdmin.license.activateManual(file).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataError);
    expect((error as DataError).kind).toBe('conflict');
    expect((error as DataError).message).toContain('sudah dicabut vendor');
    expect((await admin.license.status()).state).toBe('revoked');
  });
});
