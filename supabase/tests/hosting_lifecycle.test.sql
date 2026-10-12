-- T-615a: siklus hidup trial — pengingat, kunci, hapus, antrean.
begin;
create extension if not exists pgtap with schema extensions;
-- Mulai dari keadaan on-premise: test E2E dan integrasi sengaja membiarkan hosting_mode menyala.
delete from app.server_settings where key in ('hosting_mode', 'trial_capacity');

select plan(18);

insert into app.server_settings (key, value) values ('hosting_mode', 'true');

-- Tiga trial di fase berbeda: A hampir berakhir, B baru berakhir, C terkunci 8 hari.
insert into public.venues (id, name, slug) values
  ('d1000000-0000-4000-8000-0000000000aa', 'Trial A', 'trial-a'),
  ('d1000000-0000-4000-8000-0000000000bb', 'Trial B', 'trial-b'),
  ('d1000000-0000-4000-8000-0000000000cc', 'Trial C', 'trial-c');
insert into auth.users (id, email) values
  ('b2000000-0000-4000-8000-0000000000aa', 'a@siklus.id'),
  ('b2000000-0000-4000-8000-0000000000bb', 'b@siklus.id'),
  ('b2000000-0000-4000-8000-0000000000cc', 'c@siklus.id');
insert into public.profiles (user_id, full_name, email, role, all_venues) values
  ('b2000000-0000-4000-8000-0000000000aa', 'A', 'a@siklus.id', 'admin', false),
  ('b2000000-0000-4000-8000-0000000000bb', 'B', 'b@siklus.id', 'admin', false),
  ('b2000000-0000-4000-8000-0000000000cc', 'C', 'c@siklus.id', 'admin', false);
insert into hosting.trial_requests
  (id, name, institution, title, email, phone, building_type, building_size, language, status)
values
  ('e2000000-0000-4000-8000-0000000000aa', 'A', 'A', 'M', 'a@siklus.id', '+62 812 0000 0000',
   'office', 'lt5k', 'id', 'active'),
  ('e2000000-0000-4000-8000-0000000000bb', 'B', 'B', 'M', 'b@siklus.id', '+62 812 0000 0000',
   'office', 'lt5k', 'id', 'active'),
  ('e2000000-0000-4000-8000-0000000000cc', 'C', 'C', 'M', 'c@siklus.id', '+62 812 0000 0000',
   'office', 'lt5k', 'id', 'locked');
insert into hosting.trials (venue_id, user_id, request_id, started_at, ends_at, locked_at) values
  ('d1000000-0000-4000-8000-0000000000aa', 'b2000000-0000-4000-8000-0000000000aa',
   'e2000000-0000-4000-8000-0000000000aa', now() - interval '15 days', now() + interval '2 days',
   null),
  ('d1000000-0000-4000-8000-0000000000bb', 'b2000000-0000-4000-8000-0000000000bb',
   'e2000000-0000-4000-8000-0000000000bb', now() - interval '17 days', now() - interval '1 hour',
   null),
  ('d1000000-0000-4000-8000-0000000000cc', 'b2000000-0000-4000-8000-0000000000cc',
   'e2000000-0000-4000-8000-0000000000cc', now() - interval '25 days', now() - interval '8 days',
   now() - interval '8 days');
insert into public.venue_members (venue_id, user_id) values
  ('d1000000-0000-4000-8000-0000000000aa', 'b2000000-0000-4000-8000-0000000000aa'),
  ('d1000000-0000-4000-8000-0000000000bb', 'b2000000-0000-4000-8000-0000000000bb'),
  ('d1000000-0000-4000-8000-0000000000cc', 'b2000000-0000-4000-8000-0000000000cc');
-- Publikasi aktif A dan B (sebelum B terkunci) untuk uji license-service.
insert into public.publications (venue_id, version, snapshot_path, is_active) values
  ('d1000000-0000-4000-8000-0000000000aa', 1, 'x/v1.json', true),
  ('d1000000-0000-4000-8000-0000000000bb', 1, 'x/v1.json', true);
insert into storage.objects (bucket_id, name) values
  ('floor-plans', 'd1000000-0000-4000-8000-0000000000cc/lt-1/denah.png'),
  ('snapshots', 'd1000000-0000-4000-8000-0000000000cc/v1.json'),
  ('floor-plans', 'd1000000-0000-4000-8000-0000000000aa/lt-1/denah.png');

-- ---- Hari 14: pengingat ----
select is(
  (select array_agg(venue_id::text) from public.hosting_lifecycle_remind()),
  array['d1000000-0000-4000-8000-0000000000aa'], 'Pengingat hanya untuk trial yang 3 hari lagi berakhir');
select is((select count(*)::int from public.hosting_lifecycle_remind()), 0,
  'Pengingat dikirim sekali');

-- ---- Hari 17: kunci ----
select is(
  (select array_agg(venue_id::text) from public.hosting_lifecycle_lock()),
  array['d1000000-0000-4000-8000-0000000000bb'], 'Trial yang berakhir dikunci');
select is(
  (select status from hosting.trial_requests where id = 'e2000000-0000-4000-8000-0000000000bb'),
  'locked', 'Status permintaan menjadi locked (slot dilepas)');
select ok(app.venue_locked('d1000000-0000-4000-8000-0000000000bb'), 'Venue B terkunci');
select is((select count(*)::int from public.hosting_lifecycle_lock()), 0, 'Kunci sekali saja');
select is(
  (select array_agg(venue_id::text order by venue_id) from public.hosting_lifecycle_locked_venues()),
  array['d1000000-0000-4000-8000-0000000000bb', 'd1000000-0000-4000-8000-0000000000cc'],
  'Penanda "Trial berakhir" ditulis ulang untuk semua venue terkunci');
select is(
  (select array_agg(venue_id::text) from public.license_service_state()
   where venue_id in ('d1000000-0000-4000-8000-0000000000aa', 'd1000000-0000-4000-8000-0000000000bb')),
  array['d1000000-0000-4000-8000-0000000000aa'],
  'Lisensi berlaku lagi tidak memulihkan peta venue trial terkunci');

-- ---- Hari 24: hapus ----
select is(
  (select array_agg(slug) from public.hosting_lifecycle_expired()),
  array['trial-c'], 'Hanya trial yang terkunci 7 hari yang jatuh tempo dihapus');
select is(
  (select array_agg(bucket_id || ':' || name order by bucket_id, name)
   from public.hosting_lifecycle_files('d1000000-0000-4000-8000-0000000000cc')),
  array['floor-plans:d1000000-0000-4000-8000-0000000000cc/lt-1/denah.png',
        'snapshots:d1000000-0000-4000-8000-0000000000cc/v1.json',
        'snapshots:slugs/trial-c.json'],
  'Berkas venue dan penunjuk slug-nya didaftar untuk dihapus');
select throws_ok(
  $$ select public.hosting_lifecycle_purge('d1000000-0000-4000-8000-0000000000aa') $$,
  '22023', null, 'Venue trial yang belum jatuh tempo tidak bisa dihapus');
select lives_ok(
  $$ select public.hosting_lifecycle_purge('d1000000-0000-4000-8000-0000000000cc') $$,
  'Venue trial jatuh tempo dihapus');
select is(
  (select count(*)::int from public.venues where id = 'd1000000-0000-4000-8000-0000000000cc'),
  0, 'Venue dan datanya hilang');
select is(
  (select count(*)::int from auth.users where id = 'b2000000-0000-4000-8000-0000000000cc'),
  0, 'Akun pemohon dihapus');
select is(
  (select status from hosting.trial_requests where id = 'e2000000-0000-4000-8000-0000000000cc'),
  'deleted', 'Leads tetap ada dengan status deleted');

-- ---- Antrean ----
insert into hosting.trial_requests
  (id, name, institution, title, email, phone, building_type, building_size, language, status,
   queued_at)
values ('e2000000-0000-4000-8000-0000000000dd', 'D', 'D', 'M', 'd@siklus.id', '+62 812 0000 0000',
  'office', 'lt5k', 'id', 'queued', now());
insert into app.server_settings (key, value) values ('trial_capacity', '1');
select is(public.hosting_queue_next(), null::uuid,
  'Satu slot terisi (A aktif): antrean menunggu');
update app.server_settings set value = '2' where key = 'trial_capacity';
select is(public.hosting_queue_next(), 'e2000000-0000-4000-8000-0000000000dd'::uuid,
  'Slot kosong: permintaan antre tertua diaktifkan');

-- ---- Jadwal dan hak ----
select is((select count(*)::int from cron.job where jobname = 'trial-lifecycle'), 1,
  'Dijadwalkan tiap jam');

select * from finish();
rollback;
