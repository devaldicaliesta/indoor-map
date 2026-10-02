import { randomUUID } from 'node:crypto';
import type { VenueId } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

describe.runIf(url && anonKey && serviceKey)('pengaturan tampilan (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '' as VenueId;

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor') {
    const email = `${role}-${suffix}@display.test`;
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

  it('default dari trigger venue, Admin menyimpan tinggi/warna/mode/kamera, Editor hanya membaca', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Tampilan ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    expect(await admin.displaySettings.get(venue.id)).toEqual({
      venueId: venue.id,
      defaultMode: '2d',
      heights: { unit: 4, wall: 5, corridor: 0, outdoor_area: 0 },
      colors: {},
      camera: null,
      branding: { displayName: null, primaryColor: null, routeColor: null },
    });

    const camera = {
      center: [106.8272, -6.1754] as [number, number],
      zoom: 18.5,
      pitch: 50,
      bearing: 20,
    };
    const saved = await admin.displaySettings.update(venue.id, {
      defaultMode: '3d',
      heights: { unit: 6, wall: 5 },
      colors: { unit: '#ffe9a8' },
      camera,
    });
    expect(saved).toMatchObject({ defaultMode: '3d', heights: { unit: 6, wall: 5 }, camera });

    const editor = await signIn('editor');
    expect((await editor.displaySettings.get(venue.id)).heights.unit).toBe(6);
    await expect(
      editor.displaySettings.update(venue.id, { defaultMode: '2d' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });

    expect((await admin.displaySettings.update(venue.id, { camera: null })).camera).toBeNull();

    const branding = { displayName: 'RS Kenari', primaryColor: '#0b1f4d', routeColor: null };
    expect((await admin.displaySettings.update(venue.id, { branding })).branding).toEqual(branding);
    expect((await editor.displaySettings.get(venue.id)).branding).toEqual(branding);
    await expect(
      editor.displaySettings.update(venue.id, {
        branding: { ...branding, displayName: 'Bukan Editor' },
      }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
  });
});
