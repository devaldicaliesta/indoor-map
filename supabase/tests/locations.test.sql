-- Lokasi dasar, kategori, dan tautan unit (T-116).
begin;
create extension if not exists pgtap with schema extensions;

select plan(24);

insert into auth.users (id, email) values
  ('e2000000-0000-4000-8000-000000000001', 'ed@location.test'),
  ('e2000000-0000-4000-8000-000000000002', 'op@location.test'),
  ('e2000000-0000-4000-8000-000000000003', 'vw@location.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e2000000-0000-4000-8000-000000000001', 'ED', 'ed@location.test', 'editor'),
  ('e2000000-0000-4000-8000-000000000002', 'OP', 'op@location.test', 'operator'),
  ('e2000000-0000-4000-8000-000000000003', 'VW', 'vw@location.test', 'viewer');

-- Venue A (gedung + lantai + 3 unit + koridor) dan venue B (1 unit). Trigger venue membuat
-- tipe lokasi bawaan "Lokasi" untuk keduanya.
insert into public.venues (id, name) values
  ('a2000000-0000-4000-8000-00000000000a', 'Venue Uji Lokasi A'),
  ('a2000000-0000-4000-8000-00000000000b', 'Venue Uji Lokasi B');
insert into public.buildings (id, venue_id, name, code) values
  ('b2000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-00000000000a', 'Gedung', 'G');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('c2000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-00000000000a',
   'b2000000-0000-4000-8000-000000000001', 'L1', 1);
insert into public.features (id, venue_id, floor_id, kind, geom, unit_code, unit_status) values
  ('d2000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-00000000000a',
   'c2000000-0000-4000-8000-000000000001', 'unit',
   'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'A-001', 'vacant'),
  ('d2000000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-00000000000a',
   'c2000000-0000-4000-8000-000000000001', 'unit',
   'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'A-002', 'vacant'),
  ('d2000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-00000000000a',
   'c2000000-0000-4000-8000-000000000001', 'unit',
   'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'A-003', 'vacant');
insert into public.features (id, venue_id, floor_id, kind, geom)
values (
  'd2000000-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-00000000000a',
  'c2000000-0000-4000-8000-000000000001', 'corridor',
  'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))'
);
insert into public.features (id, venue_id, floor_id, kind, geom, unit_code)
select 'd2000000-0000-4000-8000-00000000000b', venue_id, id, 'unit',
  'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'B-001'
from public.floors where venue_id = 'a2000000-0000-4000-8000-00000000000b' and is_outdoor;

insert into public.categories (id, location_type_id, name)
select 'f2000000-0000-4000-8000-00000000000a', id, 'Pemeriksaan'
from public.location_types where venue_id = 'a2000000-0000-4000-8000-00000000000a';
insert into public.categories (id, location_type_id, name)
select 'f2000000-0000-4000-8000-00000000000b', id, 'Lain'
from public.location_types where venue_id = 'a2000000-0000-4000-8000-00000000000b';

-- Pemanggilan save_location: tipe = tipe bawaan venue.
create function pg_temp.save(
  p_id text, p_venue text, p_code text, p_name text, p_categories text[], p_units text[],
  p_primary text default null, p_logo text default null
) returns uuid
language sql as $$
  select public.save_location(
    p_id => p_id::uuid,
    p_venue_id => p_venue::uuid,
    p_location_type_id => (select id from public.location_types where venue_id = p_venue::uuid limit 1),
    p_name => p_name,
    p_category_ids => p_categories::uuid[],
    p_unit_ids => p_units::uuid[],
    p_photo_paths => '{}',
    p_code => p_code,
    p_logo_path => p_logo,
    p_primary_unit_id => p_primary::uuid
  )
$$;

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;
select pg_temp.as_user('e2000000-0000-4000-8000-000000000001');

-- Editor: lokasi dengan dua unit dan satu kategori
select lives_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-00000000000a',
       ' rad-01 ', 'Radiologi', '{f2000000-0000-4000-8000-00000000000a}',
       '{d2000000-0000-4000-8000-000000000001,d2000000-0000-4000-8000-000000000002}') $$,
  'Editor: menyimpan lokasi dengan dua unit dan satu kategori'
);
select is(
  (select count(*)::int from public.location_units where location_id = '11111111-0000-4000-8000-000000000001'),
  2,
  'Lokasi tertaut ke dua unit'
);
select is(
  (select feature_id from public.location_units
   where location_id = '11111111-0000-4000-8000-000000000001' and is_primary),
  'd2000000-0000-4000-8000-000000000001'::uuid,
  'Unit pertama menjadi unit utama'
);
select is(
  (select code from public.locations where id = '11111111-0000-4000-8000-000000000001'),
  'RAD-01',
  'Kode lokasi dirapikan dan disimpan huruf besar'
);
select is(
  (select count(*)::int from public.location_categories where location_id = '11111111-0000-4000-8000-000000000001'),
  1,
  'Kategori lokasi tersimpan'
);

-- Kode lokasi ganda (tanpa membedakan huruf besar/kecil) ditolak dengan nama pemiliknya
select throws_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-00000000000a',
       'Rad-01', 'Laboratorium', '{}', '{}') $$,
  'IM409',
  'Kode lokasi RAD-01 sudah dipakai lokasi "Radiologi".',
  'Kode lokasi ganda ditolak'
);

-- Unit yang dipakai lokasi aktif lain ditolak dengan kode unit dan nama lokasinya
select throws_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-00000000000a',
       'LAB-01', 'Laboratorium', '{}', '{d2000000-0000-4000-8000-000000000002}') $$,
  'IM409',
  'Unit A-002 sudah dipakai lokasi "Radiologi" yang masih aktif.',
  'Unit milik lokasi aktif lain ditolak'
);
select is(
  (select count(*)::int from public.locations where id = '11111111-0000-4000-8000-000000000002'),
  0,
  'Penolakan membatalkan seluruh penyimpanan (satu transaksi)'
);

select throws_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-00000000000a',
       null, 'Laboratorium', '{}', '{d2000000-0000-4000-8000-000000000004}') $$,
  'IM422',
  'Lokasi hanya bisa ditautkan ke unit di venue yang sama.',
  'Fitur yang bukan unit tidak bisa ditautkan'
);
select throws_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-00000000000a',
       null, 'Laboratorium', '{}', '{d2000000-0000-4000-8000-00000000000b}') $$,
  'IM422',
  'Lokasi hanya bisa ditautkan ke unit di venue yang sama.',
  'Unit venue lain tidak bisa ditautkan'
);
select throws_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-00000000000a',
       null, 'Laboratorium', '{f2000000-0000-4000-8000-00000000000b}', '{}') $$,
  'IM422',
  'Kategori tidak sesuai dengan tipe lokasi.',
  'Kategori dari tipe venue lain ditolak'
);
select throws_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-00000000000a',
       null, 'Laboratorium', '{}', '{}', null, 'venues/a2000000-0000-4000-8000-00000000000a/logo.png') $$,
  'IM422',
  'Logo dan foto lokasi harus diunggah ke folder lokasi venue ini.',
  'Logo di luar folder lokasi venue ditolak'
);
select throws_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-00000000000b',
       null, 'Radiologi', '{}', '{}') $$,
  'IM422',
  'Lokasi ini milik venue lain.',
  'Lokasi tidak bisa dipindah ke venue lain'
);

-- Menyimpan ulang mengganti tautan: A-001 dilepas lalu bisa dipakai lokasi lain
select lives_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-00000000000a',
       'RAD-01', 'Radiologi', '{}', '{d2000000-0000-4000-8000-000000000002}') $$,
  'Editor: melepas satu unit dan kategori dari lokasi'
);
select lives_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-00000000000a',
       'LAB-01', 'Laboratorium', '{}',
       '{d2000000-0000-4000-8000-000000000001,d2000000-0000-4000-8000-000000000003}',
       'd2000000-0000-4000-8000-000000000003') $$,
  'Editor: unit yang sudah dilepas bisa dipakai lokasi lain, dengan unit utama pilihan'
);
select is(
  (select feature_id from public.location_units
   where location_id = '11111111-0000-4000-8000-000000000002' and is_primary),
  'd2000000-0000-4000-8000-000000000003'::uuid,
  'Unit utama mengikuti pilihan'
);

-- Unit milik lokasi nonaktif permanen boleh dipakai lokasi lain (aturan integritas 4)
update public.locations set status = 'inactive_permanent'
where id = '11111111-0000-4000-8000-000000000001';
select lives_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-00000000000a',
       null, 'Apotek', '{}', '{d2000000-0000-4000-8000-000000000002}') $$,
  'Unit dari lokasi nonaktif permanen bisa ditautkan ke lokasi baru'
);

-- Unit yang diganti jenisnya di editor lepas dari lokasinya
update public.features set kind = 'corridor', unit_code = null, unit_status = null
where id = 'd2000000-0000-4000-8000-000000000003';
select is(
  (select count(*)::int from public.location_units where feature_id = 'd2000000-0000-4000-8000-000000000003'),
  0,
  'Unit yang menjadi koridor lepas dari lokasinya'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('public-assets', 'locations/a2000000-0000-4000-8000-00000000000a/logo.png') $$,
  'Editor: unggah logo ke public-assets/locations'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('public-assets', 'categories/a2000000-0000-4000-8000-00000000000a/ikon.png') $$,
  'Editor: unggah ikon ke public-assets/categories'
);

-- Operator dan Viewer: tidak bisa mengubah lokasi atau mengunggah berkasnya
select pg_temp.as_user('e2000000-0000-4000-8000-000000000002');
select throws_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-00000000000a',
       null, 'Liar', '{}', '{}') $$,
  '42501',
  null,
  'Operator: tidak bisa menyimpan lokasi'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('public-assets', 'locations/a2000000-0000-4000-8000-00000000000a/liar.png') $$,
  '42501',
  null,
  'Operator: tidak bisa mengunggah logo lokasi'
);

select pg_temp.as_user('e2000000-0000-4000-8000-000000000003');
select throws_ok(
  $$ select pg_temp.save('11111111-0000-4000-8000-000000000004', 'a2000000-0000-4000-8000-00000000000a',
       null, 'Liar', '{}', '{}') $$,
  '42501',
  null,
  'Viewer: tidak bisa menyimpan lokasi'
);

reset role;
set local role anon;
select throws_ok(
  $$ select public.save_location(gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
       'Liar', '{}', '{}', '{}') $$,
  '42501',
  null,
  'Pengunjung (anon) tidak bisa memanggil save_location'
);

select * from finish();
rollback;
