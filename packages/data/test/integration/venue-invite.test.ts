import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';
import { sql } from './psql';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const REDIRECT = 'http://127.0.0.1:5173/reset-password';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// T-612c: Admin venue (pengguna trial ter-hosting) mengundang anggota venue-nya lewat
// `admin-users`; batas 2 pengguna ditolak SEBELUM email undangan dikirim.
describe.runIf(url && anonKey && serviceKey)('undangan anggota oleh Admin venue', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const venueId = randomUUID();
  const emails: string[] = [];
  let venueAdmin: ReturnType<typeof createRepositories>;

  async function invite(role: 'editor' | 'viewer' | 'super_admin', label: string) {
    const email = `${label}-${suffix}@undang.test`;
    emails.push(email);
    await venueAdmin.users.invite({ email, fullName: label, role, redirectTo: REDIRECT });
    return email;
  }

  beforeAll(async () => {
    const email = `admin-venue-${suffix}@undang.test`;
    emails.push(email);
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    const userId = data.user.id;
    sql(`insert into app.server_settings (key, value) values ('hosting_mode', 'true')
           on conflict (key) do update set value = 'true';
         insert into public.venues (id, name) values ('${venueId}', 'Trial Undangan ${suffix}');
         insert into public.profiles (user_id, full_name, email, role, all_venues)
           values ('${userId}', 'Admin Venue', '${email}', 'admin', false);
         insert into hosting.trials (venue_id, user_id, ends_at)
           values ('${venueId}', '${userId}', now() + interval '17 days');
         insert into public.venue_members (venue_id, user_id) values ('${venueId}', '${userId}');`);
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    venueAdmin = createRepositories(db);
  });

  afterAll(async () => {
    const { data } = await service.from('profiles').select('user_id, email');
    for (const row of data ?? []) {
      if (emails.includes(row.email)) await service.auth.admin.deleteUser(row.user_id);
    }
    sql(`delete from public.venues where id = '${venueId}';
         delete from app.server_settings where key = 'hosting_mode';`);
  });

  it('anggota baru masuk venue itu saja, tanpa akses semua venue', async () => {
    const email = await invite('editor', 'anggota');
    const { data: profile } = await service
      .from('profiles')
      .select('user_id, role, all_venues')
      .eq('email', email)
      .single();
    expect(profile).toMatchObject({ role: 'editor', all_venues: false });
    const { data: members } = await service
      .from('venue_members')
      .select('venue_id')
      .eq('user_id', profile?.user_id ?? '');
    expect(members).toEqual([{ venue_id: venueId }]);
  });

  it('anggota ketiga ditolak dengan pesan batas trial dan akunnya tidak dibuat', async () => {
    const error = await invite('viewer', 'ketiga').catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(DataError);
    expect((error as DataError).kind).toBe('conflict');
    expect((error as DataError).message).toContain('Batas trial tercapai: pengguna aktif 2/2');
    const { data } = await service
      .from('profiles')
      .select('user_id')
      .eq('email', `ketiga-${suffix}@undang.test`);
    expect(data).toEqual([]);
  });

  it('Admin venue tidak bisa mengundang Super Admin', async () => {
    const error = await invite('super_admin', 'super').catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(DataError);
    expect((error as DataError).kind).toBe('forbidden');
  });

  it('daftar Pengguna Admin venue hanya berisi anggota venue-nya', async () => {
    const list = await venueAdmin.profiles.list();
    expect(list.map((profile) => profile.email).sort()).toEqual(
      [`admin-venue-${suffix}@undang.test`, `anggota-${suffix}@undang.test`].sort(),
    );
  });
});
