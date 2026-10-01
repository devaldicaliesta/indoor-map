import { randomUUID } from 'node:crypto';
import { addPath, applyGraphPatch, type GraphPatch, type NavGraph } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const HOUR = 3_600_000;

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const saveAll = (patch: GraphPatch) => ({
  saveNodes: patch.nodes.flatMap((c) => (c.after ? [c.after] : [])),
  removeNodeIds: [],
  saveEdges: patch.edges.flatMap((c) => (c.after ? [c.after] : [])),
  removeEdgeIds: [],
});

describe.runIf(url && anonKey && serviceKey)('graf venue dan penutupan (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '';

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'viewer') {
    const email = `${role}-${suffix}-${userIds.length}@closures.test`;
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

  it('graf semua lantai dimuat sekaligus; penutupan yang sudah berakhir tidak ikut', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Penutupan ${suffix}`,
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

    const editor = await signIn('editor');
    const empty: NavGraph = { nodes: {}, edges: {} };
    const line = (lat: number): [number, number][] => [
      [106.8271, lat],
      [106.8275, lat],
    ];
    const onGround = addPath(empty, line(-6.1753), { floorId: ground.id, newId: randomUUID });
    const onUpper = addPath(empty, line(-6.1754), { floorId: upper.id, newId: randomUUID });
    await editor.navGraph.apply(venue.id, saveAll(onGround));
    await editor.navGraph.apply(venue.id, saveAll(onUpper));
    const whole = applyGraphPatch(applyGraphPatch(empty, onGround), onUpper);

    const viewer = await signIn('viewer');
    expect(await viewer.navGraph.listByVenue(venue.id)).toEqual(whole);

    const [edgeId = ''] = Object.keys(applyGraphPatch(empty, onGround).edges);
    const now = Date.now();
    const at = (offsetHours: number) => new Date(now + offsetHours * HOUR).toISOString();
    const insert = (reason: string, startsAt: string, endsAt: string | null) => ({
      venue_id: venue.id,
      edge_id: edgeId,
      reason,
      starts_at: startsAt,
      ends_at: endsAt,
    });
    const { error } = await service
      .from('closures')
      .insert([
        insert('berlaku', at(-1), at(1)),
        insert('tanpa akhir', at(-2), null),
        insert('terjadwal', at(2), at(3)),
        insert('selesai', at(-3), at(-1)),
      ]);
    expect(error).toBeNull();

    const reasons = (list: { reason: string }[]) => list.map((c) => c.reason).sort();
    expect(reasons(await viewer.closures.listCurrent(venue.id, new Date(now)))).toEqual([
      'berlaku',
      'tanpa akhir',
      'terjadwal',
    ]);
    // Pengunjung (anon) hanya membaca penutupan yang sedang berlaku (RLS).
    const anon = createRepositories(newDb(anonKey));
    expect(reasons(await anon.closures.listCurrent(venue.id, new Date(now)))).toEqual([
      'berlaku',
      'tanpa akhir',
    ]);
  });
});
