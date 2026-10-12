import { randomUUID } from 'node:crypto';
import { env } from '../env';
import { sql } from './license';

// Dasbor vendor (T-617) untuk E2E: staf vendor, trial, dan leads dibuat langsung di database
// karena alur aslinya lewat form landing dan email. Verifikasi dua langkah memakai TOTP asli.

const quote = (value: string) => value.replaceAll("'", "''");

/** Akun Auth dengan password seed, tanpa profil. */
export function createAuthUser(email: string): string {
  const userId = randomUUID();
  sql(`insert into auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
         confirmation_token, recovery_token, email_change_token_new, email_change)
       values ('00000000-0000-0000-0000-000000000000', '${userId}', 'authenticated',
         'authenticated', '${email}',
         extensions.crypt('${quote(env.password)}', extensions.gen_salt('bf')),
         now(), '{"provider": "email", "providers": ["email"]}', '{}',
         now(), now(), '', '', '', '');
       insert into auth.identities (
         id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
       values (gen_random_uuid(), '${userId}', '${userId}', 'email',
         jsonb_build_object('sub', '${userId}', 'email', '${email}', 'email_verified', true),
         now(), now(), now());`);
  return userId;
}

export interface VendorFixture {
  tag: string;
  staffEmail: string;
  applicantEmail: string;
  /** Instansi per peran di dasbor: aktif (diperpanjang lalu dikunci), aktif (dihapus), antre. */
  institutions: { extend: string; remove: string; queued: string };
  venueIds: string[];
  userIds: string[];
}

function addTrial(tag: string, institution: string, email: string, endsInDays: number) {
  const venueId = randomUUID();
  const userId = createAuthUser(email);
  sql(`insert into public.venues (id, name, slug)
         values ('${venueId}', '${institution}', 'e2e-${venueId.slice(0, 8)}');
       insert into public.profiles (user_id, full_name, email, role, all_venues)
         values ('${userId}', 'Pemohon ${tag}', '${email}', 'admin', false);
       insert into public.venue_members (venue_id, user_id) values ('${venueId}', '${userId}');
       with r as (
         insert into hosting.trial_requests
           (name, institution, title, email, phone, building_type, building_size, language,
            status, verified_at)
         values ('Pemohon ${tag}', '${institution}', 'Manajer Fasilitas', '${email}',
           '+62 812 3456 7890', 'hospital', 'lt5k', 'id', 'active', now())
         returning id)
       insert into hosting.trials (venue_id, user_id, request_id, ends_at)
         select '${venueId}', '${userId}', r.id, now() + interval '${endsInDays} days' from r;`);
  return { venueId, userId };
}

export function createVendorFixture(): VendorFixture {
  const tag = randomUUID().slice(0, 8);
  const staffEmail = `staf-${tag}@vendor.test`;
  const applicantEmail = `rina-${tag}@rs-${tag}.co.id`;
  const institutions = {
    extend: `RS Perpanjang ${tag}`,
    remove: `RS Hapus ${tag}`,
    queued: `Mal Antre ${tag}`,
  };
  sql(`insert into app.server_settings (key, value) values ('hosting_mode', 'true')
         on conflict (key) do update set value = 'true'`);
  const staffId = createAuthUser(staffEmail);
  sql(`insert into public.profiles (user_id, full_name, email, role, all_venues)
         values ('${staffId}', 'Staf Vendor', '${staffEmail}', 'super_admin', true);
       insert into hosting.vendor_staff (user_id) values ('${staffId}');
       insert into hosting.trial_requests
         (name, institution, title, email, phone, building_type, building_size, language,
          status, verified_at, queued_at)
       values ('Budi ${tag}', '${institutions.queued}', 'Direktur', 'budi-${tag}@mal-${tag}.co.id',
         '+62 811 0000 0000', 'mall', '20k-50k', 'id', 'queued', now(), now());`);
  const extend = addTrial(tag, institutions.extend, applicantEmail, 5);
  const remove = addTrial(tag, institutions.remove, `sari-${tag}@rs2-${tag}.co.id`, 12);
  return {
    tag,
    staffEmail,
    applicantEmail,
    institutions,
    venueIds: [extend.venueId, remove.venueId],
    userIds: [staffId, extend.userId, remove.userId],
  };
}

/**
 * Termasuk ruang kerja yang dibuat siklus hidup untuk permintaan antre (slot yang dilepas saat
 * dasbor mengunci trial langsung dipakai antrean). `hosting_mode` dibiarkan, sama dengan
 * `removeHostedTrial`: spek lain mungkin memakainya.
 */
export function removeVendorFixture(fixture: VendorFixture) {
  const ids = (values: string[]) => values.map((id) => `'${id}'`).join(', ');
  sql(`delete from public.venues where id in (${ids(fixture.venueIds)}) or id in (
         select t.venue_id from hosting.trials t
         join hosting.trial_requests r on r.id = t.request_id
         where r.institution like '%${fixture.tag}');
       delete from hosting.trial_requests where institution like '%${fixture.tag}';
       delete from hosting.blocklist where value like '%${fixture.tag}%';
       delete from auth.users where id in (${ids(fixture.userIds)})
         or email like '%${fixture.tag}%';`);
}
