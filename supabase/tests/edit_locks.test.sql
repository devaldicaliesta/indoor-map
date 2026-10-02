-- Kunci edit per lantai (T-301, migrasi 0014).
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email) values
  ('b4000000-0000-4000-8000-00000000000a', 'a@lock.test'),
  ('b4000000-0000-4000-8000-00000000000b', 'b@lock.test'),
  ('b4000000-0000-4000-8000-00000000000c', 'sa@lock.test'),
  ('b4000000-0000-4000-8000-00000000000d', 'op@lock.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('b4000000-0000-4000-8000-00000000000a', 'Ani', 'a@lock.test', 'editor'),
  ('b4000000-0000-4000-8000-00000000000b', 'Budi', 'b@lock.test', 'editor'),
  ('b4000000-0000-4000-8000-00000000000c', 'Super', 'sa@lock.test', 'super_admin'),
  ('b4000000-0000-4000-8000-00000000000d', 'Opi', 'op@lock.test', 'operator');
insert into public.venues (id, name) values ('a4000000-0000-4000-8000-000000000001', 'Venue Kunci');
insert into public.buildings (id, venue_id, name, code) values
  ('b4100000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'G', 'G');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('c4000000-0000-4000-8000-000000000001', 'a4000000-0000-4000-8000-000000000001', 'b4100000-0000-4000-8000-000000000001', 'GF', 0),
  ('c4000000-0000-4000-8000-000000000002', 'a4000000-0000-4000-8000-000000000001', 'b4100000-0000-4000-8000-000000000001', 'L1', 1);

create function pg_temp.as_user(p_id text) returns void language sql as $$
  select set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', p_id), true)
$$;
create function pg_temp.add_feature(p_floor text) returns void language sql as $$
  insert into public.features (venue_id, floor_id, kind, geom)
  values ('a4000000-0000-4000-8000-000000000001', p_floor::uuid, 'corridor',
          st_geomfromtext('POLYGON((106.8 -6.1,106.8001 -6.1,106.8001 -6.1001,106.8 -6.1))', 4326))
$$;

set local role authenticated;

-- Ani membuka lantai GF dan memegang kuncinya
select pg_temp.as_user('b4000000-0000-4000-8000-00000000000a');
select is((select full_name from public.acquire_edit_lock('c4000000-0000-4000-8000-000000000001')), 'Ani', 'Ani memegang kunci GF');
select lives_ok($$ select pg_temp.add_feature('c4000000-0000-4000-8000-000000000001') $$, 'Ani menyunting GF');

-- Budi membuka lantai yang sama: mode baca, dan server menolak tulisannya
select pg_temp.as_user('b4000000-0000-4000-8000-00000000000b');
select is((select full_name from public.acquire_edit_lock('c4000000-0000-4000-8000-000000000001')), 'Ani', 'Budi melihat GF dikunci Ani');
select throws_ok($$ select pg_temp.add_feature('c4000000-0000-4000-8000-000000000001') $$, '42501', null, 'Budi tidak bisa menulis fitur di GF');
select is((select count(*)::int from public.features where floor_id = 'c4000000-0000-4000-8000-000000000001'), 1, 'Budi tetap bisa membaca GF');
select lives_ok($$ select pg_temp.add_feature('c4000000-0000-4000-8000-000000000002') $$, 'Hanya lantai itu yang terkunci: Budi menyunting L1');
select lives_ok($$ select public.release_edit_lock('c4000000-0000-4000-8000-000000000001') $$, 'Melepas kunci orang lain tidak berbuat apa-apa');

-- 30 menit tanpa aktivitas: kunci Ani lepas dan Budi mendapatkannya
reset role;
update public.edit_locks set last_activity_at = now() - interval '31 minutes'
  where floor_id = 'c4000000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.as_user('b4000000-0000-4000-8000-00000000000b');
select is((select full_name from public.acquire_edit_lock('c4000000-0000-4000-8000-000000000001')), 'Budi', 'Kunci kedaluwarsa diambil Budi');

-- Operator tidak menyunting peta, jadi tidak bisa mengunci
select pg_temp.as_user('b4000000-0000-4000-8000-00000000000d');
select throws_ok($$ select public.acquire_edit_lock('c4000000-0000-4000-8000-000000000001') $$, '42501', null, 'Operator tidak bisa mengunci lantai');

-- Super Admin membuka paksa
select pg_temp.as_user('b4000000-0000-4000-8000-00000000000a');
select throws_ok($$ select public.take_over_edit_lock('c4000000-0000-4000-8000-000000000001') $$, '42501', null, 'Editor tidak bisa mengambil alih');
select pg_temp.as_user('b4000000-0000-4000-8000-00000000000c');
select lives_ok($$ select public.take_over_edit_lock('c4000000-0000-4000-8000-000000000001') $$, 'Super Admin mengambil alih');
reset role;

select results_eq(
  $$ select action, details ->> 'previous_user_id' from public.audit_events
     where entity_id = 'c4000000-0000-4000-8000-000000000001' $$,
  $$ values ('edit_lock_taken_over', 'b4000000-0000-4000-8000-00000000000b') $$,
  'Ambil alih dicatat dengan pemegang sebelumnya'
);

select * from finish();
rollback;
