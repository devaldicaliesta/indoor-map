-- T-613: slug venue — bentuk, keunikan, dan siapa yang boleh mengubahnya.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into public.venues (id, name, slug) values
  ('de000000-0000-4000-8000-0000000000aa', 'Venue Trial Slug', 'trial-slug'),
  ('de000000-0000-4000-8000-0000000000bb', 'Venue Lain', null);

insert into auth.users (id, email) values
  ('af000000-0000-4000-8000-000000000001', 'tr@slug.test'),
  ('af000000-0000-4000-8000-0000000000c1', 'ad@slug.test');
insert into public.profiles (user_id, full_name, email, role, all_venues) values
  ('af000000-0000-4000-8000-000000000001', 'Trial', 'tr@slug.test', 'admin', false),
  ('af000000-0000-4000-8000-0000000000c1', 'Admin', 'ad@slug.test', 'admin', true);
insert into public.venue_members (venue_id, user_id) values
  ('de000000-0000-4000-8000-0000000000aa', 'af000000-0000-4000-8000-000000000001');

-- ---- Bentuk dan keunikan ----
select throws_ok(
  $$ update public.venues set slug = 'Bukan Slug' where id = 'de000000-0000-4000-8000-0000000000bb' $$,
  '23514', null, 'Slug berhuruf besar/berspasi ditolak');
select throws_ok(
  $$ update public.venues set slug = 'de000000-0000-4000-8000-0000000000aa'
     where id = 'de000000-0000-4000-8000-0000000000bb' $$,
  '23514', null, 'Slug berbentuk UUID ditolak');
select throws_ok(
  $$ update public.venues set slug = 'trial-slug' where id = 'de000000-0000-4000-8000-0000000000bb' $$,
  '23505', null, 'Slug yang sudah dipakai venue lain ditolak');

-- ---- Siapa yang boleh mengubah ----
create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;
select pg_temp.as_user('af000000-0000-4000-8000-000000000001');
select throws_ok(
  $$ update public.venues set slug = 'nama-instansi-lain'
     where id = 'de000000-0000-4000-8000-0000000000aa' $$,
  '42501', null, 'Pengguna trial tidak bisa mengganti slug venue-nya');
select lives_ok(
  $$ update public.venues set name = 'Nama Baru Trial' where id = 'de000000-0000-4000-8000-0000000000aa' $$,
  'Pengguna trial tetap bisa mengubah data venue lain');

select pg_temp.as_user('af000000-0000-4000-8000-0000000000c1');
select lives_ok(
  $$ update public.venues set slug = 'venue-lain' where id = 'de000000-0000-4000-8000-0000000000bb' $$,
  'Pengguna akses-semua (vendor, on-premise) bisa mengisi slug');
reset role;

-- ---- Jalur tanpa pengguna: provisioning service role ----
select set_config('request.jwt.claims', '{"role": "service_role"}', true);
select lives_ok(
  $$ update public.venues set slug = 'trial-baru' where id = 'de000000-0000-4000-8000-0000000000aa' $$,
  'Provisioning (tanpa pengguna) bisa mengisi slug');
select is(
  (select slug from public.venues where id = 'de000000-0000-4000-8000-0000000000aa'),
  'trial-baru', 'Slug tersimpan');

select * from finish();
rollback;
