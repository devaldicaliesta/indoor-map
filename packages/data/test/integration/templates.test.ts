import { randomUUID } from 'node:crypto';
import { EMPTY_OPENING_HOURS, VENUE_TEMPLATES, type VenueId } from '@indoor/domain';
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

describe.runIf(url && anonKey && serviceKey)('template venue (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  const venueIds: VenueId[] = [];

  afterAll(async () => {
    for (const id of venueIds) await service.from('venues').delete().eq('id', id);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function signIn(role: 'admin' | 'editor' | 'viewer') {
    const email = `${role}-${suffix}-${userIds.length}@templates.test`;
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

  it('rumah sakit berisi tipe template; salinan per venue; ditolak bila sudah ada lokasi', async () => {
    const admin = await signIn('admin');
    const create = async (name: string) => {
      const venue = await admin.venues.create({
        name: `${name} ${suffix}`,
        address: null,
        center: null,
        timezone: 'Asia/Jakarta',
      });
      venueIds.push(venue.id);
      return venue;
    };
    const a = await create('RS A');
    const b = await create('RS B');
    await admin.venues.applyTemplate(a.id, VENUE_TEMPLATES.hospital);
    await admin.venues.applyTemplate(b.id, VENUE_TEMPLATES.hospital);

    const typesA = await admin.locationTypes.list(a.id);
    expect(typesA.map((t) => t.name)).toEqual(['Poli', 'Lab', 'Apotek', 'IGD', 'Kamar Rawat']);
    expect(typesA.every((t) => t.fields.length > 0)).toBe(true);
    expect((await admin.venues.get(a.id)).venueType).toBe('hospital');
    expect((await admin.facilityTypes.list(a.id)).some((f) => f.isSafety)).toBe(true);

    const poli = typesA[0];
    if (!poli) throw new Error('tipe Poli tidak ada');
    await admin.locationTypes.save(a.id, poli.id, { name: 'Klinik', icon: null, color: null });
    expect((await admin.locationTypes.list(b.id))[0]?.name).toBe('Poli');
    expect(VENUE_TEMPLATES.hospital.locationTypes[0]?.name).toBe('Poli');

    await admin.locations.save(
      a.id,
      poli.id,
      null,
      {
        code: '',
        name: 'Loket',
        description: '',
        categoryIds: [],
        unitIds: [],
        primaryUnitId: null,
        customFields: { jadwal_praktik: 'Senin 08.00' },
        status: 'active',
        openingDate: null,
        hours: EMPTY_OPENING_HOURS,
      },
      { keepPhotoPaths: [], newPhotos: [] },
    );
    await expect(admin.venues.applyTemplate(a.id, VENUE_TEMPLATES.office)).rejects.toBeTruthy();

    const editor = await signIn('editor');
    const c = await create('RS C');
    await expect(editor.venues.applyTemplate(c.id, VENUE_TEMPLATES.office)).rejects.toMatchObject({
      kind: 'forbidden',
    });
  });
});
