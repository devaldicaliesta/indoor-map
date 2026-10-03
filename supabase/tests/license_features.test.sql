-- Fitur per paket (T-405).
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (id, email) values ('e4050000-0000-4000-8000-000000000001', 'ad@fitur.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e4050000-0000-4000-8000-000000000001', 'AD', 'ad@fitur.test', 'admin');

create function pg_temp.features(p_features text[]) returns void
language sql as $$
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values ('LIC-FITUR', jsonb_build_object('validFrom', '2020-01-01T00:00:00Z',
    'validUntil', '2099-01-01T00:00:00Z', 'features', to_jsonb(p_features)), 'x', 'active', 'manual');
$$;

create temp table target as
  select venue_id, id as floor_id from public.floors where not is_outdoor limit 1;
grant select on target to authenticated;

select pg_temp.features(array['cad_import']);
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "e4050000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
select is(public.license_features(), array['cad_import'], 'Admin membaca fitur lisensi berlaku');
select throws_ok(
  $$ insert into public.info_points (venue_id, floor_id, code, name, geom)
     select venue_id, floor_id, 'IP-F1', 'Info Point', 'SRID=4326;POINT(106.8 -6.2)' from target $$,
  'IM422', 'Info Point tidak termasuk paket lisensi ini.', 'Info Point ditolak tanpa fiturnya'
);
reset role;
select pg_temp.features(array['info_point']);
set local role authenticated;
select lives_ok(
  $$ insert into public.info_points (venue_id, floor_id, code, name, geom)
     select venue_id, floor_id, 'IP-F2', 'Info Point', 'SRID=4326;POINT(106.8 -6.2)' from target $$,
  'Info Point boleh dengan fiturnya'
);
reset role;
set local role anon;
select throws_ok('select public.license_features()', '42501', null, 'Pengunjung tidak membaca fitur');
reset role;
update public.licenses set is_current = false where is_current;
select is(app.license_active(), false, 'Tanpa lisensi tidak ada fitur (penulisan ditolak RLS)');

select * from finish();
rollback;
