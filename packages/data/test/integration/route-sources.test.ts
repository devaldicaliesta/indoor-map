import { randomUUID } from 'node:crypto';
import { INSTRUCTION_ACTIONS } from '@indoor/domain';
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

const square = (x: number) => ({
  type: 'Polygon' as const,
  coordinates: [
    [
      [x, -6.1753],
      [x + 0.0001, -6.1753],
      [x + 0.0001, -6.1754],
      [x, -6.1754],
      [x, -6.1753],
    ] as [number, number][],
  ],
});

describe.runIf(url && anonKey && serviceKey)('sumber uji rute (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '';

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'viewer') {
    const email = `${role}-${suffix}-${userIds.length}@route-sources.test`;
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

  it('viewer membaca fitur semua lantai, QR titik asal, Info Point, dan template draft', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Uji rute ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const building = await admin.buildings.create(venue.id, {
      name: 'G',
      code: 'G',
      footprint: null,
    });
    const ground = await admin.floors.create(building.id, { name: 'GF', level: 0, heightM: 4 });
    const upper = await admin.floors.create(building.id, { name: 'L1', level: 1, heightM: 4 });
    const outdoor = await admin.buildings.outdoorLayer(venue.id);
    const unitIds = [randomUUID(), randomUUID(), randomUUID()];
    const floors = [ground.id, upper.id, outdoor.floorId];
    for (const [i, id] of unitIds.entries()) {
      await admin.features.save(venue.id, {
        type: 'Feature',
        id,
        geometry: square(106.827 + i * 0.0002),
        properties: { id, kind: 'unit', floorId: floors[i] ?? '', unitCode: `U-${i}` },
      });
    }
    await service.from('origin_points').insert({
      venue_id: venue.id,
      floor_id: ground.id,
      name: 'Lobi',
      geom: 'SRID=4326;POINT(106.8271 -6.17535)',
      heading_deg: 90,
      public_code: `qr${suffix}`,
    });
    await service.from('info_points').insert({
      venue_id: venue.id,
      floor_id: upper.id,
      code: 'IP-1',
      name: 'Kios Info',
      geom: 'SRID=4326;POINT(106.8272 -6.17535)',
      heading_deg: 180,
    });

    const viewer = await signIn('viewer');
    const features = await viewer.features.listByVenue(venue.id);
    expect(features.features.map((f) => f.properties.id).sort()).toEqual([...unitIds].sort());
    expect(new Set(features.features.map((f) => f.properties.floorId))).toEqual(new Set(floors));

    expect(await viewer.originPoints.list(venue.id)).toEqual([
      {
        id: expect.any(String),
        floorId: ground.id,
        name: 'Lobi',
        coordinates: [106.8271, -6.17535],
        headingDeg: 90,
        nodeId: null,
        code: `qr${suffix}`,
      },
    ]);
    expect(await viewer.infoPoints.list(venue.id)).toMatchObject([
      { code: 'IP-1', name: 'Kios Info', floorId: upper.id, coordinates: [106.8272, -6.17535] },
    ]);

    // Venue baru mendapat 15 template bawaan dari trigger.
    const templates = await viewer.instructionTemplates.get(venue.id);
    expect(Object.keys(templates).sort()).toEqual([...INSTRUCTION_ACTIONS].sort());
    expect(templates.elevator_up).toEqual({
      id: 'Naik lift ke {floor}',
      en: 'Take the elevator up to {floor}',
    });

    // Pengunjung (anon) tidak membaca draft.
    const anon = createRepositories(newDb(anonKey));
    expect(await anon.originPoints.list(venue.id)).toEqual([]);
    expect((await anon.features.listByVenue(venue.id)).features).toEqual([]);
  });
});
