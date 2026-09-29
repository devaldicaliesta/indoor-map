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
const square = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [106.8, -6.1],
      [106.801, -6.1],
      [106.801, -6.101],
      [106.8, -6.101],
      [106.8, -6.1],
    ],
  ] as [number, number][][],
};

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

describe.runIf(url && anonKey && serviceKey)('gedung (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const users: string[] = [];
  const venues: string[] = [];

  async function as(role: 'admin' | 'editor') {
    const email = `${role}-${suffix}-${users.length}@buildings.test`;
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    users.push(data.user.id);
    await service.from('profiles').insert({ user_id: data.user.id, full_name: role, email, role });
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return createRepositories(db);
  }

  afterAll(async () => {
    for (const id of venues) await service.from('venues').delete().eq('id', id);
    for (const id of users) await service.auth.admin.deleteUser(id);
  });

  it('tambah, ubah, gedung default, kode unik per venue', async () => {
    const admin = await as('admin');
    const venue = await admin.venues.create({
      name: `Gedung ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venues.push(venue.id);

    const main = await admin.buildings.create(venue.id, {
      name: 'Gedung Utama',
      code: 'gu',
      footprint: square,
    });
    expect(main).toMatchObject({ code: 'GU', floorCount: 0, footprint: square });

    const duplicate = await admin.buildings
      .create(venue.id, { name: 'Lain', code: 'GU', footprint: null })
      .catch((e: unknown) => e);
    expect(duplicate).toBeInstanceOf(DataError);
    expect((duplicate as DataError).message).toBe(
      'Kode GU sudah dipakai gedung lain di venue ini.',
    );

    const other = await admin.venues.create({
      name: `Lain ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venues.push(other.id);
    await expect(
      admin.buildings.create(other.id, { name: 'Gedung Utama', code: 'GU', footprint: null }),
    ).resolves.toMatchObject({ code: 'GU' });

    const renamed = await admin.buildings.update(main.id, {
      name: 'Gedung Pusat',
      code: 'GP',
      footprint: null,
    });
    expect(renamed).toMatchObject({ name: 'Gedung Pusat', code: 'GP', footprint: null });

    await admin.buildings.setDefault(venue.id, main.id);
    expect((await admin.venues.get(venue.id)).defaultBuildingId).toBe(main.id);

    expect((await admin.buildings.outdoorLayer(venue.id)).name).toBe('Area Luar');
    await admin.buildings.remove(main.id);
    expect(await admin.buildings.list(venue.id)).toEqual([]);
  });

  it('Editor tidak bisa menambah atau menghapus gedung', async () => {
    const admin = await as('admin');
    const venue = await admin.venues.create({
      name: `Ed ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venues.push(venue.id);
    const building = await admin.buildings.create(venue.id, {
      name: 'A',
      code: 'A',
      footprint: null,
    });
    const editor = await as('editor');
    await expect(
      editor.buildings.create(venue.id, { name: 'B', code: 'B', footprint: null }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(editor.buildings.remove(building.id)).rejects.toMatchObject({ kind: 'forbidden' });
  });
});
