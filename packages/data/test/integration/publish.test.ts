import { randomUUID } from 'node:crypto';
import type { VenueId } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Butuh Edge Function lokal (`supabase start` menjalankan edge runtime).
describe.runIf(url && anonKey && serviceKey)('publish minimal dan snapshot Visitor', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  const visitor = createRepositories(newDb(anonKey));
  let venueId = '' as VenueId;
  let admin: DataClient;
  let editor: DataClient;

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    await service.storage.from('snapshots').remove([`${venueId}/v1.json`, `${venueId}/v2.json`]);
    await service.storage.from('snapshots').remove([`${venueId}/latest.json`]);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor') {
    const email = `${role}-${suffix}@publish.test`;
    const created = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    const id = created.data.user?.id ?? '';
    userIds.push(id);
    await service
      .from('profiles')
      .insert({ user_id: id, full_name: `${role} ${suffix}`, email, role });
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return createRepositories(db);
  }

  beforeAll(async () => {
    admin = await signIn('admin');
    editor = await signIn('editor');
  });

  it('Editor ditolak server; Admin menerbitkan dan Visitor membacanya tanpa login', async () => {
    const venue = await admin.venues.create({
      name: `Publish ${suffix}`,
      address: 'Jl. Kenari 9, Jakarta',
      center: { type: 'Point', coordinates: [106.8272, -6.1754] },
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const building = await admin.buildings.create(venueId, {
      name: 'Gedung Utama',
      code: 'GU',
      footprint: null,
    });
    const floor = await admin.floors.create(building.id, { name: 'GF', level: 0, heightM: 4 });
    const unitId = randomUUID();
    await admin.features.save(venueId, {
      type: 'Feature',
      id: unitId,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.827123456789, -6.1754],
            [106.8272, -6.1754],
            [106.8272, -6.1755],
            [106.827123456789, -6.1754],
          ],
        ],
      },
      properties: { id: unitId, kind: 'unit', floorId: floor.id, unitCode: 'GU-GF-001' },
    });

    const denied = await editor.publications.publish(venueId).catch((e: unknown) => e);
    expect(denied).toBeInstanceOf(DataError);
    expect((denied as DataError).kind).toBe('forbidden');
    await expect(visitor.snapshots.latest(venueId)).rejects.toMatchObject({ kind: 'not_found' });

    // Unit tanpa titik masuk: Error validasi, publish ditolak tanpa memakai nomor versi.
    const findings = await editor.publications.validate(venueId);
    expect(findings).toContainEqual(
      expect.objectContaining({
        code: 'missing_entrance',
        severity: 'error',
        featureIds: [unitId],
      }),
    );
    await expect(admin.publications.publish(venueId)).rejects.toMatchObject({
      kind: 'invalid',
      message: expect.stringContaining('Publish dibatalkan'),
    });
    const path = randomUUID();
    const entrance = randomUUID();
    await admin.navGraph.apply(venueId, {
      saveNodes: [
        {
          id: path,
          floorId: floor.id,
          coordinates: [106.82718, -6.17542],
          role: 'path',
          featureId: null,
        },
        {
          id: entrance,
          floorId: floor.id,
          coordinates: [106.82716, -6.17542],
          role: 'entrance',
          featureId: unitId,
        },
      ],
      removeNodeIds: [],
      saveEdges: [
        {
          id: randomUUID(),
          floorId: floor.id,
          from: path,
          to: entrance,
          lengthM: 2.2,
          accessible: true,
        },
      ],
      removeEdgeIds: [],
    });
    expect(
      (await admin.publications.validate(venueId)).filter((f) => f.severity === 'error'),
    ).toEqual([]);

    const result = await admin.publications.publish(venueId);
    expect(result.version).toBe(1);

    const snapshot = await visitor.snapshots.latest(venueId);
    expect(snapshot.version).toBe(1);
    expect(snapshot.venue.name).toBe(`Publish ${suffix}`);
    expect(snapshot.features.features.map((f) => f.properties.unitCode)).toEqual(['GU-GF-001']);
    const geometry = snapshot.features.features[0]?.geometry;
    expect(geometry?.type === 'Polygon' ? geometry.coordinates[0]?.[0] : null).toEqual([
      106.8271235, -6.1754,
    ]);
    // Graf diterbitkan terpisah; latest.json hanya merujuknya.
    expect(snapshot.graph.nodes).toEqual([]);
    expect(snapshot.graphPath).toBe('v1.graph.json');
    const graph = await visitor.snapshots.graph(venueId, snapshot.graphPath ?? '');
    expect(Array.isArray(graph.nodes)).toBe(true);
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain('Jl. Kenari');
    expect(json).not.toContain('@publish.test');

    expect(await admin.publications.active(venueId)).toMatchObject({
      version: 1,
      publisherName: `admin ${suffix}`,
    });
  });

  it('perubahan draft tidak terlihat di Visitor sampai publish berikutnya', async () => {
    await admin.venues.update(venueId, {
      name: `Publish ${suffix} baru`,
      address: 'Jl. Kenari 9, Jakarta',
      center: { type: 'Point', coordinates: [106.8272, -6.1754] },
      timezone: 'Asia/Jakarta',
    });
    expect((await visitor.snapshots.latest(venueId)).venue.name).toBe(`Publish ${suffix}`);

    expect((await admin.publications.publish(venueId)).version).toBe(2);
    const snapshot = await visitor.snapshots.latest(venueId);
    expect(snapshot.version).toBe(2);
    expect(snapshot.venue.name).toBe(`Publish ${suffix} baru`);
  });

  it('venue yang dihapus tidak lagi bisa dibuka Visitor', async () => {
    await admin.venues.remove(venueId);
    await expect(visitor.snapshots.latest(venueId)).rejects.toMatchObject({ kind: 'not_found' });
  });
});
