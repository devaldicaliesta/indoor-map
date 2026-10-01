import { randomUUID } from 'node:crypto';
import { type AppRole, type UserId, UserIdSchema } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError, toDataError } from '../../src/errors';
import { geometryFromColumn, geometryToColumn } from '../../src/geometry';
import type { Db } from '../../src/supabase';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newClient = (key: string): Db =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function expectDataError(promise: Promise<unknown>, kind: DataError['kind']) {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(DataError);
  expect((error as DataError).kind).toBe(kind);
}

describe.runIf(url && anonKey && serviceKey)('RLS lewat repository (Supabase lokal)', () => {
  const service = newClient(serviceKey);
  const users = new Map<AppRole, { id: UserId; db: Db; data: DataClient }>();
  const suffix = randomUUID().slice(0, 8);
  let venueId = '';

  async function createUser(role: AppRole) {
    const email = `${role}-${suffix}@integrasi.test`;
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    const id = UserIdSchema.parse(data.user.id);
    const insert = await service
      .from('profiles')
      .insert({ user_id: id, full_name: `Uji ${role}`, email, role });
    if (insert.error) throw insert.error;

    const db = newClient(anonKey);
    const signIn = await db.auth.signInWithPassword({ email, password: PASSWORD });
    if (signIn.error) throw signIn.error;
    users.set(role, { id, db, data: createRepositories(db) });
  }

  function user(role: AppRole) {
    const found = users.get(role);
    if (!found) throw new Error(`pengguna ${role} belum dibuat`);
    return found;
  }

  beforeAll(async () => {
    for (const role of ['super_admin', 'editor', 'viewer'] as const) {
      await createUser(role);
    }
    const venue = await service
      .from('venues')
      .insert({ name: `Venue Integrasi ${suffix}` })
      .select('id')
      .single();
    if (venue.error) throw venue.error;
    venueId = venue.data.id;
  });

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const { id } of users.values()) {
      await service.auth.admin.deleteUser(id);
    }
  });

  it('hanya Super Admin yang bisa membaca pengaturan sistem (T-010)', async () => {
    const settings = await user('super_admin').data.systemSettings.get();
    expect(settings.defaultLanguage).toBe('id');
    await expectDataError(user('viewer').data.systemSettings.get(), 'forbidden');
  });

  it('update yang dilarang RLS (0 baris) menjadi forbidden', async () => {
    await expectDataError(
      user('viewer').data.systemSettings.update({ defaultTimezone: 'Asia/Makassar' }),
      'forbidden',
    );
    await expectDataError(
      user('viewer').data.profiles.update(user('viewer').id, { role: 'super_admin' }),
      'forbidden',
    );
    const unchanged = await user('super_admin').data.profiles.getById(user('viewer').id);
    expect(unchanged.role).toBe('viewer');
  });

  it('insert yang dilarang RLS (42501) menjadi forbidden', async () => {
    const { error } = await user('editor').db.from('venues').insert({ name: 'Dari Editor' });
    expect(error).not.toBeNull();
    expect(toDataError(error).kind).toBe('forbidden');
  });

  it('update baris yang tidak ada menjadi not_found', async () => {
    await expectDataError(
      user('super_admin').data.profiles.update(UserIdSchema.parse(randomUUID()), {
        fullName: 'Tidak Ada',
      }),
      'not_found',
    );
  });

  it('pengguna tanpa sesi tidak bisa membaca pengaturan', async () => {
    await expectDataError(createRepositories(newClient(anonKey)).systemSettings.get(), 'forbidden');
  });

  it('Super Admin bisa mengubah profil dan hasilnya tipe domain', async () => {
    const updated = await user('super_admin').data.profiles.update(user('viewer').id, {
      fullName: 'Viewer Diubah',
    });
    expect(updated).toMatchObject({ fullName: 'Viewer Diubah', role: 'viewer', isActive: true });
  });

  it('GeoJSON bolak-balik ke kolom geometry tanpa perubahan', async () => {
    const center = { type: 'Point' as const, coordinates: [106.8273, -6.1755] as [number, number] };
    const { data, error } = await service
      .from('venues')
      .update({ center: geometryToColumn(center) })
      .eq('id', venueId)
      .select('center')
      .single();
    if (error) throw error;
    expect(geometryFromColumn(data.center)).toEqual(center);
  });
});
