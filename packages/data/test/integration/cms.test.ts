import { randomUUID } from 'node:crypto';
import {
  EMPTY_OPENING_HOURS,
  type LocationId,
  type LocationInput,
  type LocationStatus,
  type LocationTypeId,
  type VenueId,
} from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import type { LocationPageFilters } from '../../src/repositories/locations';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const png = () => new Blob([PNG], { type: 'image/png' });

const NO_FILTERS: LocationPageFilters = {
  statuses: [],
  categoryId: null,
  typeId: null,
  building: null,
  floorId: null,
  unlinkedOnly: false,
};

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const input = (patch: Partial<LocationInput>): LocationInput => ({
  code: '',
  name: 'Lokasi',
  description: '',
  customFields: {},
  status: 'active',
  openingDate: null,
  hours: EMPTY_OPENING_HOURS,
  categoryIds: [],
  unitIds: [],
  primaryUnitId: null,
  ...patch,
});

describe.runIf(url && anonKey && serviceKey)('penguatan CMS (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '' as VenueId;
  let typeId = '' as LocationTypeId;

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'operator' | 'viewer'): Promise<DataClient> {
    const email = `${role}-${suffix}-${userIds.length}@cms.test`;
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

  async function countWhere(status: LocationStatus) {
    const { count } = await service
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('status', status);
    return count ?? 0;
  }

  it('menyiapkan venue dengan 100 lokasi', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `CMS ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const type = await service
      .from('location_types')
      .insert({ venue_id: venueId, name: 'Ruang' })
      .select('id')
      .single();
    typeId = (type.data?.id ?? '') as LocationTypeId;
    const rows = Array.from({ length: 100 }, (_, i) => ({
      venue_id: venueId,
      location_type_id: typeId,
      name: `Ruang ${String(i + 1).padStart(3, '0')}`,
    }));
    const { error } = await service.from('locations').insert(rows);
    expect(error).toBeNull();
  });

  it('TC-PAR-09: status 100 lokasi dari "pilih semua hasil", tercatat di audit, lalu undo', async () => {
    const editor = await signIn('editor');
    const ids = await editor.locations.ids(venueId, 'ruang', NO_FILTERS);
    expect(ids).toHaveLength(100);

    const edit = await editor.locationBulkEdits.apply(venueId, ids, {
      kind: 'status',
      status: 'inactive_temporary',
      openingDate: null,
    });
    expect(edit.locationCount).toBe(100);
    expect(await countWhere('inactive_temporary')).toBe(100);

    const audit = await service
      .from('audit_events')
      .select('action, details')
      .eq('entity_id', edit.id)
      .single();
    expect(audit.data).toMatchObject({ action: 'location_bulk_edit', details: { count: 100 } });
    expect((await editor.locationBulkEdits.latest(venueId))?.id).toBe(edit.id);

    expect(await editor.locationBulkEdits.undo(edit.id)).toBe(100);
    expect(await countWhere('active')).toBe(100);
    expect((await editor.locationBulkEdits.latest(venueId))?.undoneAt).not.toBeNull();
    await expect(editor.locationBulkEdits.undo(edit.id)).rejects.toMatchObject({
      message: 'Edit massal ini sudah diurungkan.',
    });
  });

  it('TC-SEC-78: Operator dan Viewer tidak bisa edit massal', async () => {
    const ids = (await service.from('locations').select('id').eq('venue_id', venueId)).data?.map(
      (r) => r.id as LocationId,
    );
    for (const role of ['operator', 'viewer'] as const) {
      const client = await signIn(role);
      await expect(
        client.locationBulkEdits.apply(venueId, ids ?? [], {
          kind: 'status',
          status: 'inactive_permanent',
          openingDate: null,
        }),
      ).rejects.toMatchObject({ kind: 'forbidden' });
    }
    expect(await countWhere('inactive_permanent')).toBe(0);
  });

  it('TC-PAR-10: dasbor sama dengan data sebenarnya', async () => {
    await service
      .from('locations')
      .update({ status: 'coming_soon', opening_date: '2027-01-01' })
      .eq('venue_id', venueId)
      .in('name', ['Ruang 001', 'Ruang 002', 'Ruang 003']);
    const viewer = await signIn('viewer');
    const dashboard = await viewer.venueDashboard.get(venueId);
    expect(dashboard.locationsTotal).toBe(100);
    expect(dashboard.locationStatuses).toEqual({
      active: await countWhere('active'),
      coming_soon: await countWhere('coming_soon'),
      inactive_temporary: await countWhere('inactive_temporary'),
      inactive_permanent: await countWhere('inactive_permanent'),
    });
    expect(dashboard.locationStatuses.coming_soon).toBe(3);
    expect(dashboard.locationsWithoutUnit).toBe(100);
    expect(dashboard.unitsTotal).toBe(0);
    expect(dashboard.closuresActive).toBe(0);
    expect(dashboard.publication).toBeNull();
  });

  it('TC-PAR-08: aset dipakai ulang tidak bisa dihapus; yang tidak terpakai terhapus', async () => {
    const editor = await signIn('editor');
    const path = await editor.media.upload(venueId, png());
    let asset = (await editor.media.list(venueId)).find((a) => a.path === path);
    expect(asset).toMatchObject({ kind: 'photo', usages: [], mimeType: 'image/png' });

    const first = await editor.locations.save(venueId, typeId, null, input({ name: 'Apotek' }), {
      logoPath: path,
      keepPhotoPaths: [],
      newPhotos: [],
    });
    const second = await editor.locations.save(venueId, typeId, null, input({ name: 'Kasir' }), {
      keepPhotoPaths: [path],
      newPhotos: [],
    });
    asset = (await editor.media.list(venueId)).find((a) => a.path === path);
    expect(asset?.usages.map((u) => `${u.name}:${u.role}`).sort()).toEqual([
      'Apotek:logo',
      'Kasir:photo',
    ]);

    await expect(
      editor.media.remove(venueId, { bucket: 'public-assets', path }),
    ).rejects.toMatchObject({
      kind: 'conflict',
      message: expect.stringContaining('Lokasi "Apotek" (logo)'),
    });

    // Menghapus lokasi dan mengganti logo tidak menghapus aset pustaka yang dipakai ulang.
    await editor.locations.remove(second);
    await editor.locations.save(venueId, typeId, first, input({ name: 'Apotek' }), {
      logo: png(),
      keepPhotoPaths: [],
      newPhotos: [],
    });
    asset = (await editor.media.list(venueId)).find((a) => a.path === path);
    expect(asset?.usages).toEqual([]);

    const viewer = await signIn('viewer');
    await expect(
      viewer.media.remove(venueId, { bucket: 'public-assets', path }),
    ).rejects.toMatchObject({ kind: 'forbidden' });

    await editor.media.remove(venueId, { bucket: 'public-assets', path });
    expect((await editor.media.list(venueId)).some((a) => a.path === path)).toBe(false);
  });
});
