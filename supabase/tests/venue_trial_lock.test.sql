-- T-612b: venue trial terkunci menolak tulis, tetapi tetap bisa dibaca (arch §3.5, FR-HT-09).
begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

insert into public.venues (id, name) values
  ('dc000000-0000-4000-8000-0000000000aa', 'Venue Trial Terkunci');

insert into auth.users (id, email) values
  ('ad000000-0000-4000-8000-000000000001', 'a1@kunci.test'),
  ('ad000000-0000-4000-8000-0000000000c1', 'omni@kunci.test');
insert into public.profiles (user_id, full_name, email, role, all_venues) values
  ('ad000000-0000-4000-8000-000000000001', 'A1', 'a1@kunci.test', 'admin', false),
  ('ad000000-0000-4000-8000-0000000000c1', 'OMNI', 'omni@kunci.test', 'super_admin', true);
insert into public.venue_members (venue_id, user_id) values
  ('dc000000-0000-4000-8000-0000000000aa', 'ad000000-0000-4000-8000-000000000001');

insert into app.server_settings (key, value) values ('hosting_mode', 'true');
insert into hosting.trials (venue_id, user_id, ends_at) values
  ('dc000000-0000-4000-8000-0000000000aa', 'ad000000-0000-4000-8000-000000000001',
   now() + interval '17 days');

-- Area Luar dibuat otomatis bersama venue (seed_venue): dipakai uji kunci edit.
create temp table outdoor as
  select id from public.floors
  where venue_id = 'dc000000-0000-4000-8000-0000000000aa' and is_outdoor;

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

-- ---- Sebelum terkunci: pengguna trial menulis seperti biasa ----
set local role authenticated;
select pg_temp.as_user('ad000000-0000-4000-8000-000000000001');
select lives_ok(
  $$ insert into public.location_types (venue_id, name)
     values ('dc000000-0000-4000-8000-0000000000aa', 'Sebelum kunci') $$,
  'Sebelum terkunci pengguna trial bisa menulis');
reset role;

-- ---- Hari ke-17: terkunci ----
update hosting.trials set locked_at = now()
where venue_id = 'dc000000-0000-4000-8000-0000000000aa';

set local role authenticated;
select pg_temp.as_user('ad000000-0000-4000-8000-000000000001');

select throws_ok(
  $$ insert into public.location_types (venue_id, name)
     values ('dc000000-0000-4000-8000-0000000000aa', 'Sesudah kunci') $$,
  '42501', null, 'Terkunci: tambah data ditolak');
select is(
  (select count(*)::int from public.location_types
   where venue_id = 'dc000000-0000-4000-8000-0000000000aa' and name = 'Sebelum kunci'),
  1, 'Terkunci: data venue tetap bisa dibaca');

update public.venues set name = 'Diubah setelah kunci'
where id = 'dc000000-0000-4000-8000-0000000000aa';
select is(
  (select name from public.venues where id = 'dc000000-0000-4000-8000-0000000000aa'),
  'Venue Trial Terkunci', 'Terkunci: ubah data tidak berpengaruh');

delete from public.location_types
where venue_id = 'dc000000-0000-4000-8000-0000000000aa' and name = 'Sebelum kunci';
select is(
  (select count(*)::int from public.location_types
   where venue_id = 'dc000000-0000-4000-8000-0000000000aa' and name = 'Sebelum kunci'),
  1, 'Terkunci: hapus data tidak berpengaruh');

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('floor-plans', 'dc000000-0000-4000-8000-0000000000aa/lt-1/denah.png') $$,
  '42501', null, 'Terkunci: unggah berkas ditolak');

select is(
  (select locked from public.trial_status()),
  true, 'trial_status tetap terbaca dan menyebut terkunci');

-- ---- Jalur security definer: publish dan kunci edit dijaga trigger ----
reset role;
select throws_ok(
  $$ insert into public.publications (venue_id, version, snapshot_path)
     values ('dc000000-0000-4000-8000-0000000000aa', 1, 'dc000000-0000-4000-8000-0000000000aa/v1.json') $$,
  '42501', null, 'Terkunci: publish ditolak walau lewat fungsi security definer');
select throws_ok(
  $$ insert into public.edit_locks (floor_id, user_id)
     select id, 'ad000000-0000-4000-8000-000000000001' from outdoor $$,
  '42501', null, 'Terkunci: kunci edit ditolak walau lewat fungsi security definer');

-- ---- Vendor (akses-semua) tetap bisa membantu ----
set local role authenticated;
select pg_temp.as_user('ad000000-0000-4000-8000-0000000000c1');
select lives_ok(
  $$ insert into public.location_types (venue_id, name)
     values ('dc000000-0000-4000-8000-0000000000aa', 'Dari vendor') $$,
  'Pengguna akses-semua tetap bisa menulis venue terkunci');
select is((select count(*)::int from public.trial_status()), 0,
  'trial_status kosong untuk bukan anggota venue trial');
reset role;

-- ---- Tanpa hosting_mode (on-premise) tidak ada venue terkunci ----
delete from app.server_settings where key = 'hosting_mode';
set local role authenticated;
select pg_temp.as_user('ad000000-0000-4000-8000-000000000001');
select lives_ok(
  $$ insert into public.location_types (venue_id, name)
     values ('dc000000-0000-4000-8000-0000000000aa', 'Tanpa mode hosting') $$,
  'Tanpa hosting_mode penguncian tidak berlaku');
reset role;

-- ---- Penjaga: tidak ada kebijakan tulis yang masih memakai predikat baca ----
select is(
  (select count(*)::int from pg_policies
   where schemaname in ('public', 'storage')
     and cmd in ('INSERT', 'UPDATE', 'DELETE')
     and coalesce(qual, '') || coalesce(with_check, '')
       ~ 'accessible_venue_(ids|keys)\(\)|can_access_(floor|location|location_type)\('),
  0, 'Semua kebijakan tulis memakai predikat tulis');

select * from finish();
rollback;
