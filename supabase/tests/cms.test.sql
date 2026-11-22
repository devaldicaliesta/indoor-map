-- Penguatan CMS (T-573): edit massal + undo + audit, pustaka media, dasbor venue, TC-SEC-78.
begin;
create extension if not exists pgtap with schema extensions;

select plan(27);

insert into auth.users (id, email) values
  ('e5730000-0000-4000-8000-000000000001', 'ed@cms.test'),
  ('e5730000-0000-4000-8000-000000000002', 'op@cms.test'),
  ('e5730000-0000-4000-8000-000000000003', 'vw@cms.test'),
  ('e5730000-0000-4000-8000-000000000004', 'ad@cms.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e5730000-0000-4000-8000-000000000001', 'ED', 'ed@cms.test', 'editor'),
  ('e5730000-0000-4000-8000-000000000002', 'OP', 'op@cms.test', 'operator'),
  ('e5730000-0000-4000-8000-000000000003', 'VW', 'vw@cms.test', 'viewer'),
  ('e5730000-0000-4000-8000-000000000004', 'AD', 'ad@cms.test', 'admin');

create function pg_temp.as_user(p_id text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
$$;

insert into public.venues (id, name) values
  ('a5730000-0000-4000-8000-00000000000a', 'Venue CMS'),
  ('a5730000-0000-4000-8000-00000000000b', 'Venue CMS Lain');
insert into public.buildings (id, venue_id, name, code) values
  ('b5731000-0000-4000-8000-000000000001', 'a5730000-0000-4000-8000-00000000000a', 'Gedung', 'G');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('c5730000-0000-4000-8000-000000000001', 'a5730000-0000-4000-8000-00000000000a',
   'b5731000-0000-4000-8000-000000000001', 'L1', 1);
insert into public.location_types (id, venue_id, name) values
  ('b5730000-0000-4000-8000-000000000001', 'a5730000-0000-4000-8000-00000000000a', 'Klinik'),
  ('b5730000-0000-4000-8000-000000000002', 'a5730000-0000-4000-8000-00000000000a', 'Kantor');
insert into public.field_definitions (location_type_id, key, label, field_type) values
  ('b5730000-0000-4000-8000-000000000001', 'telepon', 'Telepon', 'text'),
  ('b5730000-0000-4000-8000-000000000001', 'lantai', 'Lantai', 'number'),
  ('b5730000-0000-4000-8000-000000000002', 'telepon', 'Telepon', 'text'),
  ('b5730000-0000-4000-8000-000000000002', 'lantai', 'Lantai', 'text');
insert into public.categories (id, location_type_id, name) values
  ('d5730000-0000-4000-8000-000000000001', 'b5730000-0000-4000-8000-000000000001', 'Umum'),
  ('d5730000-0000-4000-8000-000000000002', 'b5730000-0000-4000-8000-000000000002', 'Keuangan');
insert into public.locations (id, venue_id, location_type_id, name, custom_fields, logo_path)
select ('f5730000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
  'a5730000-0000-4000-8000-00000000000a', 'b5730000-0000-4000-8000-000000000001',
  'Lokasi ' || g, '{"telepon": "021", "lantai": 2}',
  case when g = 1 then 'locations/a5730000-0000-4000-8000-00000000000a/logo-bersama.png' end
from generate_series(1, 100) g;
insert into public.location_categories (location_id, category_id)
select id, 'd5730000-0000-4000-8000-000000000001' from public.locations
where venue_id = 'a5730000-0000-4000-8000-00000000000a';
insert into public.features (id, venue_id, floor_id, kind, geom, unit_code, unit_status) values
  ('e5731000-0000-4000-8000-000000000001', 'a5730000-0000-4000-8000-00000000000a',
   'c5730000-0000-4000-8000-000000000001', 'unit',
   'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'U-1', 'occupied'),
  ('e5731000-0000-4000-8000-000000000002', 'a5730000-0000-4000-8000-00000000000a',
   'c5730000-0000-4000-8000-000000000001', 'unit',
   'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'U-2', 'vacant');
insert into public.location_units (location_id, feature_id, is_primary) values
  ('f5730000-0000-4000-8000-000000000001', 'e5731000-0000-4000-8000-000000000001', true);
insert into public.closures (venue_id, feature_id, reason, starts_at, ends_at) values
  ('a5730000-0000-4000-8000-00000000000a', 'e5731000-0000-4000-8000-000000000002', 'Renovasi',
   now() - interval '1 hour', null),
  ('a5730000-0000-4000-8000-00000000000a', 'e5731000-0000-4000-8000-000000000002', 'Nanti',
   now() + interval '1 day', now() + interval '2 days');
insert into storage.objects (bucket_id, name, metadata) values
  ('public-assets', 'locations/a5730000-0000-4000-8000-00000000000a/logo-bersama.png',
   '{"size": 1200, "mimetype": "image/png"}'),
  ('public-assets', 'locations/a5730000-0000-4000-8000-00000000000a/media-bebas.png',
   '{"size": 800, "mimetype": "image/png"}'),
  ('public-assets', 'locations/a5730000-0000-4000-8000-00000000000b/media-lain.png',
   '{"size": 800, "mimetype": "image/png"}');

create temp table ids as
  select array_agg(id order by name) as all_ids from public.locations
  where venue_id = 'a5730000-0000-4000-8000-00000000000a';
create temp table batch (id uuid);
grant select on ids to authenticated;
grant insert, select, delete on batch to authenticated;

-- TC-SEC-78: Operator dan Viewer tidak bisa edit massal; Editor bisa.
set local role authenticated;
select pg_temp.as_user('e5730000-0000-4000-8000-000000000002');
select throws_ok(
  $$ select public.bulk_edit_locations('a5730000-0000-4000-8000-00000000000a',
       (select all_ids from ids), '{"kind":"status","status":"inactive_temporary"}') $$,
  '42501', null, 'Operator tidak bisa edit massal'
);
select pg_temp.as_user('e5730000-0000-4000-8000-000000000003');
select throws_ok(
  $$ select public.bulk_edit_locations('a5730000-0000-4000-8000-00000000000a',
       (select all_ids from ids), '{"kind":"status","status":"inactive_temporary"}') $$,
  '42501', null, 'Viewer tidak bisa edit massal'
);

select pg_temp.as_user('e5730000-0000-4000-8000-000000000001');
select throws_ok(
  $$ select public.bulk_edit_locations('a5730000-0000-4000-8000-00000000000a',
       (select all_ids from ids), '{"kind":"status","status":"coming_soon"}') $$,
  'IM422', 'Tanggal buka wajib diisi untuk status segera buka.', 'Segera buka tanpa tanggal ditolak'
);
select throws_ok(
  $$ select public.bulk_edit_locations('a5730000-0000-4000-8000-00000000000b',
       (select all_ids from ids), '{"kind":"status","status":"active"}') $$,
  'IM422', null, 'Lokasi venue lain tidak bisa diubah lewat venue ini'
);
select throws_ok(
  $$ select public.bulk_edit_locations('a5730000-0000-4000-8000-00000000000a',
       (select all_ids from ids), '{"kind":"category_add","category_id":"d5730000-0000-4000-8000-000000000002"}') $$,
  'IM422', null, 'Kategori tipe lain ditolak saat ditambahkan'
);

-- TC-PAR-09: status 100 lokasi sekaligus, tercatat di audit, lalu undo.
insert into batch select public.bulk_edit_locations('a5730000-0000-4000-8000-00000000000a',
  (select all_ids from ids), '{"kind":"status","status":"inactive_permanent"}');
select is(
  (select count(*)::int from public.locations
   where venue_id = 'a5730000-0000-4000-8000-00000000000a' and status = 'inactive_permanent'),
  100, 'Status 100 lokasi berubah dalam satu panggilan'
);
select is(
  (select location_count from public.location_bulk_edits where id = (select id from batch)),
  100, 'Edit massal tersimpan dengan jumlah lokasi'
);
select throws_ok(
  $$ select previous from public.location_bulk_edits $$,
  '42501', null, 'Nilai sebelum perubahan tidak bisa dibaca klien'
);
reset role;
select is(
  (select (details ->> 'count')::int from public.audit_events
   where action = 'location_bulk_edit' and entity_id = (select id from batch)),
  100, 'Edit massal tercatat di audit dengan jumlahnya'
);
select is(
  (select unit_status::text from public.features where id = 'e5731000-0000-4000-8000-000000000001'),
  'vacant', 'Nonaktif permanen mengosongkan unit'
);

set local role authenticated;
select pg_temp.as_user('e5730000-0000-4000-8000-000000000003');
select throws_ok(
  $$ select public.undo_location_bulk_edit((select id from batch)) $$,
  '42501', null, 'Viewer tidak bisa mengurungkan'
);
select pg_temp.as_user('e5730000-0000-4000-8000-000000000001');
select is(public.undo_location_bulk_edit((select id from batch)), 100, 'Undo memulihkan 100 lokasi');
select is(
  (select count(*)::int from public.locations
   where venue_id = 'a5730000-0000-4000-8000-00000000000a' and status = 'active'),
  100, 'Status kembali seperti sebelum edit massal'
);
select throws_ok(
  $$ select public.undo_location_bulk_edit((select id from batch)) $$,
  'IM409', 'Edit massal ini sudah diurungkan.', 'Undo hanya sekali'
);
reset role;
select is(
  (select unit_status::text from public.features where id = 'e5731000-0000-4000-8000-000000000001'),
  'occupied', 'Undo mengembalikan status unit'
);
select ok(
  exists (select 1 from public.audit_events
          where action = 'location_bulk_undo' and entity_id = (select id from batch)),
  'Undo tercatat di audit'
);

-- Ganti tipe: kategori dan field yang tidak cocok dilepas; hanya edit terakhir bisa di-undo.
set local role authenticated;
select pg_temp.as_user('e5730000-0000-4000-8000-000000000001');
delete from batch;
insert into batch select public.bulk_edit_locations('a5730000-0000-4000-8000-00000000000a',
  (select all_ids from ids), '{"kind":"type","type_id":"b5730000-0000-4000-8000-000000000002"}');
select is(
  (select custom_fields from public.locations where id = 'f5730000-0000-4000-8000-000000000002'),
  '{"telepon": "021"}'::jsonb, 'Field berjenis beda dilepas saat pindah tipe'
);
select is(
  (select count(*)::int from public.location_categories lc join public.locations l on l.id = lc.location_id
   where l.venue_id = 'a5730000-0000-4000-8000-00000000000a'),
  0, 'Kategori tipe lama dilepas'
);
select public.bulk_edit_locations('a5730000-0000-4000-8000-00000000000a',
  (select all_ids from ids), '{"kind":"hours","hours":[{"weekday":1,"opens_at":"08:00","closes_at":"16:00"}]}');
select throws_ok(
  $$ select public.undo_location_bulk_edit((select id from batch)) $$,
  'IM409', 'Hanya edit massal terakhir yang bisa diurungkan.', 'Edit yang lebih lama tidak bisa di-undo'
);

-- TC-PAR-10: angka dasbor sama dengan data sebenarnya.
select is(
  (public.venue_dashboard('a5730000-0000-4000-8000-00000000000a') -> 'location_statuses' ->> 'active')::int,
  (select count(*)::int from public.locations
   where venue_id = 'a5730000-0000-4000-8000-00000000000a' and status = 'active'),
  'Dasbor: jumlah lokasi aktif'
);
select is(
  public.venue_dashboard('a5730000-0000-4000-8000-00000000000a')
    - 'location_statuses' - 'publication' - 'draft_updated_at',
  jsonb_build_object('locations_without_unit', 99, 'units_total', 2, 'units_without_location', 1,
    'closures_active', 1, 'closures_scheduled', 1, 'info_points', 0),
  'Dasbor: kelengkapan, penutupan, dan Info Point'
);
select pg_temp.as_user('e5730000-0000-4000-8000-000000000002');
select lives_ok(
  $$ select public.venue_dashboard('a5730000-0000-4000-8000-00000000000a') $$,
  'Role yang boleh membaca draft membuka dasbor'
);

-- TC-PAR-08: pustaka media dengan pemakaian; aset terpakai ditandai untuk policy hapus.
select pg_temp.as_user('e5730000-0000-4000-8000-000000000001');
select is(
  (select jsonb_array_length(usages) from public.media_assets('a5730000-0000-4000-8000-00000000000a')
   where path like '%logo-bersama.png'),
  1, 'Aset terpakai menyebut pemakainya'
);
select is(
  (select count(*)::int from public.media_assets('a5730000-0000-4000-8000-00000000000a')),
  2, 'Pustaka hanya berisi berkas venue ini'
);
select ok(
  app.asset_in_use('public-assets', 'locations/a5730000-0000-4000-8000-00000000000a/logo-bersama.png')
  and not app.asset_in_use('public-assets', 'locations/a5730000-0000-4000-8000-00000000000a/media-bebas.png'),
  'asset_in_use membedakan aset terpakai dan tidak'
);
select ok(
  (select pg_get_expr(polqual, polrelid) like '%asset_in_use%' from pg_policy
   where polname = 'public_assets_locations_delete'),
  'Policy hapus Storage menolak aset terpakai'
);
reset role;

set local role anon;
select throws_ok(
  $$ select public.media_assets('a5730000-0000-4000-8000-00000000000a') $$,
  '42501', null, 'anon tidak bisa membuka pustaka media'
);
reset role;

select * from finish();
rollback;
