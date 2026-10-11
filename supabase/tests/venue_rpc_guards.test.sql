-- T-611c: guard venue pada fungsi RPC `security definer` (NFR-HT-02, jalur RPC).
-- Trial A1 (anggota venue A) ditolak memanggil fungsi definer untuk venue B,
-- tetapi boleh untuk venue A; pengguna akses-semua boleh keduanya.
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

insert into public.venues (id, name) values
  ('da000000-0000-4000-8000-0000000000aa', 'Venue A'),
  ('da000000-0000-4000-8000-0000000000bb', 'Venue B');

insert into auth.users (id, email) values
  ('ab000000-0000-4000-8000-000000000001', 'a1@trial.test'),
  ('ab000000-0000-4000-8000-0000000000c1', 'omni@panduarah.test');
insert into public.profiles (user_id, full_name, email, role, all_venues) values
  ('ab000000-0000-4000-8000-000000000001', 'A1', 'a1@trial.test', 'admin', false),
  ('ab000000-0000-4000-8000-0000000000c1', 'OMNI', 'omni@panduarah.test', 'admin', true);
insert into public.venue_members (venue_id, user_id) values
  ('da000000-0000-4000-8000-0000000000aa', 'ab000000-0000-4000-8000-000000000001');

-- Lantai venue B dengan id tetap (A1 tak bisa MEMBACA id ini lewat RLS).
insert into public.buildings (id, venue_id, name, code, footprint) values
  ('1b000000-0000-4000-8000-0000000000bb', 'da000000-0000-4000-8000-0000000000bb', 'Gedung B', 'GB',
   'SRID=4326;POLYGON((106.8 -6.1,106.9 -6.1,106.9 -6.2,106.8 -6.2,106.8 -6.1))');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('1f000000-0000-4000-8000-0000000000bb', 'da000000-0000-4000-8000-0000000000bb',
   '1b000000-0000-4000-8000-0000000000bb', 'Lantai 1 B', 1);

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;

-- ---- Trial A1 ----
select pg_temp.as_user('ab000000-0000-4000-8000-000000000001');
select throws_ok(
  $$ select public.publish_begin('da000000-0000-4000-8000-0000000000bb') $$,
  '42501', null, 'A1 tidak bisa publish_begin venue B');
select lives_ok(
  $$ select public.publish_begin('da000000-0000-4000-8000-0000000000aa') $$,
  'A1 bisa publish_begin venue sendiri (A)');
select throws_ok(
  $$ select public.acquire_edit_lock('1f000000-0000-4000-8000-0000000000bb') $$,
  '42501', null, 'A1 tidak bisa acquire_edit_lock lantai venue B');
select lives_ok(
  $$ select public.acquire_edit_lock((select id from public.floors
       where venue_id = 'da000000-0000-4000-8000-0000000000aa' and is_outdoor)) $$,
  'A1 bisa acquire_edit_lock lantai venue sendiri (A)');

-- ---- Akses-semua ----
select pg_temp.as_user('ab000000-0000-4000-8000-0000000000c1');
select lives_ok(
  $$ select public.publish_begin('da000000-0000-4000-8000-0000000000bb') $$,
  'OMNI (akses-semua) bisa publish_begin venue B');
select lives_ok(
  $$ select public.acquire_edit_lock('1f000000-0000-4000-8000-0000000000bb') $$,
  'OMNI (akses-semua) bisa acquire_edit_lock lantai venue B');

select * from finish();
rollback;
