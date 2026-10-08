-- Kuota paket ditegakkan di server (T-404).
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email) values
  ('e4040000-0000-4000-8000-000000000001', 'ad@quota.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e4040000-0000-4000-8000-000000000001', 'AD', 'ad@quota.test', 'admin');

create function pg_temp.as_admin() returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', 'e4040000-0000-4000-8000-000000000001', 'role', 'authenticated')::text, true)
$$;

-- Lisensi dengan kuota = pemakaian sekarang + tambahan per jenis.
create function pg_temp.quota(p_venues integer, p_buildings integer, p_floors integer, p_info integer)
returns void
language sql as $$
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values ('LIC-KUOTA', jsonb_build_object(
    'validFrom', '2020-01-01T00:00:00Z', 'validUntil', '2099-01-01T00:00:00Z', 'features', jsonb_build_array('info_point'),
    'quota', jsonb_build_object(
      'venues', app.quota_used('venues') + p_venues,
      'buildings', app.quota_used('buildings') + p_buildings,
      'floors', app.quota_used('floors') + p_floors,
      'infoPoints', app.quota_used('infoPoints') + p_info)),
    'x', 'active', 'manual');
$$;

create temp table venue as
  select v.id as venue_id, f.id as floor_id
  from public.venues v join public.floors f on f.venue_id = v.id and not f.is_outdoor
  limit 1;
grant select on venue to authenticated;

select pg_temp.quota(1, 0, 0, 1);
set local role authenticated;
select pg_temp.as_admin();

select lives_ok(
  $$ insert into public.venues (name) values ('Venue Terakhir Kuota') $$,
  'Venue terakhir dalam kuota boleh ditambah'
);
select throws_ok(
  $$ insert into public.venues (name) values ('Venue Lewat Kuota') $$,
  'IM422', null, 'Venue melebihi kuota ditolak di server'
);
select is(
  (select count(*)::int from public.floors f join public.venues v on v.id = f.venue_id
   where v.name = 'Venue Terakhir Kuota' and f.is_outdoor),
  1,
  'Area Luar venue baru tetap dibuat walau kuota lantai penuh'
);
select throws_ok(
  $$ insert into public.buildings (venue_id, name) select venue_id, 'Gedung Lewat' from venue $$,
  'IM422', null, 'Gedung melebihi kuota ditolak'
);
select throws_ok(
  $$ insert into public.floors (venue_id, building_id, name, level)
     select f.venue_id, f.building_id, 'Lantai Lewat', 99 from public.floors f
     join venue v on v.floor_id = f.id $$,
  'IM422', null, 'Lantai melebihi kuota ditolak'
);
select lives_ok(
  $$ insert into public.info_points (venue_id, floor_id, code, name, geom)
     select venue_id, floor_id, 'IP-K1', 'Info Point Terakhir', 'SRID=4326;POINT(106.8 -6.2)' from venue $$,
  'Info Point terakhir dalam kuota boleh ditambah'
);
select throws_ok(
  $$ insert into public.info_points (venue_id, floor_id, code, name, geom)
     select venue_id, floor_id, 'IP-K2', 'Info Point Lewat', 'SRID=4326;POINT(106.8 -6.2)' from venue $$,
  'IM422', null, 'Info Point melebihi kuota ditolak'
);
select results_eq(
  $$ select used = quota from public.license_usage()
     where kind in ('venues', 'buildings', 'floors', 'infoPoints') order by kind $$,
  $$ values (true), (true), (true), (true) $$,
  'Pemakaian sama dengan kuota untuk keempat jenis'
);
select is(
  (select quota - used from public.license_usage() where kind = 'floors'),
  0,
  'Pemakaian lantai tidak menghitung Area Luar'
);

reset role;
select pg_temp.quota(0, 0, 1, 0);
set local role authenticated;
select pg_temp.as_admin();
select lives_ok(
  $$ insert into public.floors (venue_id, building_id, name, level)
     select f.venue_id, f.building_id, 'Lantai Tambahan', 98 from public.floors f
     join venue v on v.floor_id = f.id $$,
  'Kuota lantai bertambah setelah paket diperbesar'
);

reset role;
set local role anon;
select throws_ok('select * from public.license_usage()', '42501', null,
  'Pengunjung tidak bisa membaca pemakaian kuota');
reset role;
select ok(
  not has_function_privilege('authenticated', 'app.quota_used(text)', 'execute'),
  'Penghitung kuota internal tidak bisa dipanggil langsung'
);

select * from finish();
rollback;
