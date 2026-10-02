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
// PNG 1x1 piksel.
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function kindOf(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(DataError);
  return (error as DataError).kind;
}

describe.runIf(url && anonKey && serviceKey)('venue (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const users: string[] = [];
  const venues: string[] = [];

  async function as(role: 'admin' | 'editor') {
    const email = `${role}-${suffix}-${users.length}@venues.test`;
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
    return { db, data: createRepositories(db) };
  }

  afterAll(async () => {
    for (const id of venues) await service.from('venues').delete().eq('id', id);
    for (const id of users) await service.auth.admin.deleteUser(id);
  });

  it('Admin membuat venue dengan semua atribut; Area Luar dibuat otomatis', async () => {
    const admin = await as('admin');
    const venue = await admin.data.venues.create({
      name: `RS Uji ${suffix}`,
      address: 'Jl. Uji 1',
      center: { type: 'Point', coordinates: [119.4221, -5.1477] },
      timezone: 'Asia/Makassar',
    });
    venues.push(venue.id);
    expect(venue).toMatchObject({
      address: 'Jl. Uji 1',
      timezone: 'Asia/Makassar',
      venueType: 'custom',
      center: { coordinates: [119.4221, -5.1477] },
    });
    const floors = await admin.db
      .from('floors')
      .select('name, is_outdoor')
      .eq('venue_id', venue.id);
    expect(floors.data).toEqual([{ name: 'Area Luar', is_outdoor: true }]);

    const withLogo = await admin.data.venues.uploadLogo(
      venue.id,
      new Blob([PNG], { type: 'image/png' }),
    );
    expect(withLogo.logoPath).toMatch(new RegExp(`^venues/${venue.id}/logo-\\d+\\.png$`));
    const logoUrl = admin.data.venues.logoUrl(withLogo.logoPath ?? '');
    expect((await fetch(logoUrl)).status).toBe(200);

    expect((await admin.data.venues.removeLogo(venue.id)).logoPath).toBeNull();
    expect((await fetch(logoUrl)).ok).toBe(false);
  });

  it('data dua venue terpisah', async () => {
    const admin = await as('admin');
    const a = await admin.data.venues.create({
      name: `A ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    const b = await admin.data.venues.create({
      name: `B ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venues.push(a.id, b.id);
    const floorsA = await admin.db.from('floors').select('id, venue_id').eq('venue_id', a.id);
    expect(floorsA.data?.every((f) => f.venue_id === a.id)).toBe(true);
    const types = await admin.db
      .from('location_types')
      .select('venue_id')
      .in('venue_id', [a.id, b.id]);
    expect(new Set(types.data?.map((t) => t.venue_id))).toEqual(new Set([a.id, b.id]));
  });

  it('Editor tidak bisa membuat, mengubah, atau menghapus venue', async () => {
    const admin = await as('admin');
    const venue = await admin.data.venues.create({
      name: `E ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venues.push(venue.id);
    const editor = await as('editor');
    expect(
      await kindOf(
        editor.data.venues.create({
          name: 'X',
          address: null,
          center: null,
          timezone: 'Asia/Jakarta',
        }),
      ),
    ).toBe('forbidden');
    expect(
      await kindOf(
        editor.data.venues.update(venue.id, {
          name: 'X',
          address: null,
          center: null,
          timezone: 'Asia/Jakarta',
        }),
      ),
    ).toBe('forbidden');
    expect(await kindOf(editor.data.venues.remove(venue.id))).toBe('forbidden');
    expect(
      await kindOf(editor.data.venues.uploadLogo(venue.id, new Blob([PNG], { type: 'image/png' }))),
    ).toBe('forbidden');
    expect(await kindOf(editor.data.venues.removeLogo(venue.id))).toBe('forbidden');
  });

  it('hapus venue menghapus data turunannya', async () => {
    const admin = await as('admin');
    const venue = await admin.data.venues.create({
      name: `H ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    await admin.data.venues.remove(venue.id);
    const floors = await service.from('floors').select('id').eq('venue_id', venue.id);
    expect(floors.data).toEqual([]);
    expect(await kindOf(admin.data.venues.get(venue.id))).toBe('not_found');
  });
});
