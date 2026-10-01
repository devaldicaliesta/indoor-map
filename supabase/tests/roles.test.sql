-- Otorisasi per role di tabel venues, features, closures, profiles (T-009, FR-AUTH-04).
begin;
create extension if not exists pgtap with schema extensions;

select plan(20);

insert into auth.users (id, email) values
  ('e0000000-0000-4000-8000-000000000001', 'sa@role.test'),
  ('e0000000-0000-4000-8000-000000000002', 'ad@role.test'),
  ('e0000000-0000-4000-8000-000000000003', 'ed@role.test'),
  ('e0000000-0000-4000-8000-000000000004', 'op@role.test'),
  ('e0000000-0000-4000-8000-000000000005', 'vw@role.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e0000000-0000-4000-8000-000000000001', 'SA', 'sa@role.test', 'super_admin'),
  ('e0000000-0000-4000-8000-000000000002', 'AD', 'ad@role.test', 'admin'),
  ('e0000000-0000-4000-8000-000000000003', 'ED', 'ed@role.test', 'editor'),
  ('e0000000-0000-4000-8000-000000000004', 'OP', 'op@role.test', 'operator'),
  ('e0000000-0000-4000-8000-000000000005', 'VW', 'vw@role.test', 'viewer');

insert into public.venues (id, name) values ('f0000000-0000-4000-8000-000000000001', 'Venue Uji Role');
insert into public.connectors (id, venue_id, kind, name, is_accessible)
values ('f0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'stairs', 'Tangga', false);

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

create function pg_temp.update_profile(p_email text, p_role public.app_role, p_name text) returns integer
language plpgsql as $$
declare n integer;
begin
  update public.profiles set role = coalesce(p_role, role), full_name = coalesce(p_name, full_name)
  where email = p_email;
  get diagnostics n = row_count;
  return n;
end $$;

create function pg_temp.floor_id() returns uuid
language sql as $$
  select id from public.floors where venue_id = 'f0000000-0000-4000-8000-000000000001' and is_outdoor
$$;

-- Satu blok per role: [venues insert, features insert, closures insert, profiles update role]
set local role authenticated;

-- Super Admin
select pg_temp.as_user('e0000000-0000-4000-8000-000000000001');
select lives_ok($$ insert into public.venues (name) values ('SA venue') $$, 'Super Admin: insert venues');
select lives_ok($$ insert into public.features (venue_id, floor_id, kind, geom) values ('f0000000-0000-4000-8000-000000000001', pg_temp.floor_id(), 'wall', 'SRID=4326;LINESTRING(106.8 -6.1, 106.81 -6.1)') $$, 'Super Admin: insert features');
select lives_ok($$ insert into public.closures (venue_id, connector_id, reason) values ('f0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002', 'SA') $$, 'Super Admin: insert closures');
select is(pg_temp.update_profile('vw@role.test', null, 'VW2'), 1, 'Super Admin: ubah profil');

-- Admin
select pg_temp.as_user('e0000000-0000-4000-8000-000000000002');
select lives_ok($$ insert into public.venues (name) values ('AD venue') $$, 'Admin: insert venues');
select lives_ok($$ insert into public.features (venue_id, floor_id, kind, geom) values ('f0000000-0000-4000-8000-000000000001', pg_temp.floor_id(), 'wall', 'SRID=4326;LINESTRING(106.8 -6.1, 106.81 -6.1)') $$, 'Admin: insert features');
select lives_ok($$ insert into public.closures (venue_id, connector_id, reason) values ('f0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002', 'AD') $$, 'Admin: insert closures');
select is(pg_temp.update_profile('vw@role.test', 'super_admin', null), 0, 'Admin: tidak bisa ubah role');

-- Editor
select pg_temp.as_user('e0000000-0000-4000-8000-000000000003');
select throws_ok($$ insert into public.venues (name) values ('ED venue') $$, '42501', null, 'Editor: insert venues ditolak');
select lives_ok($$ insert into public.features (venue_id, floor_id, kind, geom) values ('f0000000-0000-4000-8000-000000000001', pg_temp.floor_id(), 'wall', 'SRID=4326;LINESTRING(106.8 -6.1, 106.81 -6.1)') $$, 'Editor: insert features');
select throws_ok($$ insert into public.closures (venue_id, connector_id, reason) values ('f0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002', 'ED') $$, '42501', null, 'Editor: insert closures ditolak');
select is(pg_temp.update_profile('ed@role.test', 'super_admin', null), 0, 'Editor: tidak bisa menaikkan role sendiri');

-- Operator
select pg_temp.as_user('e0000000-0000-4000-8000-000000000004');
select throws_ok($$ insert into public.venues (name) values ('OP venue') $$, '42501', null, 'Operator: insert venues ditolak');
select throws_ok($$ insert into public.features (venue_id, floor_id, kind, geom) values ('f0000000-0000-4000-8000-000000000001', pg_temp.floor_id(), 'wall', 'SRID=4326;LINESTRING(106.8 -6.1, 106.81 -6.1)') $$, '42501', null, 'Operator: insert features ditolak');
select lives_ok($$ insert into public.closures (venue_id, connector_id, reason) values ('f0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002', 'OP') $$, 'Operator: insert closures');
select isnt_empty($$ select id from public.features $$, 'Operator: bisa membaca peta');

-- Viewer
select pg_temp.as_user('e0000000-0000-4000-8000-000000000005');
select throws_ok($$ insert into public.venues (name) values ('VW venue') $$, '42501', null, 'Viewer: insert venues ditolak');
select throws_ok($$ insert into public.features (venue_id, floor_id, kind, geom) values ('f0000000-0000-4000-8000-000000000001', pg_temp.floor_id(), 'wall', 'SRID=4326;LINESTRING(106.8 -6.1, 106.81 -6.1)') $$, '42501', null, 'Viewer: insert features ditolak');
select throws_ok($$ insert into public.closures (venue_id, connector_id, reason) values ('f0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000002', 'VW') $$, '42501', null, 'Viewer: insert closures ditolak');
select isnt_empty($$ select id from public.venues $$, 'Viewer: bisa membaca venues');

reset role;
select * from finish();
rollback;
