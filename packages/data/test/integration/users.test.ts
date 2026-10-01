import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const REDIRECT = 'http://127.0.0.1:5173/reset-password';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

describe.runIf(url && anonKey && serviceKey)('undang pengguna (Edge Function admin-users)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const cleanup: string[] = [];

  async function signedIn(role: 'super_admin' | 'editor') {
    const email = `${role}-${suffix}@users.test`;
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    cleanup.push(email);
    await service.from('profiles').insert({ user_id: data.user.id, full_name: role, email, role });
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return createRepositories(db);
  }

  afterAll(async () => {
    const { data } = await service.from('profiles').select('user_id, email');
    for (const row of data ?? []) {
      if (cleanup.includes(row.email)) await service.auth.admin.deleteUser(row.user_id);
    }
  });

  it('Super Admin mengundang pengguna; profil dibuat dengan role yang dipilih', async () => {
    const data = await signedIn('super_admin');
    const email = `undangan-${suffix}@users.test`;
    cleanup.push(email);
    await data.users.invite({
      email,
      fullName: 'Undangan',
      role: 'operator',
      redirectTo: REDIRECT,
    });
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('email', email)
      .single();
    expect(profile?.role).toBe('operator');

    const duplicate = await data.users
      .invite({ email, fullName: 'Undangan', role: 'viewer', redirectTo: REDIRECT })
      .catch((error: unknown) => error);
    expect(duplicate).toBeInstanceOf(DataError);
    expect((duplicate as DataError).kind).toBe('conflict');
  });

  it('Editor ditolak server walau memanggil fungsi langsung', async () => {
    const data = await signedIn('editor');
    const error = await data.users
      .invite({
        email: `x-${suffix}@users.test`,
        fullName: 'X',
        role: 'viewer',
        redirectTo: REDIRECT,
      })
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(DataError);
    expect((error as DataError).kind).toBe('forbidden');
  });
});
