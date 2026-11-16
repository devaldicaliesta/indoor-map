import { randomUUID } from 'node:crypto';
import type { EventInput, VenueId } from '@indoor/domain';
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

const at = (offsetHours: number) => new Date(Date.now() + offsetHours * HOUR).toISOString();

const input = (overrides: Partial<EventInput> = {}): EventInput => ({
  kind: 'event',
  status: 'active',
  title: { id: 'Seminar', en: '' },
  summary: { id: '', en: '' },
  description: { id: '', en: '' },
  imagePath: null,
  linkUrl: null,
  startsAt: at(-1),
  endsAt: at(1),
  repeat: 'none',
  repeatUntil: null,
  point: null,
  locationIds: [],
  ...overrides,
});

describe.runIf(url && anonKey && serviceKey)('event dan promosi (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let venueId = '';

  afterAll(async () => {
    if (venueId) await service.from('venues').delete().eq('id', venueId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'operator') {
    const email = `${role}-${suffix}-${userIds.length}@events.test`;
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

  it('CRUD, filter tabel, dan pembacaan Visitor hanya event aktif yang belum selesai', async () => {
    const admin = await signIn('admin');
    const venue = await admin.venues.create({
      name: `Event ${suffix}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    venueId = venue.id;
    const id = venue.id as VenueId;
    const building = await admin.buildings.create(id, { name: 'G', code: 'G', footprint: null });
    const floor = await admin.floors.create(building.id, { name: 'GF', level: 0, heightM: 4 });
    const type = await service
      .from('location_types')
      .insert({ venue_id: id, name: 'Ruang' })
      .select('id')
      .single();
    const hall = await service
      .from('locations')
      .insert({ venue_id: id, location_type_id: type.data?.id ?? '', name: 'Aula' })
      .select('id')
      .single();
    const hallId = hall.data?.id ?? '';

    const editor = await signIn('editor');
    const seminar = await editor.events.create(
      id,
      input({
        title: { id: '  Seminar Jantung  ', en: 'Heart Seminar' },
        locationIds: [hallId],
        point: { floorId: floor.id, coordinates: [106.8271, -6.1753] },
        linkUrl: 'https://contoh.id/daftar',
      }),
    );
    expect(seminar.title).toEqual({ id: 'Seminar Jantung', en: 'Heart Seminar' });
    expect(seminar.locationIds).toEqual([hallId]);
    expect(seminar.point?.floorId).toBe(floor.id);
    expect(seminar.point?.coordinates[0]).toBeCloseTo(106.8271, 6);
    const promo = await editor.events.create(
      id,
      input({
        kind: 'promotion',
        title: { id: 'Diskon Kantin', en: '' },
        startsAt: at(24),
        endsAt: at(26),
      }),
    );
    await editor.events.create(
      id,
      input({ title: { id: 'Draf Rahasia', en: '' }, status: 'draft' }),
    );
    await editor.events.create(
      id,
      input({ title: { id: 'Sudah Lewat', en: '' }, startsAt: at(-5), endsAt: at(-4) }),
    );

    const page = (
      filters: Partial<Parameters<typeof editor.events.listPage>[1]['filters']>,
      q = '',
    ) =>
      editor.events.listPage(id, {
        q,
        page: 1,
        size: 25,
        filters: {
          kinds: [],
          states: [],
          from: null,
          to: null,
          locationId: null,
          timeZone: 'Asia/Jakarta',
          ...filters,
        },
      });
    expect((await page({})).total).toBe(4);
    expect((await page({}, 'jantung')).rows.map((e) => e.id)).toEqual([seminar.id]);
    expect((await page({ kinds: ['promotion'] })).rows.map((e) => e.id)).toEqual([promo.id]);
    expect((await page({ states: ['current'] })).total).toBe(2);
    expect((await page({ states: ['draft'] })).rows.map((e) => e.title.id)).toEqual([
      'Draf Rahasia',
    ]);
    expect((await page({ states: ['ended'] })).rows.map((e) => e.title.id)).toEqual([
      'Sudah Lewat',
    ]);
    const located = await page({ locationId: hallId });
    expect(located.rows.map((e) => e.id)).toEqual([seminar.id]);
    expect(located.rows[0]?.locationIds).toEqual([hallId]);

    const anon = createRepositories(newDb(anonKey));
    const visible = await anon.events.listCurrent(id, new Date());
    expect(visible.map((e) => e.title.id).sort()).toEqual(['Diskon Kantin', 'Seminar Jantung']);
    expect(visible.find((e) => e.id === seminar.id)?.locationIds).toEqual([hallId]);

    const updated = await editor.events.update(seminar.id, {
      ...input({ title: { id: 'Seminar Jantung Sehat', en: '' } }),
      locationIds: [],
    });
    expect(updated.title.id).toBe('Seminar Jantung Sehat');
    expect(updated.locationIds).toEqual([]);

    const operator = await signIn('operator');
    await expect(operator.events.create(id, input())).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      editor.events.create(id, input({ endsAt: input().startsAt })),
    ).rejects.toMatchObject({ message: 'Waktu selesai harus setelah waktu mulai.' });

    await editor.events.remove(promo.id);
    expect((await page({})).total).toBe(3);
  });
});
