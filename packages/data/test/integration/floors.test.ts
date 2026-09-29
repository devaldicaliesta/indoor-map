import { randomUUID } from 'node:crypto';
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

describe.runIf(url && anonKey && serviceKey)('lantai (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  let userId = '';
  let venueId = '';

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    if (userId) await service.auth.admin.deleteUser(userId);
  });

  it('level negatif terurut di bawah GF; jumlah fitur; lantai default; Area Luar tidak dihitung', async () => {
    const email = `admin-${suffix}@floors.test`;
    const created = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    userId = created.data.user?.id ?? '';
    await service
      .from('profiles')
      .insert({ user_id: userId, full_name: 'Admin', email, role: 'admin' });
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    const data = createRepositories(db);

    const venue = await data.venues.create({
      name: `Lantai ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const building = await data.buildings.create(venue.id, {
      name: 'Gedung',
      code: 'G',
      footprint: null,
    });
    const gf = await data.floors.create(building.id, { name: 'GF', level: 0, heightM: 4.5 });
    await data.floors.create(building.id, { name: 'B1', level: -1, heightM: 3 });
    await data.floors.create(building.id, { name: 'L1', level: 1, heightM: 4 });
    expect((await data.floors.list(building.id)).map((f) => f.name)).toEqual(['L1', 'GF', 'B1']);
    expect((await data.buildings.list(venue.id))[0]?.floorCount).toBe(3);

    await service.from('features').insert({
      venue_id: venue.id,
      floor_id: gf.id,
      kind: 'wall',
      geom: 'SRID=4326;LINESTRING(106.8 -6.1, 106.81 -6.1)',
    });
    expect((await data.floors.list(building.id)).find((f) => f.id === gf.id)?.featureCount).toBe(1);

    await data.floors.setDefault(building.id, gf.id);
    expect((await data.buildings.list(venue.id))[0]?.defaultFloorId).toBe(gf.id);

    await data.floors.remove(gf.id);
    expect((await data.floors.list(building.id)).map((f) => f.name)).toEqual(['L1', 'B1']);
    const features = await service.from('features').select('id').eq('floor_id', gf.id);
    expect(features.data).toEqual([]);
  });
});
