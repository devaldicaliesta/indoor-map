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

describe.runIf(url && anonKey && serviceKey)('status tur Admin (Supabase lokal)', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const userIds: string[] = [];

  afterAll(async () => {
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  async function createAccount(name: string) {
    const email = `${name}-${suffix}@tour.test`;
    const created = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    const id = created.data.user?.id ?? '';
    userIds.push(id);
    await service.from('profiles').insert({ user_id: id, full_name: name, email, role: 'viewer' });
    return email;
  }

  /** Sesi baru = perangkat atau browser lain dengan akun yang sama. */
  async function signIn(email: string) {
    const db = newDb(anonKey);
    await db.auth.signInWithPassword({ email, password: PASSWORD });
    return createRepositories(db);
  }

  it('TC-TUR-02: tur yang dilewati tidak tampil lagi di perangkat lain; akun lain tidak terpengaruh', async () => {
    const ana = await createAccount('ana');
    const budi = await createAccount('budi');

    const laptop = await signIn(ana);
    expect(await laptop.tours.seen()).toEqual([]);
    await laptop.tours.markSeen('locations@1');
    // Ditandai dua kali (selesai lalu diulang lewat tombol) tetap satu baris.
    await laptop.tours.markSeen('locations@1');

    const otherBrowser = await signIn(ana);
    expect(await otherBrowser.tours.seen()).toEqual(['locations@1']);

    const budiDevice = await signIn(budi);
    expect(await budiDevice.tours.seen()).toEqual([]);
  });

  it('kunci tanpa versi ditolak server', async () => {
    const tours = await signIn(await createAccount('cici'));
    await expect(tours.tours.markSeen('locations')).rejects.toThrow();
  });
});
