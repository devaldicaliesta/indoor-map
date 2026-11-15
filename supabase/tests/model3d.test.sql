-- Objek 3D (T-571, migrasi 0069): bentuk props model3d dan unggahan GLB.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into public.venues (id, name) values ('a7100000-0000-4000-8000-000000000001', 'Venue Model');
insert into public.buildings (id, venue_id, name, code) values
  ('b7100000-0000-4000-8000-000000000001', 'a7100000-0000-4000-8000-000000000001', 'G', 'G');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('c7100000-0000-4000-8000-000000000001', 'a7100000-0000-4000-8000-000000000001',
   'b7100000-0000-4000-8000-000000000001', 'GF', 0);

create function pg_temp.add_model(p_props jsonb, p_wkt text default 'POINT(106.8 -6.1)')
returns void language sql as $$
  insert into public.features (venue_id, floor_id, kind, geom, props)
  values ('a7100000-0000-4000-8000-000000000001', 'c7100000-0000-4000-8000-000000000001',
          'model3d', st_geomfromtext(p_wkt, 4326), p_props)
$$;

select lives_ok($$ select pg_temp.add_model('{"model": "builtin:tree"}') $$,
  'model pustaka tanpa skala, rotasi, tinggi dasar');
select lives_ok(
  $$ select pg_temp.add_model('{"model": "models/a7100000-0000-4000-8000-000000000001/patung.glb",
     "modelScale": 2.5, "modelRotation": 90, "baseHeight": 3}') $$,
  'model unggahan dengan skala, rotasi, tinggi dasar');
select throws_ok($$ select pg_temp.add_model('{}') $$, '23514', null, 'tanpa model ditolak');
select throws_ok($$ select pg_temp.add_model('{"model": "https://contoh.id/x.glb"}') $$, '23514',
  null, 'URL luar ditolak');
select throws_ok($$ select pg_temp.add_model('{"model": "models/../x.glb"}') $$, '23514', null,
  'path keluar folder ditolak');
select throws_ok($$ select pg_temp.add_model('{"model": "builtin:tree", "modelScale": 0}') $$,
  '23514', null, 'skala 0 ditolak');
select throws_ok($$ select pg_temp.add_model('{"model": "builtin:tree", "modelRotation": "90"}') $$,
  '23514', null, 'rotasi bukan angka ditolak');
select throws_ok(
  $$ select pg_temp.add_model('{"model": "builtin:tree"}',
     'POLYGON((106.8 -6.1,106.8001 -6.1,106.8001 -6.1001,106.8 -6.1))') $$,
  '23514', null, 'model3d harus titik');

select ok((select 'model/gltf-binary' = any (allowed_mime_types) and file_size_limit = 5242880
           from storage.buckets where id = 'public-assets'),
  'public-assets menerima GLB sampai 5 MB');
select ok(
  (select count(*) = 3 from pg_policies
   where tablename = 'objects' and policyname like 'public_assets_models_%'),
  'policy tulis folder models');

select * from finish();
rollback;
