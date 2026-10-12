import { randomUUID } from 'node:crypto';
import { VenueIdSchema } from '@indoor/domain';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRepositories } from '../../src/client';
import type { Database } from '../../src/database.types';
import { DataError } from '../../src/errors';
import { totpCode } from '../support/totp';
import { sql } from './psql';

const url = process.env.SUPABASE_API_URL ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const PASSWORD = 'Integrasi-2026!';

const newDb = (key: string) =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function signedIn(email: string) {
  const db = newDb(anonKey);
  const repos = createRepositories(db);
  await repos.auth.signIn(email, PASSWORD);
  return repos;
}

// T-617: dasbor vendor lewat repository sungguhan — password saja tidak cukup; setelah kode
// aplikasi autentikator (TOTP Supabase Auth) leads terbaca dan tindakan berjalan.
describe.runIf(url && anonKey && serviceKey)('dasbor vendor dengan verifikasi dua langkah', () => {
  const service = newDb(serviceKey);
  const suffix = randomUUID().slice(0, 8);
  const staffEmail = `staf-${suffix}@vendor.test`;
  const trialEmail = `pemohon-${suffix}@rs-${suffix}.co.id`;
  const venueId = VenueIdSchema.parse(randomUUID());
  const userIds: string[] = [];
  let secret = '';

  async function createUser(email: string) {
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userIds.push(data.user.id);
    return data.user.id;
  }

  beforeAll(async () => {
    sql(`insert into app.server_settings (key, value) values ('hosting_mode', 'true')
         on conflict (key) do update set value = 'true'`);
    const staff = await createUser(staffEmail);
    sql(`insert into public.profiles (user_id, full_name, email, role, all_venues)
           values ('${staff}', 'Staf', '${staffEmail}', 'super_admin', true)
           on conflict (user_id) do update set role = 'super_admin', all_venues = true;
         insert into hosting.vendor_staff (user_id) values ('${staff}');`);
    const applicant = await createUser(trialEmail);
    sql(`insert into public.venues (id, name, slug) values ('${venueId}', 'RS ${suffix}', 'rs-${suffix}');
         insert into public.profiles (user_id, full_name, email, role, all_venues)
           values ('${applicant}', 'Rina', '${trialEmail}', 'admin', false)
           on conflict (user_id) do update set role = 'admin', all_venues = false;
         insert into public.venue_members (venue_id, user_id) values ('${venueId}', '${applicant}');
         with r as (
           insert into hosting.trial_requests
             (name, institution, title, email, phone, building_type, building_size, language, status)
           values ('Rina', 'RS ${suffix}', 'Manajer', '${trialEmail}', '+62 812 0000 0000',
             'hospital', 'lt5k', 'id', 'active')
           returning id)
         insert into hosting.trials (venue_id, user_id, request_id, ends_at)
           select '${venueId}', '${applicant}', r.id, now() + interval '10 days' from r;`);
  });

  afterAll(async () => {
    sql(`delete from public.venues where id = '${venueId}';
         delete from hosting.trial_requests where email = '${trialEmail}';
         delete from hosting.blocklist where value like '%${suffix}%';
         delete from hosting.vendor_actions where target like '%${suffix}%' or target = '${venueId}';
         delete from app.server_settings where key = 'hosting_mode';`);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it('password saja: diminta kode, leads ditolak server', async () => {
    const staff = await signedIn(staffEmail);
    await expect(staff.vendor.access()).resolves.toBe('mfa');
    await expect(staff.vendor.leads()).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(staff.mfa.status()).resolves.toEqual({ level: 'aal1', factorId: null });
  });

  it('mendaftarkan aplikasi autentikator membuka dasbor', async () => {
    const staff = await signedIn(staffEmail);
    // Pendaftaran yang ditinggalkan tidak menghalangi pendaftaran berikutnya.
    await staff.mfa.enrollTotp('PanduArah Vendor');
    const enrollment = await staff.mfa.enrollTotp('PanduArah Vendor');
    expect(enrollment.qrCode).toMatch(/^data:image\/svg\+xml/);
    secret = enrollment.secret;
    await expect(staff.mfa.verifyTotp(enrollment.factorId, '000000')).rejects.toMatchObject({
      kind: 'invalid',
    });
    await staff.mfa.verifyTotp(enrollment.factorId, totpCode(secret));
    await expect(staff.vendor.access()).resolves.toBe('ok');
    await expect(staff.mfa.status()).resolves.toEqual({
      level: 'aal2',
      factorId: enrollment.factorId,
    });
  });

  it('masuk berikutnya: password tidak bisa mengganti aplikasi autentikator', async () => {
    const staff = await signedIn(staffEmail);
    const status = await staff.mfa.status();
    expect(status.level).toBe('aal1');
    expect(status.factorId).not.toBeNull();
    await expect(staff.mfa.enrollTotp('PanduArah Vendor')).rejects.toBeInstanceOf(DataError);
    await staff.mfa.verifyTotp(status.factorId ?? '', totpCode(secret));
    await expect(staff.vendor.access()).resolves.toBe('ok');
  });

  it('leads, perpanjang, blokir, dan kunci lewat siklus hidup', async () => {
    const staff = await signedIn(staffEmail);
    const { factorId } = await staff.mfa.status();
    await staff.mfa.verifyTotp(factorId ?? '', totpCode(secret));

    expect(await staff.vendor.capacity()).toBeGreaterThan(0);
    const lead = (await staff.vendor.leads()).find((l) => l.email === trialEmail);
    expect(lead?.trial?.venueId).toBe(venueId);

    const endsAt = await staff.vendor.extend(venueId, 3);
    expect(Date.parse(endsAt)).toBeGreaterThan(Date.now() + 12 * 86_400_000);
    await expect(staff.vendor.extend(venueId, 15)).rejects.toThrow('sisa 14 hari');

    await expect(staff.vendor.block(`RS-${suffix}.co.id`, 'uji')).resolves.toBe('domain');
    expect((await staff.vendor.blocklist()).map((b) => b.value)).toContain(`rs-${suffix}.co.id`);
    await expect(staff.vendor.block('gmail.com', '')).rejects.toThrow('Domain email umum');
    await staff.vendor.unblock(`rs-${suffix}.co.id`);

    await staff.vendor.lock(venueId);
    const run = await staff.vendor.runLifecycle();
    expect(run.locked).toBeGreaterThanOrEqual(1);
    const locked = (await staff.vendor.leads()).find((l) => l.email === trialEmail);
    expect(locked?.status).toBe('locked');
    expect(locked?.trial?.lockedAt).not.toBeNull();
  });

  it('pengguna trial tidak bisa membaca leads walau memakai fungsi yang sama', async () => {
    const applicant = await signedIn(trialEmail);
    await expect(applicant.vendor.access()).resolves.toBe('denied');
    await expect(applicant.vendor.leads()).rejects.toMatchObject({ kind: 'forbidden' });
  });
});
