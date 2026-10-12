-- T-612a: mode hosting dan kuota per venue (arch §3.4, FR-HT-05).
-- Inti yang dibuktikan: di project ter-hosting batas dibaca per venue trial dan pemakaian
-- dihitung per venue, sehingga satu trial tidak memakan kuota trial lain; tanpa `hosting_mode`
-- semuanya tetap seperti on-premise.
begin;
create extension if not exists pgtap with schema extensions;

select plan(25);

insert into public.venues (id, name) values
  ('db000000-0000-4000-8000-0000000000aa', 'Venue Trial A'),
  ('db000000-0000-4000-8000-0000000000bb', 'Venue Non-trial B');

insert into auth.users (id, email) values
  ('ac000000-0000-4000-8000-000000000001', 'a1@kuota.test'),
  ('ac000000-0000-4000-8000-000000000002', 'a2@kuota.test'),
  ('ac000000-0000-4000-8000-000000000003', 'a3@kuota.test'),
  ('ac000000-0000-4000-8000-0000000000c1', 'omni@kuota.test');
insert into public.profiles (user_id, full_name, email, role, all_venues) values
  ('ac000000-0000-4000-8000-000000000001', 'A1', 'a1@kuota.test', 'admin', false),
  ('ac000000-0000-4000-8000-000000000002', 'A2', 'a2@kuota.test', 'editor', false),
  ('ac000000-0000-4000-8000-000000000003', 'A3', 'a3@kuota.test', 'editor', false),
  ('ac000000-0000-4000-8000-0000000000c1', 'OMNI', 'omni@kuota.test', 'super_admin', true);
insert into public.venue_members (venue_id, user_id) values
  ('db000000-0000-4000-8000-0000000000aa', 'ac000000-0000-4000-8000-000000000001');

-- Empat gedung di A (= batas trial, 0052), dua di B: pembeda hitungan per venue dan global.
insert into public.buildings (venue_id, name, code) values
  ('db000000-0000-4000-8000-0000000000aa', 'Gedung A1', 'A1'),
  ('db000000-0000-4000-8000-0000000000aa', 'Gedung A2', 'A2'),
  ('db000000-0000-4000-8000-0000000000aa', 'Gedung A3', 'A3'),
  ('db000000-0000-4000-8000-0000000000aa', 'Gedung A4', 'A4'),
  ('db000000-0000-4000-8000-0000000000bb', 'Gedung B1', 'B1'),
  ('db000000-0000-4000-8000-0000000000bb', 'Gedung B2', 'B2');

insert into hosting.trials (venue_id, user_id, ends_at) values
  ('db000000-0000-4000-8000-0000000000aa', 'ac000000-0000-4000-8000-000000000001',
   now() + interval '17 days');

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

-- ---------------------------------------------------------------------
-- Tanpa hosting_mode: perilaku on-premise (NFR-HT-03)
-- ---------------------------------------------------------------------
-- Lisensi pengembangan hanya memberi kuota venue/gedung/lantai/Info Point, jadi batas lokasi
-- NULL = tak dibatasi. Baris `hosting.trials` sudah ada dan tetap tidak berpengaruh.
select ok(not app.hosting_mode(), 'hosting_mode mati secara bawaan');
select ok(
  not app.trial_venue('db000000-0000-4000-8000-0000000000aa'),
  'Tanpa hosting_mode venue tidak dihitung sebagai venue trial');
select is(
  app.quota_limit('locations', 'db000000-0000-4000-8000-0000000000aa'),
  null::integer,
  'Tanpa hosting_mode batas tetap dari lisensi server (lokasi tak dibatasi)');

-- ---------------------------------------------------------------------
-- Mode hosting menyala
-- ---------------------------------------------------------------------
insert into app.server_settings (key, value) values ('hosting_mode', 'true');

select ok(app.hosting_mode(), 'hosting_mode menyala');
select ok(
  app.trial_venue('db000000-0000-4000-8000-0000000000aa'),
  'Venue dengan baris trials aktif adalah venue trial');
select ok(
  not app.trial_venue('db000000-0000-4000-8000-0000000000bb'),
  'Venue tanpa baris trials memakai lisensi server (venue demo/vendor)');

select is(
  app.quota_limit('locations', 'db000000-0000-4000-8000-0000000000aa'),
  250, 'Batas lokasi venue trial = 250');
select is(
  app.quota_limit('locations', 'db000000-0000-4000-8000-0000000000bb'),
  null::integer, 'Batas lokasi venue non-trial tetap dari lisensi server');
select is(
  app.quota_limit('buildings', 'db000000-0000-4000-8000-0000000000aa'),
  4, 'Batas gedung venue trial = 4');

-- ---------------------------------------------------------------------
-- Pemakaian dihitung per venue, bukan global
-- ---------------------------------------------------------------------
select is(
  app.quota_used('buildings', 'db000000-0000-4000-8000-0000000000aa'),
  4, 'Pemakaian gedung venue A dihitung sendiri');
select is(
  app.quota_used('buildings', 'db000000-0000-4000-8000-0000000000bb'),
  2, 'Pemakaian gedung venue B dihitung sendiri');
select is(
  app.quota_used('buildings'),
  (select count(*)::int from public.buildings),
  'Tanpa venue pemakaian tetap global (dipakai lisensi server)');

-- ---------------------------------------------------------------------
-- Penegakan di server, lewat jalur pengguna biasa
-- ---------------------------------------------------------------------
set local role authenticated;
select pg_temp.as_user('ac000000-0000-4000-8000-000000000001');

select throws_ok(
  $$ insert into public.buildings (venue_id, name, code)
     values ('db000000-0000-4000-8000-0000000000aa', 'Gedung A5', 'A5') $$,
  'IM422', null, 'Gedung kelima di venue trial ditolak');
select throws_like(
  $$ insert into public.buildings (venue_id, name, code)
     values ('db000000-0000-4000-8000-0000000000aa', 'Gedung A5', 'A5') $$,
  '%Batas trial tercapai: gedung 4/4%',
  'Pesan memakai "Batas trial tercapai" walau lisensi server bukan paket trial');

select pg_temp.as_user('ac000000-0000-4000-8000-0000000000c1');
select lives_ok(
  $$ insert into public.buildings (venue_id, name, code)
     values ('db000000-0000-4000-8000-0000000000bb', 'Gedung B3', 'B3') $$,
  'Venue non-trial tidak terkena batas trial');

reset role;

-- ---------------------------------------------------------------------
-- Batas 2 pengguna per venue trial, ditegakkan pada keanggotaan venue
-- ---------------------------------------------------------------------
select lives_ok(
  $$ insert into public.venue_members (venue_id, user_id)
     values ('db000000-0000-4000-8000-0000000000aa', 'ac000000-0000-4000-8000-000000000002') $$,
  'Anggota kedua venue trial boleh ditambah');
select throws_like(
  $$ insert into public.venue_members (venue_id, user_id)
     values ('db000000-0000-4000-8000-0000000000aa', 'ac000000-0000-4000-8000-000000000003') $$,
  '%Batas trial tercapai: pengguna aktif 2/2%',
  'Anggota ketiga venue trial ditolak');

-- ---------------------------------------------------------------------
-- Storage: pemilik venue dibaca dari path objek
-- ---------------------------------------------------------------------
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, metadata) values
     ('floor-plans', 'db000000-0000-4000-8000-0000000000aa/lt-1/besar.png',
      jsonb_build_object('size', 6 * 1048576)) $$,
  'IM422', null, 'Berkas 6 MB ke venue trial ditolak (batas 5 MB)');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, metadata) values
     ('floor-plans', 'db000000-0000-4000-8000-0000000000aa/lt-1/pas.png',
      jsonb_build_object('size', 4 * 1048576)) $$,
  'Berkas 4 MB ke venue trial diterima');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, metadata) values
     ('floor-plans', 'db000000-0000-4000-8000-0000000000bb/lt-1/besar.png',
      jsonb_build_object('size', 6 * 1048576)) $$,
  'Berkas 6 MB ke venue non-trial tidak dibatasi lisensi server');
select is(
  app.quota_used('storageMb', 'db000000-0000-4000-8000-0000000000aa'),
  4, 'Pemakaian Storage dihitung per venue dari path objek');

-- ---------------------------------------------------------------------
-- Halaman Lisensi melihat angka venue sendiri (cakupan pemanggil)
-- ---------------------------------------------------------------------
select pg_temp.as_user('ac000000-0000-4000-8000-000000000001');
select is(
  app.quota_venue(), 'db000000-0000-4000-8000-0000000000aa'::uuid,
  'Cakupan kuota pengguna trial adalah venue keanggotaannya');
select is(
  (select quota from public.license_usage() where kind = 'locations'),
  250, 'license_usage pengguna trial memakai batas trial');
select is(
  (select used from public.license_usage() where kind = 'buildings'),
  4, 'license_usage pengguna trial memakai pemakaian venue-nya');

select pg_temp.as_user('ac000000-0000-4000-8000-0000000000c1');
select is(
  app.quota_venue(), null::uuid,
  'Pengguna akses-semua tidak punya cakupan venue (kuota global)');

select * from finish();
rollback;
