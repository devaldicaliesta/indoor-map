import { randomUUID } from 'node:crypto';
import type { SnapshotSource, VenueId } from '@indoor/domain';
import { snapshotToGeoJson, snapshotToImdf, validateImdf } from '@indoor/domain/export';
import { hospitalVenue } from '@indoor/domain/fixtures/demo-venues/index.ts';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { insertVenue } from '../support/full-venue';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newDb = () =>
  createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const centerOf = (source: SnapshotSource): [number, number] => {
  const ring = source.buildings[0]?.footprint?.coordinates[0] ?? [];
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

// Butuh Edge Function `publish` lokal (`supabase start`).
describe.runIf(url && anonKey && serviceKey)('export GeoJSON dan IMDF versi aktif', () => {
  const service = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '' as VenueId;
  let admin: DataClient;

  async function signIn(role: 'admin' | 'super_admin') {
    const email = `${role}-${suffix}@export.test`;
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
    const db = newDb();
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return { db, data: createRepositories(db) };
  }

  beforeAll(async () => {
    const superAdmin = await signIn('super_admin');
    admin = (await signIn('admin')).data;
    const source = hospitalVenue();
    const inserted = await insertVenue(superAdmin.db, `Export ${suffix}`, source, centerOf(source));
    venueId = inserted.venueId as VenueId;
  }, 120_000);

  afterAll(async () => {
    if (venueId) {
      await service.storage
        .from('snapshots')
        .remove(['latest', 'v1', 'v1.graph'].map((f) => `${venueId}/${f}.json`));
      await service.from('venues').delete().eq('id', venueId);
    }
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it('belum terbit: tidak ada snapshot untuk diekspor', async () => {
    expect(await admin.publications.activeSnapshot(venueId)).toBeNull();
  });

  it('TC-OPS-12/13: snapshot aktif lengkap dengan graf, GeoJSON sama, IMDF lolos validator', {
    timeout: 120_000,
  }, async () => {
    await admin.publications.publish(venueId, 'Rilis untuk export');
    const snapshot = await admin.publications.activeSnapshot(venueId);
    if (!snapshot) throw new Error('snapshot aktif tidak terbaca');
    expect(snapshot.version).toBe(1);
    expect(snapshot.graph.edges.length).toBeGreaterThan(0);

    const geojson = snapshotToGeoJson(snapshot) as Record<string, { features: unknown[] }>;
    expect(geojson['features.geojson']).toEqual(snapshot.features);
    expect(geojson['graph.geojson']?.features).toHaveLength(
      snapshot.graph.nodes.length + snapshot.graph.edges.length + snapshot.graph.connectors.length,
    );

    const { files } = await snapshotToImdf({
      snapshot,
      venueType: 'hospital',
      address: {
        address: 'Jl. Kesehatan 1',
        locality: 'Jakarta Pusat',
        province: 'ID-JK',
        country: 'ID',
        postalCode: null,
      },
      createdAt: new Date().toISOString(),
    });
    expect(validateImdf(JSON.parse(JSON.stringify(files)))).toEqual([]);
  });
});
