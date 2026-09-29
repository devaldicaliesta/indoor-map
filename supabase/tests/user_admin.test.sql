-- Super Admin terakhir dan catatan perubahan pengguna (T-009, migrasi 0003).
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email) values
  ('c1000000-0000-4000-8000-000000000001', 'sa1@users.test'),
  ('c1000000-0000-4000-8000-000000000002', 'ed1@users.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('c1000000-0000-4000-8000-000000000001', 'SA1', 'sa1@users.test', 'super_admin'),
  ('c1000000-0000-4000-8000-000000000002', 'ED1', 'ed1@users.test', 'editor');
-- Super Admin dari seed dihapus agar SA1 menjadi satu-satunya Super Admin.
delete from public.profiles where user_id = '00000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "c1000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select throws_ok(
  $$ update public.profiles set role = 'admin' where email = 'sa1@users.test' $$,
  'IM409', null, 'Super Admin satu-satunya tidak bisa menurunkan role dirinya'
);
select throws_ok(
  $$ update public.profiles set is_active = false where email = 'sa1@users.test' $$,
  'IM409', null, 'Super Admin satu-satunya tidak bisa dinonaktifkan'
);
select lives_ok(
  $$ update public.profiles set role = 'super_admin' where email = 'ed1@users.test' $$,
  'Super Admin bisa mengangkat Super Admin lain'
);
select lives_ok(
  $$ update public.profiles set role = 'admin' where email = 'sa1@users.test' $$,
  'Setelah ada Super Admin lain, penurunan role diizinkan'
);
reset role;

select results_eq(
  $$ select user_id, details ->> 'to' from public.audit_events
     where action = 'role_changed' and entity_id = 'c1000000-0000-4000-8000-000000000002' $$,
  $$ values ('c1000000-0000-4000-8000-000000000001'::uuid, 'super_admin') $$,
  'role_changed mencatat pelaku dan role baru'
);

update public.profiles set is_active = false where email = 'sa1@users.test';
select is(
  (select count(*)::int from public.audit_events
   where action = 'user_deactivated' and entity_id = 'c1000000-0000-4000-8000-000000000001'),
  1, 'Penonaktifan dicatat sebagai user_deactivated'
);
select throws_ok(
  $$ delete from public.profiles where email = 'ed1@users.test' $$,
  'IM409', null, 'Super Admin aktif terakhir tidak bisa dihapus'
);

select * from finish();
rollback;
