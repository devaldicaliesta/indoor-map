import { randomUUID } from 'node:crypto';
import type { FacilityTypeId } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
// PNG 1×1 transparan.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const png = () => new Blob([PNG], { type: 'image/png' });

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

describe.runIf(url && anonKey && serviceKey)('jenis fasilitas (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '';

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'viewer') {
    const email = `${role}-${suffix}-${userIds.length}@facility-types.test`;
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

  async function storedFiles() {
    const { data } = await service.storage.from('public-assets').list(`facility-types/${venueId}`);
    return (data ?? []).map((f) => `facility-types/${venueId}/${f.name}`);
  }

  it('ikon unggahan tersimpan publik, jenis yang dipakai tidak bisa dihapus, berkas dibersihkan', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Fasilitas ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const building = await admin.buildings.create(venue.id, {
      name: 'Gedung A',
      code: 'GA',
      footprint: null,
    });
    const floor = await admin.floors.create(building.id, { name: 'GF', level: 0, heightM: 4 });

    const toilet = await admin.facilityTypes.create(venue.id, {
      name: 'Toilet',
      isSafety: false,
      icon: { kind: 'builtin', key: 'toilet-male' },
    });
    expect(toilet.icon).toEqual({ kind: 'builtin', key: 'toilet-male' });

    const custom = await admin.facilityTypes.create(
      venue.id,
      { name: 'Loker', isSafety: true, icon: null },
      png(),
    );
    expect(custom.isSafety).toBe(true);
    expect(custom.icon?.kind).toBe('upload');
    const iconPath = custom.icon?.kind === 'upload' ? custom.icon.path : '';
    expect(iconPath.startsWith(`facility-types/${venue.id}/${custom.id}-`)).toBe(true);
    // Visitor (anon) membaca ikon lewat URL publik; CORS dibutuhkan untuk sprite.
    const response = await fetch(admin.facilityTypes.iconUrl(iconPath), {
      headers: { Origin: 'http://localhost:5174' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('access-control-allow-origin')).toBeTruthy();

    await expect(
      admin.facilityTypes.create(venue.id, { name: 'Toilet', isSafety: false, icon: null }),
    ).rejects.toMatchObject({
      kind: 'conflict',
      message: expect.stringContaining('sudah dipakai'),
    });

    const editor = await signIn('editor');
    await editor.features.save(venue.id, {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [106.8272, -6.1754] },
      properties: {
        id: randomUUID(),
        kind: 'facility',
        floorId: floor.id,
        facilityTypeId: toilet.id,
      },
    });
    const listed = await admin.facilityTypes.list(venue.id);
    expect(listed.map((t) => [t.name, t.usageCount])).toEqual([
      ['Loker', 0],
      ['Toilet', 1],
    ]);

    const inUse = await admin.facilityTypes.remove(toilet.id).catch((e: unknown) => e);
    expect(inUse).toBeInstanceOf(DataError);
    expect((inUse as DataError).kind).toBe('conflict');
    expect((inUse as DataError).message).toBe(
      'Jenis "Toilet" tidak bisa dihapus karena masih dipakai 1 fasilitas di Gedung A GF. Ganti jenisnya atau hapus fasilitas tersebut di Editor Peta lebih dulu.',
    );

    // Ganti ikon unggahan dengan ikon baru, lalu dengan piktogram bawaan: berkas lama hilang.
    const replaced = await admin.facilityTypes.update(
      custom.id,
      { name: 'Loker', isSafety: true, icon: custom.icon },
      png(),
    );
    const replacedPath = replaced.icon?.kind === 'upload' ? replaced.icon.path : '';
    expect(replacedPath).not.toBe(iconPath);
    expect(await storedFiles()).toEqual([replacedPath]);
    const builtin = await admin.facilityTypes.update(custom.id, {
      name: 'Loker',
      isSafety: true,
      icon: { kind: 'builtin', key: 'information' },
    });
    expect(builtin.icon).toEqual({ kind: 'builtin', key: 'information' });
    expect(await storedFiles()).toEqual([]);

    await admin.facilityTypes.remove(custom.id);
    expect((await admin.facilityTypes.list(venue.id)).map((t) => t.name)).toEqual(['Toilet']);
  });

  it('editor dan viewer tidak bisa membuat jenis atau mengunggah ikon', async () => {
    const editor = await signIn('editor');
    await expect(
      editor.facilityTypes.create(
        venueId as Parameters<typeof editor.facilityTypes.create>[0],
        { name: 'Dari editor', isSafety: false, icon: null },
        png(),
      ),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    const viewer = await signIn('viewer');
    await expect(
      viewer.facilityTypes.create(
        venueId as Parameters<typeof viewer.facilityTypes.create>[0],
        { name: 'Liar', isSafety: false, icon: null },
        png(),
      ),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      viewer.facilityTypes.remove(randomUUID() as FacilityTypeId),
    ).rejects.toBeInstanceOf(DataError);
  });
});
