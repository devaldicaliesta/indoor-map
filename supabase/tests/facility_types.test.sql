-- Jenis fasilitas dan ikon unggahannya (T-112, FR-MAP-07).
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email) values
  ('e1000000-0000-4000-8000-000000000001', 'ed@facility.test'),
  ('e1000000-0000-4000-8000-000000000002', 'op@facility.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e1000000-0000-4000-8000-000000000001', 'ED', 'ed@facility.test', 'editor'),
  ('e1000000-0000-4000-8000-000000000002', 'OP', 'op@facility.test', 'operator');

insert into public.venues (id, name) values ('f1000000-0000-4000-8000-000000000001', 'Venue Uji Fasilitas');
insert into public.facility_types (id, venue_id, name, icon_path) values
  ('f1000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001', 'Toilet', 'builtin:toilet-male');
insert into public.features (venue_id, floor_id, kind, geom, facility_type_id)
select 'f1000000-0000-4000-8000-000000000001', id, 'facility', 'SRID=4326;POINT(106.8 -6.1)',
  'f1000000-0000-4000-8000-000000000002'
from public.floors where venue_id = 'f1000000-0000-4000-8000-000000000001' and is_outdoor;

select throws_ok(
  $$ insert into public.features (venue_id, floor_id, kind, geom)
     select venue_id, id, 'facility', 'SRID=4326;POINT(106.8 -6.1)' from public.floors
     where venue_id = 'f1000000-0000-4000-8000-000000000001' and is_outdoor $$,
  '23514',
  null,
  'Fasilitas tanpa jenis ditolak'
);
select throws_ok(
  $$ delete from public.facility_types where id = 'f1000000-0000-4000-8000-000000000002' $$,
  '23503',
  null,
  'Jenis yang masih dipakai fitur tidak bisa dihapus'
);

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;

select pg_temp.as_user('e1000000-0000-4000-8000-000000000001');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('public-assets', 'facility-types/f1000000-0000-4000-8000-000000000001/ikon.png') $$,
  'Editor: unggah ikon ke public-assets/facility-types'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('public-assets', 'venues/f1000000-0000-4000-8000-000000000001/logo.png') $$,
  '42501',
  null,
  'Editor: tidak bisa mengunggah logo venue'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'public-assets'
   and name = 'facility-types/f1000000-0000-4000-8000-000000000001/ikon.png'),
  1,
  'Editor: melihat metadata ikon (syarat menghapus berkas lama)'
);

select pg_temp.as_user('e1000000-0000-4000-8000-000000000002');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('public-assets', 'facility-types/f1000000-0000-4000-8000-000000000001/liar.png') $$,
  '42501',
  null,
  'Operator: tidak bisa mengunggah ikon fasilitas'
);
select throws_ok(
  $$ insert into public.facility_types (venue_id, name) values ('f1000000-0000-4000-8000-000000000001', 'Liar') $$,
  '42501',
  null,
  'Operator: tidak bisa menambah jenis fasilitas'
);

select * from finish();
rollback;
