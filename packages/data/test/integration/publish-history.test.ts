import { randomUUID } from 'node:crypto';
import type { LocationId, SnapshotSource, VenueId } from '@indoor/domain';
import { mallVenue } from '@indoor/domain/fixtures/demo-venues/index.ts';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';
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

// Butuh Edge Function lokal (`supabase start` menjalankan edge runtime).
describe.runIf(url && anonKey && serviceKey)('publish berversi, riwayat, rollback', () => {
  const service = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  const visitor = createRepositories(newDb());
  let venueId = '' as VenueId;
  let removedLocation = '' as LocationId;
  let admin: DataClient;
  let editor: DataClient;

  async function signIn(role: 'super_admin' | 'editor') {
    const email = `${role}-${suffix}@history.test`;
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
    admin = superAdmin.data;
    editor = (await signIn('editor')).data;
    const source = mallVenue();
    const inserted = await insertVenue(
      superAdmin.db,
      `Riwayat ${suffix}`,
      source,
      centerOf(source),
    );
    venueId = inserted.venueId as VenueId;
    const [first] = source.locations;
    if (!first) throw new Error('venue demo tanpa lokasi');
    removedLocation = inserted.remap(first.id) as LocationId;
  }, 120_000);

  afterAll(async () => {
    if (venueId) {
      const files = ['latest', 'v1', 'v2', 'v3'].map((f) => `${venueId}/${f}.json`);
      await service.storage.from('snapshots').remove(files);
      await service.from('venues').delete().eq('id', venueId);
    }
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it('validasi + publish venue contoh (mal) selesai dalam 60 detik', {
    timeout: 90_000,
  }, async () => {
    const started = performance.now();
    const findings = await admin.publications.validate(venueId);
    expect(findings.filter((f) => f.severity === 'error')).toEqual([]);
    const result = await admin.publications.publish(venueId, 'Rilis awal mal');
    const seconds = (performance.now() - started) / 1000;
    expect(result.version).toBe(1);
    expect(seconds).toBeLessThanOrEqual(60);
  });

  it('Editor tidak bisa publish maupun rollback', async () => {
    const publish = await editor.publications.publish(venueId).catch((e: unknown) => e);
    expect(publish).toBeInstanceOf(DataError);
    expect((publish as DataError).kind).toBe('forbidden');
    const rollback = await editor.publications.rollback(venueId, 1).catch((e: unknown) => e);
    expect(rollback).toBeInstanceOf(DataError);
    expect((rollback as DataError).kind).toBe('forbidden');
  });

  it('rollback mengaktifkan isi versi lama sebagai versi baru; draft tetap', {
    timeout: 90_000,
  }, async () => {
    await admin.locations.remove(removedLocation);
    expect((await admin.publications.publish(venueId, 'Hapus satu lokasi')).version).toBe(2);
    expect(
      (await visitor.snapshots.latest(venueId)).locations.some((l) => l.id === removedLocation),
    ).toBe(false);

    const result = await admin.publications.rollback(venueId, 1, 'Kembali ke rilis awal');
    expect(result.version).toBe(3);
    const latest = await visitor.snapshots.latest(venueId);
    expect(latest.version).toBe(3);
    expect(latest.locations.some((l) => l.id === removedLocation)).toBe(true);

    const history = await admin.publications.history(venueId);
    expect(
      history.map(({ version, notes, origin, sourceVersion, isActive }) => ({
        version,
        notes,
        origin,
        sourceVersion,
        isActive,
      })),
    ).toEqual([
      {
        version: 3,
        notes: 'Kembali ke rilis awal',
        origin: 'rollback',
        sourceVersion: 1,
        isActive: true,
      },
      {
        version: 2,
        notes: 'Hapus satu lokasi',
        origin: 'publish',
        sourceVersion: null,
        isActive: false,
      },
      {
        version: 1,
        notes: 'Rilis awal mal',
        origin: 'publish',
        sourceVersion: null,
        isActive: false,
      },
    ]);
    expect(history.every((h) => h.publisherName)).toBe(true);

    // Draft tidak ikut kembali: lokasi yang dihapus tetap tidak ada di draft.
    const changes = await admin.publications.changes(venueId);
    expect(changes.locations.removed.map((l) => l.id)).toEqual([removedLocation]);

    const invalid = await admin.publications.rollback(venueId, 3).catch((e: unknown) => e);
    expect(invalid).toBeInstanceOf(DataError);
    expect((invalid as DataError).kind).toBe('not_found');
  });
});
