import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';
import { sql } from './psql';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// T-598: preferensi email lewat RLS sungguhan dan tautan berhenti berlangganan tanpa login.
describe.runIf(url && anonKey && serviceKey)('notifikasi email', () => {
  const service = newDb(serviceKey);
  const email = `notif-${randomUUID().slice(0, 8)}@notif.test`;
  let userId = '';

  beforeAll(async () => {
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    sql(`insert into public.profiles (user_id, full_name, email, role, all_venues)
           values ('${userId}', 'Editor Notif', '${email}', 'editor', true)
           on conflict (user_id) do update set role = 'editor'`);
  });

  afterAll(async () => {
    await service.auth.admin.deleteUser(userId);
  });

  it('preferensi bawaan aktif, bisa dimatikan dan dinyalakan lagi', async () => {
    const repos = createRepositories(newDb(anonKey));
    await repos.auth.signIn(email, PASSWORD);
    expect(await repos.notifications.preferences()).toEqual({
      license_reminder: true,
      publish: true,
      closure_created: true,
    });
    await repos.notifications.setPreference('publish', false);
    expect((await repos.notifications.preferences()).publish).toBe(false);
    await repos.notifications.setPreference('publish', true);
    expect((await repos.notifications.preferences()).publish).toBe(true);
    expect(
      sql(`select count(*) from public.notification_preferences where user_id = '${userId}'`),
    ).toBe('1');
  });

  it('tautan berhenti berlangganan: tanya dulu, lalu mematikan satu jenis', async () => {
    const token = sql(
      `select substring(app.unsubscribe_url('${userId}', 'publish') from 't=(.*)$')`,
    );
    const anon = createRepositories(newDb(anonKey));
    await expect(anon.notifications.unsubscribe(token, false)).resolves.toBe('publish');
    expect(sql(`select app.wants_notification('${userId}', 'publish')`)).toBe('t');
    await expect(anon.notifications.unsubscribe(token, true)).resolves.toBe('publish');
    expect(sql(`select app.wants_notification('${userId}', 'publish')`)).toBe('f');
    await expect(anon.notifications.unsubscribe('bukan-token', true)).resolves.toBeNull();
  });
});
