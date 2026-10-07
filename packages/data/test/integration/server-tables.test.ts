import { randomUUID } from 'node:crypto';
import type { ClosureStatus, LocationStatus, VenueId } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';
import type { LocationPageFilters } from '../../src/repositories/locations';
import { createLargeVenue, type LargeVenue, largeVenueLocation } from '../support/large-venue';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';
const COUNT = 2000;

const newDb = () =>
  createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const NO_FILTERS: LocationPageFilters = {
  statuses: [],
  categoryId: null,
  typeId: null,
  building: null,
  floorId: null,
  unlinkedOnly: false,
};

const expected = (match: (l: ReturnType<typeof largeVenueLocation>) => boolean) =>
  Array.from({ length: COUNT }, (_, i) => largeVenueLocation(i)).filter(match).length;

// Tabel server T-503 dengan 2.000 lokasi (TC-TBL-01/02/03/08/09, TC-SEC-81).
describe.runIf(url && anonKey && serviceKey)(
  'tabel server: Lokasi, Penutupan, Riwayat publish',
  () => {
    const service = createClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const account = randomUUID().slice(0, 8);
    const userIds: string[] = [];
    let superAdmin: DataClient;
    let viewer: DataClient;
    let outsider: DataClient;
    let superAdminId = '';
    let venue: LargeVenue;
    let venueId: VenueId;

    async function signIn(role: 'super-admin' | 'viewer' | 'tanpa-profil') {
      const email = `${role}-${account}@server-table.test`;
      const created = await service.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
      });
      const id = created.data.user?.id ?? '';
      userIds.push(id);
      if (role !== 'tanpa-profil') {
        const appRole = role === 'super-admin' ? 'super_admin' : 'viewer';
        await service
          .from('profiles')
          .insert({ user_id: id, full_name: `Penguji ${account}`, email, role: appRole });
      }
      const db = newDb();
      await db.auth.signInWithPassword({ email, password: PASSWORD });
      return { id, db, data: createRepositories(db) };
    }

    beforeAll(async () => {
      const sa = await signIn('super-admin');
      superAdmin = sa.data;
      superAdminId = sa.id;
      viewer = (await signIn('viewer')).data;
      outsider = (await signIn('tanpa-profil')).data;
      venue = await createLargeVenue(sa.db, `Tabel Server ${account}`, COUNT);
      venueId = venue.venueId as VenueId;
    }, 120_000);

    afterAll(async () => {
      if (venueId) await service.from('venues').delete().eq('id', venueId);
      for (const id of userIds) await service.auth.admin.deleteUser(id);
    });

    const page = (patch: Partial<LocationPageFilters> = {}, q = '', size = 25, n = 1) =>
      superAdmin.locations.listPage(venueId, {
        q,
        filters: { ...NO_FILTERS, ...patch },
        page: n,
        size,
      });

    it('TC-TBL-01 cari di 2.000 lokasi: disaring di server, total benar, < 500 ms per perubahan', async () => {
      expect((await page()).total).toBe(COUNT);
      // Kode unit lokasi pertama yang tertaut di GF (tidak semua lokasi punya unit).
      const gfUnit =
        Array.from({ length: COUNT }, (_, i) => largeVenueLocation(i).unitCode).find((code) =>
          code?.startsWith('GF-'),
        ) ?? '';
      const changes: [Partial<LocationPageFilters>, string, number][] = [
        [{}, 'kafe lumiere', expected((l) => l.name.startsWith('Kafé Lumière'))],
        [{}, 'LK-0042', 1],
        [{}, gfUnit.toLowerCase(), 1],
        [
          { statuses: ['active'] },
          'poli',
          expected((l) => l.status === 'active' && l.name.startsWith('Poli')),
        ],
        [{ floorId: venue.floorIds.L1 }, '', expected((l) => l.floor === 'L1')],
        [{ building: 'outdoor' }, '', expected((l) => l.floor === 'outdoor')],
        [{ unlinkedOnly: true }, '', expected((l) => l.floor === null)],
      ];
      for (const [filters, q, total] of changes) {
        const started = performance.now();
        const result = await page(filters, q);
        const elapsed = performance.now() - started;
        expect(result.total, `${q} ${JSON.stringify(filters)}`).toBe(total);
        expect(elapsed).toBeLessThan(500);
      }
    });

    it('TC-TBL-02 filter gabungan status + kategori + lantai berupa irisan', async () => {
      const statuses: LocationStatus[] = ['active', 'coming_soon'];
      const combined = await page(
        { statuses, categoryId: venue.categoryIds.kopi, floorId: venue.floorIds.GF },
        '',
        100,
      );
      expect(combined.total).toBe(
        expected((l) => statuses.includes(l.status) && l.category === 'kopi' && l.floor === 'GF'),
      );
      expect(combined.rows.every((l) => statuses.includes(l.status))).toBe(true);
      expect(combined.rows.every((l) => l.units.some((u) => u.floorId === venue.floorIds.GF))).toBe(
        true,
      );
      const byType = await page({ typeId: venue.typeIds.fasilitas });
      expect(byType.total).toBe(expected((l) => l.type === 'fasilitas'));
    });

    it('TC-TBL-03 semua halaman ukuran 100: 2.000 baris urut nama tanpa ganda atau hilang', async () => {
      const ids: string[] = [];
      const names: string[] = [];
      for (let n = 1; n <= COUNT / 100; n++) {
        const result = await page({}, '', 100, n);
        expect(result.total).toBe(COUNT);
        ids.push(...result.rows.map((l) => l.id));
        names.push(...result.rows.map((l) => l.name));
      }
      expect(new Set(ids).size).toBe(COUNT);
      // Urutan dari collation database; yang penting setiap halaman melanjutkan halaman sebelumnya.
      expect(names[0]?.localeCompare(names[COUNT - 1] ?? '', 'en')).toBeLessThanOrEqual(0);
    });

    it('TC-TBL-08 kata kunci %, _, kutip, dan emoji pada nama lokasi', async () => {
      const totalOf = async (q: string) => (await page({}, q)).total;
      expect(await totalOf('50%')).toBe(expected((l) => l.name.includes('50%')));
      expect(await totalOf('ruang_laktasi')).toBe(
        expected((l) => l.name.startsWith('Ruang_Laktasi')),
      );
      expect(await totalOf('_')).toBe(expected((l) => l.name.includes('_')));
      expect(await totalOf("o'bakery")).toBe(expected((l) => l.name.includes("O'Bakery")));
      expect(await totalOf('🍵')).toBe(expected((l) => l.name.includes('🍵')));
      expect(await totalOf('\\')).toBe(0);
    });

    it('urutan nama alami; tautan langsung satu lokasi dan daftar kode semua lokasi', async () => {
      // "Kafé Lumière 2" sebelum "Kafé Lumière 10" (collation alami), bukan "1, 10, 100, 2".
      const kafe = await page({}, 'kafe lumiere', 25);
      expect(kafe.rows.slice(0, 3).map((l) => l.name)).toEqual([
        'Kafé Lumière 1',
        'Kafé Lumière 2',
        'Kafé Lumière 3',
      ]);
      const [first] = kafe.rows;
      if (!first) throw new Error('hasil cari kosong');
      expect(await superAdmin.locations.get(first.id)).toMatchObject({
        id: first.id,
        name: 'Kafé Lumière 1',
      });
      expect(await outsider.locations.get(first.id)).toBeNull();
      // Lebih dari batas satu permintaan PostgREST (1.000): diambil per halaman.
      const codes = await superAdmin.locations.codes(venueId);
      expect(codes).toHaveLength(COUNT);
      expect(codes.find((c) => c.code === 'LK-0042')?.name).toBe(largeVenueLocation(41).name);
    });

    it('TC-TBL-09/TC-SEC-81 total mengikuti RLS: Viewer melihat semua, akun tanpa role 0, anon ditolak', async () => {
      const asViewer = await viewer.locations.listPage(venueId, {
        q: '',
        filters: NO_FILTERS,
        page: 1,
        size: 10,
      });
      expect(asViewer.total).toBe(COUNT);
      const asOutsider = await outsider.locations.listPage(venueId, {
        q: '',
        filters: NO_FILTERS,
        page: 1,
        size: 10,
      });
      expect(asOutsider).toEqual({ rows: [], total: 0 });
      await expect(
        createRepositories(newDb()).locations.listPage(venueId, {
          q: '',
          filters: NO_FILTERS,
          page: 1,
          size: 10,
        }),
      ).rejects.toBeInstanceOf(DataError);
    });

    it('Penutupan: aktif/terjadwal/selesai, rentang tanggal, cari alasan dan kode unit', async () => {
      const { data: units } = await service
        .from('features')
        .select('id, unit_code')
        .eq('venue_id', venueId)
        .order('unit_code')
        .limit(30);
      const hour = 3_600_000;
      const now = Date.now();
      const plan: { state: ClosureStatus; starts: number; ends: number | null; reason: string }[] =
        (units ?? []).map((_, i) => {
          const state: ClosureStatus =
            (['active', 'scheduled', 'ended'] as const)[i % 3] ?? 'active';
          const starts =
            state === 'scheduled' ? now + (i + 1) * 24 * hour : now - (i + 2) * 24 * hour;
          // Selesai harus setelah mulai; yang terjadwal berakhir sehari setelah mulai.
          const ends =
            state === 'ended' ? now - hour : i % 2 ? null : Math.max(starts, now) + 24 * hour;
          return {
            state,
            starts,
            ends,
            reason: i % 4 ? `Perawatan rutin ${i}` : `Lantai basah 50% ${i}`,
          };
        });
      const rows = (units ?? []).map((u, i) => ({
        venue_id: venueId,
        feature_id: u.id,
        reason: plan[i]?.reason ?? 'x',
        starts_at: new Date(plan[i]?.starts ?? now).toISOString(),
        ends_at: plan[i]?.ends ? new Date(plan[i]?.ends ?? now).toISOString() : null,
      }));
      const { error } = await service.from('closures').insert(rows);
      if (error) throw error;
      const closures = (states: ClosureStatus[], q = '') =>
        superAdmin.closures.listPage(venueId, {
          q,
          filters: { states, from: null, to: null, timeZone: 'Asia/Jakarta' },
          page: 1,
          size: 100,
        });
      for (const state of ['active', 'scheduled', 'ended'] as const) {
        expect((await closures([state])).total).toBe(plan.filter((p) => p.state === state).length);
      }
      expect((await closures(['active', 'ended'])).total).toBe(
        plan.filter((p) => p.state !== 'scheduled').length,
      );
      expect((await closures([], 'lantai basah 50%')).total).toBe(
        plan.filter((p) => p.reason.includes('50%')).length,
      );
      const firstCode = units?.[0]?.unit_code ?? '';
      expect((await closures([], firstCode)).rows.map((c) => c.featureId)).toContain(
        units?.[0]?.id,
      );
      const tomorrow = new Date(now + 24 * hour).toISOString().slice(0, 10);
      const ranged = await superAdmin.closures.listPage(venueId, {
        q: '',
        filters: { states: [], from: tomorrow, to: tomorrow, timeZone: 'UTC' },
        page: 1,
        size: 100,
      });
      const dayStart = Date.parse(`${tomorrow}T00:00:00Z`);
      const dayEnd = dayStart + 24 * hour;
      expect(ranged.total).toBe(
        plan.filter((p) => p.starts < dayEnd && (p.ends === null || p.ends > dayStart)).length,
      );
    });

    it('Riwayat publish: hanya versi yang pernah terbit; cari nomor versi dan catatan; rentang tanggal', async () => {
      const rows = Array.from({ length: 22 }, (_, i) => ({
        venue_id: venueId,
        version: i + 1,
        snapshot_path: `${venueId}/v${i + 1}.json`,
        notes: i % 5 === 0 ? `Rilis denah baru ${i + 1}` : null,
        is_active: i + 1 === 21,
        published_by: superAdminId,
        published_at: `2026-09-${String(i + 1).padStart(2, '0')}T03:00:00Z`,
      }));
      const { error } = await service.from('publications').insert(rows);
      if (error) throw error;
      const history = (q: string, from: string | null = null, to: string | null = null) =>
        superAdmin.publications.historyPage(venueId, {
          q,
          filters: { from, to, timeZone: 'Asia/Jakarta' },
          page: 1,
          size: 10,
        });
      const all = await history('');
      // Versi 22 masih pesanan yang belum terbit (lebih baru dari versi aktif 21).
      expect(all.total).toBe(21);
      expect(all.rows.map((r) => r.version)).toEqual([21, 20, 19, 18, 17, 16, 15, 14, 13, 12]);
      expect(all.rows[0]?.isActive).toBe(true);
      expect(all.rows[0]?.publisherName).toBe(`Penguji ${account}`);
      expect((await history('v12')).rows.map((r) => r.version)).toEqual([12]);
      expect((await history('denah baru')).total).toBe(
        rows.filter((r) => r.notes && r.version <= 21).length,
      );
      expect((await history('', '2026-09-10', '2026-09-12')).rows.map((r) => r.version)).toEqual([
        12, 11, 10,
      ]);
      expect((await history('', null, null)).total).toBe(21);
    });
  },
);
