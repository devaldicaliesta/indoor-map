import { randomUUID } from 'node:crypto';
import type { VenueId } from '@indoor/domain';
import { EMPTY_OPENING_HOURS } from '@indoor/domain';
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

describe.runIf(url && anonKey && serviceKey)(
  'tipe lokasi dan field kustom (Supabase lokal)',
  () => {
    const service = newDb(serviceKey);
    const suffix = randomUUID().slice(0, 8);
    const userIds: string[] = [];
    let venueId = '' as VenueId;

    afterAll(async () => {
      if (venueId) await service.from('venues').delete().eq('id', venueId);
      for (const id of userIds) await service.auth.admin.deleteUser(id);
    });

    async function signIn(role: 'admin' | 'editor' | 'viewer') {
      const email = `${role}-${suffix}-${userIds.length}@types.test`;
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

    it('Editor menambah tipe dan field; nilai tersimpan; hapus field ikut menghapus nilainya', async () => {
      const admin = await signIn('admin');
      const venue = await admin.venues.create({
        name: `Tipe ${suffix}`,
        address: null,
        center: null,
        timezone: 'Asia/Jakarta',
      });
      venueId = venue.id;
      const editor = await signIn('editor');
      await editor.locationTypes.save(venue.id, null, {
        name: 'Layanan',
        icon: null,
        color: '#2f6f4f',
      });
      const type = (await editor.locationTypes.list(venue.id)).find((t) => t.name === 'Layanan');
      if (!type) throw new Error('tipe tidak tersimpan');
      const field = {
        key: 'telepon',
        label: 'Telepon',
        type: 'text' as const,
        options: [],
        isRequired: true,
        isVisible: true,
        isSearchable: true,
      };
      await editor.locationTypes.saveField(type.id, null, field, 0);
      await editor.locationTypes.saveField(
        type.id,
        null,
        { ...field, key: 'layanan', label: 'Layanan', type: 'select', options: ['Umum', 'BPJS'] },
        1,
      );
      const saved = (await editor.locationTypes.list(venue.id)).find((t) => t.id === type.id);
      expect(saved?.fields.map((f) => f.key)).toEqual(['telepon', 'layanan']);

      const locationId = await editor.locations.save(
        venue.id,
        type.id,
        null,
        {
          code: '',
          name: 'Loket',
          description: '',
          categoryIds: [],
          unitIds: [],
          primaryUnitId: null,
          customFields: { telepon: '021-555', layanan: 'BPJS' },
          status: 'active',
          openingDate: null,
          hours: EMPTY_OPENING_HOURS,
        },
        { keepPhotoPaths: [], newPhotos: [] },
      );
      const location = (await editor.locations.list(venue.id)).find((l) => l.id === locationId);
      expect(location?.customFields).toEqual({ telepon: '021-555', layanan: 'BPJS' });
      expect(await editor.locationTypes.fieldUsage(type.id, 'telepon')).toBe(1);

      const telepon = saved?.fields.find((f) => f.key === 'telepon');
      await editor.locationTypes.removeField(telepon?.id ?? '');
      const after = (await editor.locations.list(venue.id)).find((l) => l.id === locationId);
      expect(after?.customFields).toEqual({ layanan: 'BPJS' });

      const viewer = await signIn('viewer');
      await expect(
        viewer.locationTypes.save(venue.id, null, { name: 'Lain', icon: null, color: null }),
      ).rejects.toMatchObject({ kind: 'forbidden' });
    });
  },
);
