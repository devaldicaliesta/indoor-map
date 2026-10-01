import { randomUUID } from 'node:crypto';
import type { VenueId } from '@indoor/domain';
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

describe.runIf(url && anonKey && serviceKey)('QR titik asal (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '' as VenueId;

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'viewer') {
    const email = `${role}-${suffix}-${userIds.length}@origins.test`;
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

  it('Editor membuat, mengubah, dan menghapus titik asal; Viewer hanya membaca', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Titik asal ${suffix}`,
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

    const editor = await signIn('editor');
    const input = {
      floorId: floor.id,
      name: ' Lobi Utama ',
      coordinates: [106.8272, -6.1754] as [number, number],
      headingDeg: 90,
      nodeId: null,
    };
    const created = await editor.originPoints.create(venue.id, input);
    expect(created).toMatchObject({ name: 'Lobi Utama', headingDeg: 90, nodeId: null });
    expect(created.code).toMatch(/^[0-9a-f]{12}$/);

    const updated = await editor.originPoints.update(created.id, { ...input, headingDeg: 180.5 });
    expect(updated).toMatchObject({ headingDeg: 180.5, code: created.code });

    const viewer = await signIn('viewer');
    expect((await viewer.originPoints.list(venue.id)).map((p) => p.id)).toEqual([created.id]);
    await expect(viewer.originPoints.create(venue.id, input)).rejects.toMatchObject({
      kind: 'forbidden',
    });

    await editor.originPoints.remove(created.id);
    expect(await editor.originPoints.list(venue.id)).toEqual([]);
  });

  it('URL publik Visitor terbaca staf non-Super-Admin tanpa membuka pengaturan lain', async () => {
    const { data } = await service.from('system_settings').select('public_visitor_url').single();
    const editor = await signIn('editor');
    expect(await editor.systemSettings.publicVisitorUrl()).toBe(data?.public_visitor_url || null);
    await expect(editor.systemSettings.get()).rejects.toMatchObject({ kind: 'forbidden' });
    const anon = createRepositories(newDb(anonKey));
    await expect(anon.systemSettings.publicVisitorUrl()).rejects.toBeTruthy();
  });
});
