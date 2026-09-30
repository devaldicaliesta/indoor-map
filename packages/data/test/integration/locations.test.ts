import { randomUUID } from 'node:crypto';
import type { FeatureId, FloorId, LocationInput, Polygon, VenueId } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';

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

const square = (x: number): Polygon => ({
  type: 'Polygon',
  coordinates: [
    [
      [106.8 + x, -6.1],
      [106.8001 + x, -6.1],
      [106.8001 + x, -6.1001],
      [106.8 + x, -6.1],
    ],
  ],
});

describe.runIf(url && anonKey && serviceKey)('lokasi dan kategori (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '' as VenueId;

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'viewer') {
    const email = `${role}-${suffix}-${userIds.length}@locations.test`;
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

  async function storedFiles(folder: string) {
    const { data } = await service.storage.from('public-assets').list(`${folder}/${venueId}`);
    return (data ?? []).map((f) => `${folder}/${venueId}/${f.name}`).sort();
  }

  async function drawUnit(client: DataClient, floorId: FloorId, code: string, x: number) {
    const id = randomUUID() as FeatureId;
    await client.features.save(venueId, {
      type: 'Feature',
      geometry: square(x),
      properties: { id, kind: 'unit', floorId, unitCode: code, unitStatus: 'vacant' },
    });
    return id;
  }

  it('lokasi tertaut ke dua unit, unit lokasi aktif lain dan kode ganda ditolak, filter data lengkap', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Lokasi ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const building = await admin.buildings.create(venue.id, {
      name: 'Gedung Utama',
      code: 'GU',
      footprint: null,
    });
    const l1 = await admin.floors.create(building.id, { name: 'L1', level: 1, heightM: 4 });

    const editor = await signIn('editor');
    const u1 = await drawUnit(editor, l1.id, 'GU-L1-001', 0);
    const u2 = await drawUnit(editor, l1.id, 'GU-L1-002', 0.001);
    const u3 = await drawUnit(editor, l1.id, 'GU-L1-003', 0.002);

    const [type] = await editor.categories.listTypes(venue.id);
    expect(type?.name).toBe('Lokasi');
    const typeId = type?.id as NonNullable<typeof type>['id'];

    // Kategori: ikon bawaan dan ikon unggahan (Editor boleh, FR-LOC-07)
    const pemeriksaan = await editor.categories.create(venue.id, typeId, {
      name: 'Pemeriksaan',
      icon: { kind: 'builtin', key: 'first-aid' },
      sortOrder: 0,
    });
    const farmasi = await editor.categories.create(
      venue.id,
      typeId,
      { name: 'Farmasi', icon: null, sortOrder: 1 },
      png(),
    );
    expect(farmasi.icon?.kind).toBe('upload');
    expect(await storedFiles('categories')).toHaveLength(1);
    await expect(
      editor.categories.create(venue.id, typeId, { name: 'Farmasi', icon: null, sortOrder: 2 }),
    ).rejects.toMatchObject({
      kind: 'conflict',
      message: expect.stringContaining('sudah dipakai'),
    });

    const input = (patch: Partial<LocationInput>): LocationInput => ({
      code: '',
      name: 'Lokasi',
      description: '',
      categoryIds: [],
      unitIds: [],
      primaryUnitId: null,
      ...patch,
    });

    // Kriteria 1: dua unit sekaligus, dengan logo
    const radiologi = await editor.locations.save(
      venue.id,
      typeId,
      null,
      input({
        code: 'rad-01',
        name: 'Radiologi',
        categoryIds: [pemeriksaan.id],
        unitIds: [u1, u2],
      }),
      { logo: png(), keepPhotoPaths: [], newPhotos: [png()] },
    );
    let [saved] = await editor.locations.list(venue.id);
    expect(saved).toMatchObject({
      id: radiologi,
      code: 'RAD-01',
      name: 'Radiologi',
      categoryIds: [pemeriksaan.id],
    });
    expect(saved?.units.map((u) => [u.unitCode, u.buildingName, u.floorName, u.isPrimary])).toEqual(
      expect.arrayContaining([
        ['GU-L1-001', 'Gedung Utama', 'L1', true],
        ['GU-L1-002', 'Gedung Utama', 'L1', false],
      ]),
    );
    expect(saved?.logoPath?.startsWith(`locations/${venue.id}/${radiologi}-logo-`)).toBe(true);
    expect(saved?.photoPaths).toHaveLength(1);
    const logo = await fetch(editor.locations.imageUrl(saved?.logoPath ?? ''));
    expect(logo.status).toBe(200);

    // Kriteria 1: unit yang dipakai lokasi aktif lain ditolak dengan pesan yang jelas
    await expect(
      editor.locations.save(venue.id, typeId, null, input({ name: 'Apotek', unitIds: [u2, u3] }), {
        keepPhotoPaths: [],
        newPhotos: [png()],
      }),
    ).rejects.toMatchObject({
      kind: 'conflict',
      message: 'Unit GU-L1-002 sudah dipakai lokasi "Radiologi" yang masih aktif.',
    });
    // Foto yang sempat diunggah untuk penyimpanan yang gagal ikut dihapus.
    expect(await storedFiles('locations')).toHaveLength(2);

    // Kriteria 2: kode lokasi ganda ditolak
    await expect(
      editor.locations.save(
        venue.id,
        typeId,
        null,
        input({ code: 'RAD-01', name: 'Apotek', unitIds: [u3] }),
        { keepPhotoPaths: [], newPhotos: [] },
      ),
    ).rejects.toMatchObject({
      kind: 'conflict',
      message: 'Kode lokasi RAD-01 sudah dipakai lokasi "Radiologi".',
    });

    const apotek = await editor.locations.save(
      venue.id,
      typeId,
      null,
      input({ name: 'Apotek', categoryIds: [farmasi.id], unitIds: [u3] }),
      { keepPhotoPaths: [], newPhotos: [] },
    );

    const units = await editor.locations.venueUnits(venue.id);
    expect(units.map((u) => [u.unitCode, u.holders.map((h) => h.name)]).sort()).toEqual([
      ['GU-L1-001', ['Radiologi']],
      ['GU-L1-002', ['Radiologi']],
      ['GU-L1-003', ['Apotek']],
    ]);
    expect(await editor.locations.forUnit(u3)).toEqual([
      { id: apotek, name: 'Apotek', status: 'active' },
    ]);

    // Mengganti logo dan melepas foto membersihkan berkas lama
    await editor.locations.save(
      venue.id,
      typeId,
      radiologi,
      input({ code: 'RAD-01', name: 'Radiologi', unitIds: [u1], primaryUnitId: u1 }),
      { logo: png(), keepPhotoPaths: [], newPhotos: [] },
    );
    [saved] = (await editor.locations.list(venue.id)).filter((l) => l.id === radiologi);
    expect(saved?.units.map((u) => u.unitCode)).toEqual(['GU-L1-001']);
    expect(await storedFiles('locations')).toEqual([saved?.logoPath]);

    // Urutan kategori dan hapus kategori yang dipakai (dilepas dari lokasinya)
    await editor.categories.reorder([
      { id: farmasi.id, sortOrder: 0 },
      { id: pemeriksaan.id, sortOrder: 1 },
    ]);
    expect((await editor.categories.list(venue.id)).map((c) => [c.name, c.usageCount])).toEqual([
      ['Farmasi', 1],
      ['Pemeriksaan', 0],
    ]);
    await editor.categories.remove(farmasi.id);
    expect(await storedFiles('categories')).toEqual([]);
    const [apotekSaved] = (await editor.locations.list(venue.id)).filter((l) => l.id === apotek);
    expect(apotekSaved?.categoryIds).toEqual([]);

    // Viewer hanya membaca
    const viewer = await signIn('viewer');
    expect(await viewer.locations.list(venue.id)).toHaveLength(2);
    await expect(
      viewer.locations.save(venue.id, typeId, null, input({ name: 'Liar' }), {
        keepPhotoPaths: [],
        newPhotos: [],
      }),
    ).rejects.toMatchObject({ kind: 'forbidden' });

    // Hapus lokasi: tautan ikut hilang, berkas dibersihkan, unit bisa dipakai lagi
    await editor.locations.remove(radiologi);
    expect(await storedFiles('locations')).toEqual([]);
    expect(await editor.locations.forUnit(u1)).toEqual([]);
  });
});
