import { randomUUID } from 'node:crypto';
import type { AuditAction } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories, type DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';
import type { AuditFilters } from '../../src/repositories/audit';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newDb = () =>
  createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

// Pola tabel server T-502 dengan tabel contoh Log audit: halaman + total `count=exact`,
// pencarian aman untuk karakter khusus, dan total yang mengikuti RLS (TC-TBL-01/03/08/09,
// TC-SEC-81).
describe.runIf(url && anonKey && serviceKey)('listPage tabel server (Log audit)', () => {
  const service = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tag = `uji${randomUUID().slice(0, 8)}`;
  // Akun penguji tidak memuat `tag`: peristiwa masuknya tidak boleh ikut hasil cari.
  const account = randomUUID().slice(0, 8);
  const userIds: string[] = [];
  let superAdmin: DataClient;
  let admin: DataClient;
  let actorId = '';

  const SPECIAL = [
    'Diskon 50% lantai 2',
    'kode_unit GF-01',
    "Ruang O'Brien",
    'C:\\denah\\lama',
    'Kafé Lumière',
  ];
  const ACTIONS: AuditAction[] = ['publish', 'settings_changed', 'rollback'];
  const filters = (patch: Partial<AuditFilters> = {}): AuditFilters => ({
    actions: [],
    userId: null,
    from: null,
    to: null,
    timeZone: 'Asia/Jakarta',
    ...patch,
  });

  async function signIn(role: 'super_admin' | 'admin') {
    const email = `${role.replace('_', '-')}-${account}@table.test`;
    const created = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    const id = created.data.user?.id ?? '';
    userIds.push(id);
    await service
      .from('profiles')
      .insert({ user_id: id, full_name: `Penguji ${account}`, email, role });
    const db = newDb();
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return { id, data: createRepositories(db) };
  }

  beforeAll(async () => {
    const sa = await signIn('super_admin');
    superAdmin = sa.data;
    actorId = sa.id;
    admin = (await signIn('admin')).data;
    // 130 peristiwa biasa + 5 dengan karakter khusus, tersebar 1–7 Oktober 2026 (WIB).
    const rows = [
      ...Array.from({ length: 130 }, (_, i) => ({
        action: ACTIONS[i % ACTIONS.length] ?? 'publish',
        user_id: i % 2 === 0 ? actorId : null,
        details: { venue: `${tag} Venue ${String(i).padStart(3, '0')}` },
        occurred_at: `2026-10-0${(i % 7) + 1}T03:00:00Z`,
      })),
      ...SPECIAL.map((text) => ({
        action: 'settings_changed',
        user_id: null,
        details: { venue: `${tag} ${text}` },
        occurred_at: '2026-10-07T16:30:00Z',
      })),
    ];
    const { error } = await service.from('audit_events').insert(rows);
    if (error) throw error;
  }, 60_000);

  afterAll(async () => {
    await service.from('audit_events').delete().like('details->>venue', `${tag}%`);
    for (const id of userIds) {
      await service.from('audit_events').delete().eq('user_id', id);
      await service.auth.admin.deleteUser(id);
    }
  });

  it('TC-TBL-03 semua halaman 10/25/50/100: total benar, tanpa baris ganda atau hilang', async () => {
    for (const size of [10, 25, 50, 100]) {
      const ids: number[] = [];
      let total = 0;
      for (let page = 1; ; page++) {
        const result = await superAdmin.audit.listPage({ q: tag, filters: filters(), page, size });
        total = result.total;
        ids.push(...result.rows.map((row) => row.id));
        if (page * size >= total) break;
      }
      expect(total).toBe(135);
      expect(new Set(ids).size).toBe(135);
    }
  });

  it('TC-TBL-01/02 filter aksi, pelaku, dan rentang tanggal berlaku bersamaan', async () => {
    const publish = await superAdmin.audit.listPage({
      q: tag,
      filters: filters({ actions: ['publish'] }),
      page: 1,
      size: 100,
    });
    expect(publish.total).toBe(44);
    expect(publish.rows.every((row) => row.action === 'publish')).toBe(true);

    const mine = await superAdmin.audit.listPage({
      q: tag,
      filters: filters({ actions: ['publish', 'rollback'], userId: actorId }),
      page: 1,
      size: 100,
    });
    expect(mine.total).toBe(44);
    expect(mine.rows.every((row) => row.actor?.userId === actorId)).toBe(true);

    // 7 Oktober WIB: 18 peristiwa biasa (03.00 UTC) + 5 khusus (23.30 WIB, masih 7 Oktober).
    const seventh = await superAdmin.audit.listPage({
      q: tag,
      filters: filters({ from: '2026-10-07', to: '2026-10-07' }),
      page: 1,
      size: 100,
    });
    expect(seventh.total).toBe(18 + 5);
    // Di UTC peristiwa khusus jatuh tanggal 7 juga, tetapi batasnya dihitung per zona waktu.
    const utc = await superAdmin.audit.listPage({
      q: tag,
      filters: filters({ from: '2026-10-08', to: '2026-10-08', timeZone: 'UTC' }),
      page: 1,
      size: 10,
    });
    expect(utc.total).toBe(0);
  });

  it('TC-TBL-08 kata kunci %, _, kutip, backslash, dan aksen diperlakukan sebagai teks', async () => {
    // Hanya baris uji ini yang diperiksa; peristiwa lain di database lokal bisa ikut cocok.
    const search = async (q: string) =>
      (await superAdmin.audit.listPage({ q, filters: filters(), page: 1, size: 100 })).rows
        .map((row) => String(row.details.venue))
        .filter((venue) => venue.startsWith(tag));
    expect(await search(`${tag} diskon 50%`)).toEqual([`${tag} Diskon 50% lantai 2`]);
    expect(await search('50%')).toEqual([`${tag} Diskon 50% lantai 2`]);
    expect(await search('kode_unit')).toEqual([`${tag} kode_unit GF-01`]);
    expect(await search("o'brien")).toEqual([`${tag} Ruang O'Brien`]);
    expect(await search('c:\\denah')).toEqual([`${tag} C:\\denah\\lama`]);
    expect(await search('kafe lumiere')).toEqual([`${tag} Kafé Lumière`]);
    expect(await search('LUMIÈRE')).toEqual([`${tag} Kafé Lumière`]);
    // Wildcard dari pengguna tidak mencocokkan semua baris.
    expect(await search('%')).toEqual([`${tag} Diskon 50% lantai 2`]);
    expect(await search('_')).toEqual([`${tag} kode_unit GF-01`]);
    expect(await search('\\')).toEqual([`${tag} C:\\denah\\lama`]);
  });

  it('TC-TBL-09/TC-SEC-81 total mengikuti RLS: role tanpa hak baca mendapat 0, bukan jumlah sebenarnya', async () => {
    const asSuperAdmin = await superAdmin.audit.listPage({
      q: tag,
      filters: filters(),
      page: 1,
      size: 10,
    });
    expect(asSuperAdmin.total).toBe(135);
    const asAdmin = await admin.audit.listPage({ q: tag, filters: filters(), page: 1, size: 10 });
    expect(asAdmin).toEqual({ rows: [], total: 0 });
    // Pengunjung tanpa login tidak boleh memanggil fungsi pencarian sama sekali.
    await expect(
      createRepositories(newDb()).audit.listPage({ q: tag, filters: filters(), page: 1, size: 10 }),
    ).rejects.toBeInstanceOf(DataError);
  });

  it('halaman di luar jangkauan kembali kosong dengan total yang benar', async () => {
    const result = await superAdmin.audit.listPage({
      q: tag,
      filters: filters(),
      page: 99,
      size: 25,
    });
    expect(result).toEqual({ rows: [], total: 135 });
  });
});
