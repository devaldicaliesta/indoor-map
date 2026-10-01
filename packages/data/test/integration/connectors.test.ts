import { randomUUID } from 'node:crypto';
import type { Position } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const AT: Position = [106.8273, -6.1753];

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

describe.runIf(url && anonKey && serviceKey)('konektor (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '';

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'operator') {
    const email = `${role}-${suffix}-${userIds.length}@connectors.test`;
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

  it('editor menyimpan keempat jenis konektor dengan pemberhentian yang benar', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Konektor ${suffix}`,
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
    const gf = await admin.floors.create(building.id, { name: 'GF', level: 0, heightM: 4 });
    const l1 = await admin.floors.create(building.id, { name: 'L1', level: 1, heightM: 4 });
    const l2 = await admin.floors.create(building.id, { name: 'L2', level: 2, heightM: 4 });
    const outdoor = await admin.buildings.outdoorLayer(venue.id);

    const editor = await signIn('editor');
    const base = { name: 'Uji', direction: null, accessible: true, position: AT } as const;
    const lift = randomUUID();
    const escalator = randomUUID();
    const stairs = randomUUID();
    const door = randomUUID();
    await editor.connectors.save(venue.id, {
      ...base,
      id: lift,
      kind: 'elevator',
      floorIds: [gf.id, l1.id, l2.id],
    });
    await editor.connectors.save(venue.id, {
      ...base,
      id: escalator,
      kind: 'escalator',
      direction: 'down',
      accessible: false,
      floorIds: [gf.id, l1.id],
    });
    await editor.connectors.save(venue.id, {
      ...base,
      id: stairs,
      kind: 'stairs',
      accessible: false,
      floorIds: [l1.id, l2.id],
    });
    const doorStops = await editor.connectors.save(venue.id, {
      ...base,
      id: door,
      kind: 'building_door',
      floorIds: [gf.id, outdoor.floorId],
    });
    expect(doorStops.map((s) => s.floorId).sort()).toEqual([gf.id, outdoor.floorId].sort());

    const listed = await editor.connectors.listByVenue(venue.id);
    const floorsOf = (id: string) =>
      (listed.find((c) => c.id === id)?.stops ?? []).map((s) => s.floorId).sort();
    expect(floorsOf(lift)).toEqual([gf.id, l1.id, l2.id].sort());
    expect(floorsOf(escalator)).toEqual([gf.id, l1.id].sort());
    expect(floorsOf(stairs)).toEqual([l1.id, l2.id].sort());
    expect(floorsOf(door)).toEqual([gf.id, outdoor.floorId].sort());
    expect(listed.find((c) => c.id === escalator)).toMatchObject({
      direction: 'down',
      accessible: false,
    });

    // Node pemberhentian terlihat di graf lantainya sebagai node konektor di posisi yang sama.
    const ground = await editor.navGraph.listByFloor(gf.id);
    const connectorNodes = Object.values(ground.nodes).filter((n) => n.role === 'connector');
    expect(connectorNodes).toHaveLength(3);
    for (const node of connectorNodes) {
      expect(node.coordinates[0]).toBeCloseTo(AT[0], 7);
      expect(node.coordinates[1]).toBeCloseTo(AT[1], 7);
    }

    // Eskalator tanpa arah ditolak dengan pesan dari server.
    await expect(
      editor.connectors.save(venue.id, {
        ...base,
        id: randomUUID(),
        kind: 'escalator',
        floorIds: [gf.id, l1.id],
      }),
    ).rejects.toMatchObject({ kind: 'conflict', message: 'Arah eskalator wajib dipilih.' });

    // Operator hanya membaca.
    const operator = await signIn('operator');
    expect(await operator.connectors.listByVenue(venue.id)).toHaveLength(4);
    await expect(operator.connectors.remove(lift)).rejects.toMatchObject({ kind: 'forbidden' });

    await editor.connectors.remove(lift);
    expect((await editor.connectors.listByVenue(venue.id)).map((c) => c.id)).not.toContain(lift);
    const after = await editor.navGraph.listByFloor(l2.id);
    expect(Object.values(after.nodes).filter((n) => n.role === 'connector')).toHaveLength(1);
  });
});
