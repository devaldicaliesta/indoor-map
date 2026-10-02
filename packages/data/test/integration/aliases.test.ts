import { randomUUID } from 'node:crypto';
import { EMPTY_OPENING_HOURS, type VenueId } from '@indoor/domain';
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

describe.runIf(url && anonKey && serviceKey)('alias pencarian (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '' as VenueId;

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'viewer') {
    const email = `${role}-${suffix}-${userIds.length}@aliases.test`;
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

  it('Editor mengganti alias lokasi; alias lama terhapus; sasaran venue lain ditolak', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Alias ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const [type] = await admin.locationTypes.list(venue.id);
    if (!type) throw new Error('tipe bawaan tidak ada');
    const editor = await signIn('editor');
    const id = await editor.locations.save(
      venue.id,
      type.id,
      null,
      {
        code: '',
        name: 'Radiologi',
        description: '',
        categoryIds: [],
        unitIds: [],
        primaryUnitId: null,
        customFields: {},
        status: 'active',
        openingDate: null,
        hours: EMPTY_OPENING_HOURS,
      },
      { keepPhotoPaths: [], newPhotos: [] },
    );
    const target = { kind: 'location' as const, id };
    await editor.aliases.set(venue.id, target, ['rontgen', 'X-Ray']);
    await editor.aliases.set(venue.id, target, ['rontgen', 'foto thorax']);
    expect((await editor.aliases.listByVenue(venue.id)).get(`location:${id}`)).toEqual([
      'foto thorax',
      'rontgen',
    ]);
    const other = await admin.venues.create({
      name: `Alias lain ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    await expect(editor.aliases.set(other.id, target, ['x'])).rejects.toBeTruthy();
    await service.from('venues').delete().eq('id', other.id);
  });
});
