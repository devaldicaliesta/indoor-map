import { randomUUID } from 'node:crypto';
import type { FloorId } from '@indoor/domain';
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

describe.runIf(url && anonKey && serviceKey)('fitur draft (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '';

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor') {
    const email = `${role}-${suffix}-${userIds.length}@features.test`;
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

  it('editor menyimpan poligon, garis, titik dengan koordinat utuh; anon tidak melihat draft', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Fitur ${suffix}`,
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
    const floor = await admin.floors.create(building.id, { name: 'GF', level: 0, heightM: 4 });
    const floorId: FloorId = floor.id;

    const editor = await signIn('editor');
    const unitId = randomUUID();
    const ring: [number, number][] = [
      [106.8271, -6.1753],
      [106.82728, -6.1753],
      [106.82728, -6.17548],
      [106.8271, -6.17548],
      [106.8271, -6.1753],
    ];
    await editor.features.save(venue.id, {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: { id: unitId, kind: 'unit', floorId, unitCode: `G-GF-001` },
    });
    const wallId = randomUUID();
    await editor.features.save(venue.id, {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [ring[0] as [number, number], ring[1] as [number, number]],
      },
      properties: { id: wallId, kind: 'wall', floorId },
    });
    const doorId = randomUUID();
    await editor.features.save(venue.id, {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [106.82719, -6.1753] },
      properties: { id: doorId, kind: 'door', floorId },
    });
    // Simpan ulang = timpa (upsert), bukan baris baru.
    await editor.features.save(venue.id, {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [106.8272, -6.1753] },
      properties: { id: doorId, kind: 'door', floorId },
    });

    const listed = await editor.features.listByFloor(floorId);
    const byId = new Map(listed.features.map((f) => [f.properties.id, f]));
    expect(listed.features).toHaveLength(3);
    expect(byId.get(unitId)?.geometry).toEqual({ type: 'Polygon', coordinates: [ring] });
    expect(byId.get(doorId)?.geometry).toEqual({ type: 'Point', coordinates: [106.8272, -6.1753] });
    const { data: row } = await service
      .from('features')
      .select('area_m2')
      .eq('id', unitId)
      .single();
    expect(Number(row?.area_m2)).toBeGreaterThan(390);
    expect(Number(row?.area_m2)).toBeLessThan(410);

    await editor.features.remove(wallId);
    await editor.features.remove(randomUUID());
    expect((await editor.features.listByFloor(floorId)).features).toHaveLength(2);

    // Kode unit bentrok tanpa membedakan huruf besar/kecil; pemiliknya bisa disebut.
    const clash = await editor.features.findUnitCode(venue.id, 'g-gf-001', randomUUID());
    expect(clash).toMatchObject({
      id: unitId,
      unitCode: 'G-GF-001',
      floorName: 'GF',
      buildingName: 'G',
    });
    expect(await editor.features.findUnitCode(venue.id, 'g-gf-001', unitId)).toBeNull();
    expect(await editor.features.findUnitCode(venue.id, 'G_GF%001', randomUUID())).toBeNull();
    await expect(
      editor.features.save(venue.id, {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [ring] },
        properties: { id: randomUUID(), kind: 'unit', floorId, unitCode: 'g-gf-001' },
      }),
    ).rejects.toMatchObject({ kind: 'conflict' });

    // Luas koreksi manual dan subjenis area luar bertahan setelah dibaca ulang.
    await editor.features.save(venue.id, {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: { id: unitId, kind: 'unit', floorId, unitCode: 'G-GF-001', areaM2: 350.5 },
    });
    const parkId = randomUUID();
    await editor.features.save(venue.id, {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: { id: parkId, kind: 'outdoor_area', floorId, subtype: 'parking' },
    });
    const reread = new Map(
      (await editor.features.listByFloor(floorId)).features.map((f) => [
        f.properties.id,
        f.properties,
      ]),
    );
    expect(reread.get(unitId)?.areaM2).toBe(350.5);
    expect(reread.get(parkId)?.subtype).toBe('parking');

    const { data: anonRows } = await newDb(anonKey)
      .from('features')
      .select('id')
      .eq('floor_id', floorId);
    expect(anonRows ?? []).toEqual([]);
  });

  it('lantai dengan lebih dari 1.000 fitur dimuat utuh (melewati max_rows PostgREST)', async () => {
    const floor = await service
      .from('floors')
      .select('id')
      .eq('venue_id', venueId)
      .eq('is_outdoor', true)
      .single();
    const floorId = floor.data?.id as FloorId;
    const rows = Array.from({ length: 1001 }, (_, i) => ({
      venue_id: venueId,
      floor_id: floorId,
      kind: 'door' as const,
      geom: { type: 'Point', coordinates: [106.827 + i * 1e-6, -6.175] },
    }));
    const inserted = await service.from('features').insert(rows);
    expect(inserted.error).toBeNull();
    const admin = await signIn('admin');
    const listed = await admin.features.listByFloor(floorId);
    expect(listed.features).toHaveLength(1001);
    expect(new Set(listed.features.map((f) => f.properties.id)).size).toBe(1001);
  });
});
