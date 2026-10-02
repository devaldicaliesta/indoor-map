import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ACCOUNT_INACTIVE_MESSAGE } from '../../src/auth';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function failure(promise: Promise<unknown>): Promise<DataError> {
  const reason = await promise.then(
    () => null,
    (error: unknown) => error,
  );
  expect(reason).toBeInstanceOf(DataError);
  return reason as DataError;
}

describe.runIf(url && anonKey && serviceKey)('login lewat Auth Hook (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const created: string[] = [];

  async function createUser(role: 'editor' | 'viewer') {
    const email = `${role}-${randomUUID().slice(0, 8)}@login.test`;
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    created.push(data.user.id);
    const insert = await service
      .from('profiles')
      .insert({ user_id: data.user.id, full_name: `Uji ${role}`, email, role });
    if (insert.error) throw insert.error;
    return { id: data.user.id, email };
  }

  beforeAll(() => {
    expect(url).not.toBe('');
  });

  afterAll(async () => {
    for (const id of created) await service.auth.admin.deleteUser(id);
  });

  it('password salah memakai pesan umum', async () => {
    const { email } = await createUser('editor');
    const error = await failure(createRepositories(newDb(anonKey)).auth.signIn(email, 'salah'));
    expect(error.code).toBe('invalid_credentials');
    expect(error.message).toBe('Email atau password salah.');
  });

  it('akun terkunci ditolak persis seperti email tidak terdaftar (tanpa membocorkan akun)', async () => {
    const { id, email } = await createUser('editor');
    const auth = createRepositories(newDb(anonKey)).auth;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      expect((await failure(auth.signIn(email, `salah-${attempt}`))).code).toBe(
        'invalid_credentials',
      );
    }
    const locked = await failure(auth.signIn(email, PASSWORD));
    const unknown = await failure(auth.signIn(`tidak-ada-${randomUUID()}@login.test`, PASSWORD));
    expect(locked.code).toBe('invalid_credentials');
    expect(locked.message).toBe('Email atau password salah.');
    expect(locked.cause).toEqual(unknown.cause);
    const { data: profile } = await service
      .from('profiles')
      .select('locked_until')
      .eq('user_id', id)
      .single();
    expect(profile?.locked_until).not.toBeNull();
  });

  it('keluar di satu perangkat tidak mengeluarkan perangkat lain', async () => {
    const { email } = await createUser('viewer');
    const laptop = createRepositories(newDb(anonKey)).auth;
    const phoneDb = newDb(anonKey);
    await laptop.signIn(email, PASSWORD);
    await createRepositories(phoneDb).auth.signIn(email, PASSWORD);
    await laptop.signOut();
    expect(await laptop.hasSession()).toBe(false);
    // getUser memeriksa sesi ke server (JWT saja tetap sah sampai kedaluwarsa).
    const { data, error } = await phoneDb.auth.getUser();
    expect(error).toBeNull();
    expect(data.user?.email).toBe(email);
  });

  it('pengguna nonaktif tidak bisa masuk', async () => {
    const { id, email } = await createUser('viewer');
    await service.from('profiles').update({ is_active: false }).eq('user_id', id);
    const error = await failure(createRepositories(newDb(anonKey)).auth.signIn(email, PASSWORD));
    expect(error.code).toBe('account_inactive');
    expect(error.message).toBe(ACCOUNT_INACTIVE_MESSAGE);
  });

  it('pengguna yang dinonaktifkan saat sedang masuk langsung dikeluarkan', async () => {
    const { id, email } = await createUser('viewer');
    const auth = createRepositories(newDb(anonKey)).auth;
    await auth.signIn(email, PASSWORD);
    expect((await auth.getCurrentProfile())?.email).toBe(email);

    await service.from('profiles').update({ is_active: false }).eq('user_id', id);
    expect((await failure(auth.getCurrentProfile())).code).toBe('account_inactive');
    expect(await auth.hasSession()).toBe(false);
  });
});
