-- T-611a: isolasi ruang kerja per venue lewat RLS (FR-HT-04, NFR-HT-02, NFR-HT-03).
-- Pengguna trial (all_venues=false) hanya melihat/menulis venue tempat ia anggota;
-- pengguna akses-semua (all_venues=true, on-premise) tetap melihat semua.
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- Dua venue (trigger membuat Area Luar, display_settings, tipe lokasi "Lokasi", instruksi).
insert into public.venues (id, name) values
  ('da000000-0000-4000-8000-0000000000aa', 'Venue A'),
  ('da000000-0000-4000-8000-0000000000bb', 'Venue B');

-- Pengguna: A1/A2 anggota Venue A (trial), B1 anggota Venue B (trial), OMNI akses-semua.
insert into auth.users (id, email) values
  ('ab000000-0000-4000-8000-000000000001', 'a1@trial.test'),
  ('ab000000-0000-4000-8000-000000000002', 'a2@trial.test'),
  ('ab000000-0000-4000-8000-0000000000b1', 'b1@trial.test'),
  ('ab000000-0000-4000-8000-0000000000c1', 'omni@panduarah.test');
insert into public.profiles (user_id, full_name, email, role, all_venues) values
  ('ab000000-0000-4000-8000-000000000001', 'A1', 'a1@trial.test', 'admin', false),
  ('ab000000-0000-4000-8000-000000000002', 'A2', 'a2@trial.test', 'admin', false),
  ('ab000000-0000-4000-8000-0000000000b1', 'B1', 'b1@trial.test', 'admin', false),
  ('ab000000-0000-4000-8000-0000000000c1', 'OMNI', 'omni@panduarah.test', 'admin', true);
insert into public.venue_members (venue_id, user_id) values
  ('da000000-0000-4000-8000-0000000000aa', 'ab000000-0000-4000-8000-000000000001'),
  ('da000000-0000-4000-8000-0000000000aa', 'ab000000-0000-4000-8000-000000000002'),
  ('da000000-0000-4000-8000-0000000000bb', 'ab000000-0000-4000-8000-0000000000b1');

-- Data contoh di tiap venue (tipe lokasi bawaan dari trigger).
insert into public.locations (id, venue_id, location_type_id, name)
select 'fa000000-0000-4000-8000-0000000000a1', 'da000000-0000-4000-8000-0000000000aa',
  id, 'Loc A Asli' from public.location_types where venue_id = 'da000000-0000-4000-8000-0000000000aa';
insert into public.locations (id, venue_id, location_type_id, name)
select 'fb000000-0000-4000-8000-0000000000b1', 'da000000-0000-4000-8000-0000000000bb',
  id, 'Loc B Asli' from public.location_types where venue_id = 'da000000-0000-4000-8000-0000000000bb';
insert into public.facility_types (venue_id, name) values
  ('da000000-0000-4000-8000-0000000000aa', 'Toilet A'),
  ('da000000-0000-4000-8000-0000000000bb', 'Toilet B');

-- Entitas venue B dengan id tetap untuk uji tulis-ditolak: A1 tak bisa MEMBACA id ini
-- (RLS), jadi insert memakai nilai literal, bukan subselect dari tabel venue B.
insert into public.location_types (id, venue_id, name) values
  ('17000000-0000-4000-8000-0000000000bb', 'da000000-0000-4000-8000-0000000000bb', 'Tipe B');
insert into public.buildings (id, venue_id, name, code, footprint) values
  ('1b000000-0000-4000-8000-0000000000bb', 'da000000-0000-4000-8000-0000000000bb', 'Gedung B', 'GB',
   'SRID=4326;POLYGON((106.8 -6.1,106.9 -6.1,106.9 -6.2,106.8 -6.2,106.8 -6.1))');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('1f000000-0000-4000-8000-0000000000bb', 'da000000-0000-4000-8000-0000000000bb',
   '1b000000-0000-4000-8000-0000000000bb', 'Lantai 1 B', 1);
insert into public.facility_types (id, venue_id, name) values
  ('1c000000-0000-4000-8000-0000000000bb', 'da000000-0000-4000-8000-0000000000bb', 'ATM B');

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;

-- ---- Pengguna akses-semua melihat kedua venue ----
select pg_temp.as_user('ab000000-0000-4000-8000-0000000000c1');
select is(
  (select count(*)::int from public.venues
   where id in ('da000000-0000-4000-8000-0000000000aa', 'da000000-0000-4000-8000-0000000000bb')),
  2, 'OMNI (akses-semua) melihat kedua venue');

-- ---- Pengguna trial A1: hanya Venue A ----
select pg_temp.as_user('ab000000-0000-4000-8000-000000000001');
select is((select count(*)::int from public.venues where id = 'da000000-0000-4000-8000-0000000000aa'),
  1, 'A1 melihat venue sendiri (A)');
select is((select count(*)::int from public.venues where id = 'da000000-0000-4000-8000-0000000000bb'),
  0, 'A1 tidak melihat venue lain (B)');
select is((select count(*)::int from public.locations where venue_id = 'da000000-0000-4000-8000-0000000000aa'),
  1, 'A1 melihat lokasi venue A');
select is((select count(*)::int from public.locations where venue_id = 'da000000-0000-4000-8000-0000000000bb'),
  0, 'A1 tidak melihat lokasi venue B');

select lives_ok(
  $$ insert into public.locations (venue_id, location_type_id, name)
     select 'da000000-0000-4000-8000-0000000000aa', id, 'Loc A Baru'
     from public.location_types where venue_id = 'da000000-0000-4000-8000-0000000000aa' $$,
  'A1 bisa menambah lokasi di venue sendiri');
select throws_ok(
  $$ insert into public.locations (venue_id, location_type_id, name)
     values ('da000000-0000-4000-8000-0000000000bb', '17000000-0000-4000-8000-0000000000bb', 'Loc B Liar') $$,
  '42501', null, 'A1 tidak bisa menambah lokasi di venue B');

-- Update dan delete lintas-venue: tidak error tapi 0 baris (diverifikasi OMNI di akhir).
update public.locations set name = 'HACKED' where id = 'fb000000-0000-4000-8000-0000000000b1';
delete from public.locations where id = 'fb000000-0000-4000-8000-0000000000b1';

select throws_ok(
  $$ insert into public.venues (name) values ('Venue Liar Trial') $$,
  '42501', null, 'A1 (trial) tidak bisa membuat venue baru');
select is((select count(*)::int from public.facility_types where venue_id = 'da000000-0000-4000-8000-0000000000bb'),
  0, 'A1 tidak melihat jenis fasilitas venue B');
select is((select count(*)::int from public.profiles where user_id = 'ab000000-0000-4000-8000-0000000000b1'),
  0, 'A1 tidak melihat profil pengguna venue B');
select is((select count(*)::int from public.profiles where user_id = 'ab000000-0000-4000-8000-000000000002'),
  1, 'A1 melihat profil sesama anggota venue A');
select is((select count(*)::int from public.venue_members where venue_id = 'da000000-0000-4000-8000-0000000000bb'),
  0, 'A1 tidak melihat keanggotaan venue B');
select throws_ok(
  $$ insert into public.features (venue_id, floor_id, kind, geom, facility_type_id)
     values ('da000000-0000-4000-8000-0000000000bb', '1f000000-0000-4000-8000-0000000000bb',
             'facility', 'SRID=4326;POINT(106.8 -6.1)', '1c000000-0000-4000-8000-0000000000bb') $$,
  '42501', null, 'A1 tidak bisa menambah fitur di lantai venue B');

-- ---- Verifikasi update/delete A1 tidak berdampak ke venue B ----
select pg_temp.as_user('ab000000-0000-4000-8000-0000000000c1');
select is((select name from public.locations where id = 'fb000000-0000-4000-8000-0000000000b1'),
  'Loc B Asli', 'Lokasi B tidak diubah oleh A1');
select is((select count(*)::int from public.locations where id = 'fb000000-0000-4000-8000-0000000000b1'),
  1, 'Lokasi B tidak dihapus oleh A1');
select lives_ok(
  $$ insert into public.venues (name) values ('Venue OMNI Baru') $$,
  'OMNI (akses-semua) bisa membuat venue baru');
select is((select count(*)::int from public.locations where venue_id = 'da000000-0000-4000-8000-0000000000bb'),
  1, 'OMNI melihat lokasi venue B');

select * from finish();
rollback;
