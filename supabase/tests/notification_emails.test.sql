-- T-598: notifikasi email — penerima per peran dan venue, preferensi, berhenti berlangganan,
-- pengingat lisensi H-30/H-7/H-1 dengan jam palsu.
begin;
create extension if not exists pgtap with schema extensions;

select plan(26);

insert into auth.users (id, email) values
  ('f5980000-0000-4000-8000-000000000001', 'super@notif.test'),
  ('f5980000-0000-4000-8000-000000000002', 'admin@notif.test'),
  ('f5980000-0000-4000-8000-000000000003', 'editor@notif.test'),
  ('f5980000-0000-4000-8000-000000000004', 'operator@notif.test'),
  ('f5980000-0000-4000-8000-000000000005', 'viewer@notif.test'),
  ('f5980000-0000-4000-8000-000000000006', 'admin-lain@notif.test'),
  ('f5980000-0000-4000-8000-000000000007', 'editor-nonaktif@notif.test');
insert into public.profiles (user_id, full_name, email, role, all_venues, is_active) values
  ('f5980000-0000-4000-8000-000000000001', 'Super', 'super@notif.test', 'super_admin', true, true),
  ('f5980000-0000-4000-8000-000000000002', 'Admin', 'admin@notif.test', 'admin', false, true),
  ('f5980000-0000-4000-8000-000000000003', 'Editor', 'editor@notif.test', 'editor', false, true),
  ('f5980000-0000-4000-8000-000000000004', 'Operator', 'operator@notif.test', 'operator', false, true),
  ('f5980000-0000-4000-8000-000000000005', 'Viewer', 'viewer@notif.test', 'viewer', false, true),
  ('f5980000-0000-4000-8000-000000000006', 'Admin Lain', 'admin-lain@notif.test', 'admin', false, true),
  ('f5980000-0000-4000-8000-000000000007', 'Nonaktif', 'editor-nonaktif@notif.test', 'editor', false, false);
-- Hanya Super Admin uji yang aktif dan berakses semua venue, agar penerima bisa dihitung pasti.
update public.profiles set is_active = false
where role = 'super_admin' and user_id <> 'f5980000-0000-4000-8000-000000000001';
update public.profiles set all_venues = false
where user_id::text not like 'f5980000-%';

insert into public.venues (id, name, timezone) values
  ('f5981000-0000-4000-8000-000000000001', 'RS Notifikasi', 'Asia/Makassar'),
  ('f5981000-0000-4000-8000-000000000002', 'Kampus Lain', 'Asia/Jakarta');
insert into public.buildings (id, venue_id, name, code) values
  ('f5982000-0000-4000-8000-000000000001', 'f5981000-0000-4000-8000-000000000001', 'Gedung', 'G');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('f5982000-0000-4000-8000-000000000002', 'f5981000-0000-4000-8000-000000000001',
   'f5982000-0000-4000-8000-000000000001', 'GF', 0);
insert into public.features (id, venue_id, floor_id, kind, geom) values
  ('f5982000-0000-4000-8000-000000000003', 'f5981000-0000-4000-8000-000000000001',
   'f5982000-0000-4000-8000-000000000002', 'corridor',
   st_geomfromtext('POLYGON((106.8 -6.1,106.8001 -6.1,106.8001 -6.1001,106.8 -6.1))', 4326));
insert into public.venue_members (venue_id, user_id) values
  ('f5981000-0000-4000-8000-000000000001', 'f5980000-0000-4000-8000-000000000002'),
  ('f5981000-0000-4000-8000-000000000001', 'f5980000-0000-4000-8000-000000000003'),
  ('f5981000-0000-4000-8000-000000000001', 'f5980000-0000-4000-8000-000000000004'),
  ('f5981000-0000-4000-8000-000000000001', 'f5980000-0000-4000-8000-000000000005'),
  ('f5981000-0000-4000-8000-000000000001', 'f5980000-0000-4000-8000-000000000007'),
  ('f5981000-0000-4000-8000-000000000002', 'f5980000-0000-4000-8000-000000000006');

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', 'aal1')::text, true)
$$;

create function pg_temp.recipients(p_kind text) returns text
language sql as $$
  select coalesce(string_agg(p.full_name, ',' order by p.full_name), '')
  from public.account_notices n join public.profiles p on p.user_id = n.user_id
  where n.kind = p_kind and p.user_id::text like 'f5980000-%'
$$;

-- ---- Publish: Super Admin, Admin, Editor venue itu; bukan pelaku ----
select pg_temp.as_user('f5980000-0000-4000-8000-000000000002');
select app.log_event('publish', 'venue', 'f5981000-0000-4000-8000-000000000001',
  '{"version": 4, "venue": "RS Notifikasi"}');
select is(pg_temp.recipients('publish'), 'Editor,Super',
  'Publish oleh Admin: Super Admin dan Editor venue itu, tanpa pelaku, Operator, Viewer, nonaktif, dan venue lain');
select is(
  (select details ->> 'venue' || ' v' || (details ->> 'version') || ' oleh ' || (details ->> 'actor')
   from public.account_notices n
   where n.kind = 'publish' and n.user_id = 'f5980000-0000-4000-8000-000000000003'),
  'RS Notifikasi v4 oleh Admin', 'Email publish menyebut venue, versi, dan pelaku');
select ok(
  (select details ->> 'unsubscribe_url' from public.account_notices n
   where n.kind = 'publish' and n.user_id = 'f5980000-0000-4000-8000-000000000003')
  ~ '^http://127\.0\.0\.1:5173/berhenti-langganan\?t=[0-9a-f]{48}$',
  'Email membawa tautan berhenti berlangganan ke Admin');
select app.log_event('settings_changed', 'venue', 'f5981000-0000-4000-8000-000000000001', '{}');
select is((select count(*)::int from public.account_notices where kind = 'publish'
           and user_id::text like 'f5980000-%'), 2, 'Peristiwa audit lain tidak mengirim email');

-- ---- Penutupan: Super Admin, Admin, Operator venue itu ----
select pg_temp.as_user('f5980000-0000-4000-8000-000000000004');
insert into public.closures (venue_id, feature_id, reason, starts_at, ends_at, created_by)
values ('f5981000-0000-4000-8000-000000000001', 'f5982000-0000-4000-8000-000000000003',
        'Perbaikan lift', now(), now() + interval '2 hours', 'f5980000-0000-4000-8000-000000000004');
select is(pg_temp.recipients('closure_created'), 'Admin,Super',
  'Penutupan oleh Operator: Super Admin dan Admin venue itu, tanpa pelaku dan Editor');
select is(
  (select details ->> 'reason' || ' · ' || (details ->> 'timezone') from public.account_notices n
   where n.kind = 'closure_created' and n.user_id = 'f5980000-0000-4000-8000-000000000002'),
  'Perbaikan lift · Asia/Makassar', 'Email penutupan memuat alasan dan zona waktu venue');

-- ---- Preferensi (RLS) ----
set local role authenticated;
select pg_temp.as_user('f5980000-0000-4000-8000-000000000003');
insert into public.notification_preferences (user_id, kind, enabled)
values ('f5980000-0000-4000-8000-000000000003', 'publish', false);
select is((select count(*)::int from public.notification_preferences), 1,
  'Pengguna melihat preferensinya sendiri');
select throws_ok(
  $$ insert into public.notification_preferences (user_id, kind, enabled)
     values ('f5980000-0000-4000-8000-000000000002', 'publish', false) $$,
  '42501', null, 'Pengguna tidak bisa mengubah preferensi orang lain');
select pg_temp.as_user('f5980000-0000-4000-8000-000000000002');
select is((select count(*)::int from public.notification_preferences), 0,
  'Preferensi orang lain tidak terbaca');
reset role;
set local role anon;
select throws_ok($$ select * from public.notification_preferences $$, '42501', null,
  'Tamu tidak bisa membaca preferensi');
reset role;

select pg_temp.as_user('f5980000-0000-4000-8000-000000000002');
select app.log_event('rollback', 'venue', 'f5981000-0000-4000-8000-000000000001',
  '{"version": 5, "source_version": 3, "venue": "RS Notifikasi"}');
select is(
  (select count(*)::int from public.account_notices
   where kind = 'publish' and user_id = 'f5980000-0000-4000-8000-000000000003'), 1,
  'Editor yang mematikan email publish tidak menerima email rollback');
select ok(
  exists (select 1 from public.account_notices
          where kind = 'publish' and user_id = 'f5980000-0000-4000-8000-000000000001'
            and details ->> 'origin' = 'rollback' and details ->> 'source_version' = '3'),
  'Rollback dikirim sebagai email publish dengan versi sumbernya');

-- ---- Berhenti berlangganan lewat token ----
select set_config('uji.token', (
  select substring(details ->> 'unsubscribe_url' from 't=(.*)$') from public.account_notices
  where kind = 'closure_created' and user_id = 'f5980000-0000-4000-8000-000000000002'), true);
set local role anon;
select is(public.notification_unsubscribe(current_setting('uji.token'), false), 'closure_created',
  'Tautan dibuka: jenis email ditampilkan tanpa mengubah apa pun');
reset role;
select is(app.wants_notification('f5980000-0000-4000-8000-000000000002', 'closure_created'), true,
  'Membuka tautan saja tidak mematikan langganan');
set local role anon;
select is(public.notification_unsubscribe(current_setting('uji.token'), true), 'closure_created',
  'Tamu dengan token mematikan langganan');
select is(public.notification_unsubscribe('salah', true), null, 'Token tidak dikenal ditolak');
reset role;
select is(app.wants_notification('f5980000-0000-4000-8000-000000000002', 'closure_created'), false,
  'Email penutupan Admin itu kini mati');
select is(app.wants_notification('f5980000-0000-4000-8000-000000000002', 'publish'), true,
  'Jenis lain tetap aktif');

-- ---- Pengingat lisensi dengan jam palsu ----
update public.licenses set is_current = false where is_current;
insert into public.licenses (license_id, payload, signature, status, source, is_current)
values ('LIC-UJI-598', jsonb_build_object('validUntil', '2027-03-31T00:00:00Z', 'licensee', 'RS Uji'),
        'x', 'active', 'manual', true);
select is(app.license_reminders('2027-02-27T00:00:00Z'), null, 'H-32: belum ada pengingat');
select is(app.license_reminders('2027-03-01T12:00:00Z'), 30, 'H-30: pengingat tahap 30');
select is(app.license_reminders('2027-03-02T12:00:00Z'), null, 'Tahap 30 tidak terkirim dua kali');
select is(app.license_reminders('2027-03-24T00:00:00Z'), 7, 'H-7: pengingat tahap 7');
select is(app.license_reminders('2027-03-30T06:00:00Z'), 1, 'H-1: pengingat tahap 1');
select is(app.license_reminders('2027-03-30T18:00:00Z'), null, 'Tahap 1 tidak terkirim dua kali');
select is(pg_temp.recipients('license_reminder'), 'Super,Super,Super',
  'Pengingat hanya ke Super Admin aktif, satu per tahap');

update public.licenses set is_current = false where is_current;
insert into public.licenses (license_id, payload, signature, status, source, is_current)
values ('LIC-UJI-598B', jsonb_build_object('validUntil', '2027-04-10T00:00:00Z'),
        'x', 'active', 'manual', true);
select is(app.license_reminders('2027-04-05T00:00:00Z') || ',' ||
          coalesce(app.license_reminders('2027-04-06T00:00:00Z')::text, '-'), '7,-',
  'Lisensi dipasang 5 hari sebelum berakhir: hanya tahap 7, tahap 30 tidak menyusul');

select * from finish();
rollback;
