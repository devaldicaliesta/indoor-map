import { randomUUID } from 'node:crypto';
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

// PNG 1×1 transparan.
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  ),
  (c) => c.charCodeAt(0),
);

describe.runIf(url && anonKey && serviceKey)('denah lantai (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '';

  afterAll(async () => {
    if (venueId) {
      const { data } = await service.from('floor_plans').select('source_path, raster_path');
      const paths = (data ?? []).flatMap((r) => [r.source_path, r.raster_path ?? '']);
      await service.storage.from('floor-plans').remove(paths.filter((p) => p.startsWith(venueId)));
      await service.from('venues').delete().eq('id', venueId);
    }
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'viewer') {
    const email = `${role}-${suffix}@floor-plans.test`;
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

  it('versi baru aktif, versi lama tetap di riwayat; viewer bisa melihat tapi tidak mengunggah', async () => {
    const data = await signIn('admin');
    const venue = await data.venues.create({
      name: `Denah ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const building = await data.buildings.create(venue.id, {
      name: 'G',
      code: 'G',
      footprint: null,
    });
    const floor = await data.floors.create(building.id, { name: 'GF', level: 0, heightM: 4 });

    const png = new File([PNG], 'denah.png', { type: 'image/png' });
    const first = await data.floorPlans.upload(floor.id, { source: png });
    expect(first).toMatchObject({ isActive: true, sourceFormat: 'png', pdfPage: null });
    expect(first.rasterPath).toBe(first.sourcePath);

    const pdf = new File(['%PDF-1.4'], 'denah.pdf', { type: 'application/pdf' });
    const second = await data.floorPlans.upload(floor.id, {
      source: pdf,
      raster: new Blob([PNG], { type: 'image/png' }),
      pdfPage: 2,
    });
    expect(second).toMatchObject({ isActive: true, sourceFormat: 'pdf', pdfPage: 2 });
    expect(second.rasterPath).toMatch(/-raster\.png$/);

    const history = await data.floorPlans.list(floor.id);
    expect(history.map((p) => [p.id, p.isActive])).toEqual([
      [second.id, true],
      [first.id, false],
    ]);

    const corners: [number, number][] = [
      [106.827, -6.175],
      [106.828, -6.175],
      [106.828, -6.176],
      [106.827, -6.176],
    ];
    const placed = await data.floorPlans.savePlacement(second.id, { corners, opacity: 0.35 });
    expect(placed).toMatchObject({ corners, opacity: 0.35 });
    expect((await data.floorPlans.list(floor.id))[0]).toMatchObject({ corners, opacity: 0.35 });
    expect((await data.floors.get(floor.id)).name).toBe('GF');

    const viewer = await signIn('viewer');
    await expect(
      viewer.floorPlans.savePlacement(second.id, { corners, opacity: 1 }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    const [signed] = await viewer.floorPlans.signedUrls([first.sourcePath]);
    expect((await fetch(signed ?? '')).status).toBe(200);
    await expect(viewer.floorPlans.upload(floor.id, { source: png })).rejects.toMatchObject({
      kind: 'forbidden',
    });

    await expect(
      data.floorPlans.upload(floor.id, {
        source: new File(['MZ'], 'setup.exe', { type: 'application/x-msdownload' }),
      }),
    ).rejects.toMatchObject({ kind: 'invalid' });

    // DXF: berkas asli disimpan sebagai image/vnd.dxf, raster PNG dipakai di peta.
    const dxf = new File(['0\nSECTION\n0\nEOF\n'], 'denah.dxf', { type: '' });
    await expect(data.floorPlans.upload(floor.id, { source: dxf })).rejects.toMatchObject({
      kind: 'invalid',
    });
    const cad = await data.floorPlans.upload(floor.id, {
      source: dxf,
      raster: new Blob([PNG], { type: 'image/png' }),
      cadLayers: ['DINDING', 'PINTU'],
      naturalWidthM: 42.5,
    });
    expect(cad).toMatchObject({
      isActive: true,
      sourceFormat: 'dxf',
      cadLayers: ['DINDING', 'PINTU'],
      naturalWidthM: 42.5,
    });
    expect(cad.sourcePath).toMatch(/-source\.dxf$/);
    expect(cad.rasterPath).toMatch(/-raster\.png$/);
    await expect(
      data.floorPlans.upload(floor.id, {
        source: new File(['AC1032'], 'denah.dwg', { type: '' }),
      }),
    ).rejects.toMatchObject({ kind: 'invalid', message: expect.stringContaining('DXF atau PDF') });
  });
});
