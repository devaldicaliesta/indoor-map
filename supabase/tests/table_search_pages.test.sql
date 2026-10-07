-- Tabel server T-503 (Lokasi, Penutupan, Riwayat publish): filter, karakter khusus, dan RLS.
begin;
create extension if not exists pgtap with schema extensions;

select plan(26);

insert into auth.users (id, email) values
  ('a6000000-0000-4000-8000-000000000001', 'vw@pages.test'),
  ('a6000000-0000-4000-8000-000000000002', 'none@pages.test');
-- Akun kedua sengaja tanpa profil: login berhasil, tetapi RLS tidak memberinya baris apa pun.
insert into public.profiles (user_id, full_name, email, role) values
  ('a6000000-0000-4000-8000-000000000001', 'Penerbit Halaman', 'vw@pages.test', 'viewer');

insert into public.venues (id, name) values
  ('a6000000-0000-4000-8000-00000000000a', 'Venue Uji Halaman');
insert into public.buildings (id, venue_id, name, code) values
  ('a6000000-0000-4000-8000-0000000000b1', 'a6000000-0000-4000-8000-00000000000a', 'Gedung Halaman', 'GH');
insert into public.floors (id, venue_id, building_id, name, level) values
  ('a6000000-0000-4000-8000-0000000000c1', 'a6000000-0000-4000-8000-00000000000a',
   'a6000000-0000-4000-8000-0000000000b1', 'L1', 1),
  ('a6000000-0000-4000-8000-0000000000c2', 'a6000000-0000-4000-8000-00000000000a',
   'a6000000-0000-4000-8000-0000000000b1', 'L2', 2);
insert into public.features (id, venue_id, floor_id, kind, geom, unit_code) values
  ('a6000000-0000-4000-8000-0000000000d1', 'a6000000-0000-4000-8000-00000000000a',
   'a6000000-0000-4000-8000-0000000000c1', 'unit',
   'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'H-101'),
  ('a6000000-0000-4000-8000-0000000000d2', 'a6000000-0000-4000-8000-00000000000a',
   'a6000000-0000-4000-8000-0000000000c2', 'unit',
   'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'H-201');
insert into public.features (id, venue_id, floor_id, kind, geom, unit_code)
select 'a6000000-0000-4000-8000-0000000000d3', venue_id, id, 'unit',
  'SRID=4326;POLYGON((106.8 -6.1, 106.8001 -6.1, 106.8001 -6.1001, 106.8 -6.1))', 'LUAR-1'
from public.floors where venue_id = 'a6000000-0000-4000-8000-00000000000a' and is_outdoor;

insert into public.categories (id, location_type_id, name)
select 'a6000000-0000-4000-8000-0000000000e1', id, 'Kuliner'
from public.location_types where venue_id = 'a6000000-0000-4000-8000-00000000000a';

-- Tipe lokasi bawaan venue dibuat trigger venue.
insert into public.locations (id, venue_id, location_type_id, name, code, status, opening_date)
select v.id, 'a6000000-0000-4000-8000-00000000000a', t.id, v.name, v.code,
  v.status::public.location_status, v.opening_date
from public.location_types t
cross join (values
  ('a6000000-0000-4000-8000-000000000101'::uuid, 'Kafé Lumière', 'K-01', 'active', null::date),
  ('a6000000-0000-4000-8000-000000000102'::uuid, 'Diskon 50%', 'D_02', 'inactive_temporary', null),
  ('a6000000-0000-4000-8000-000000000103'::uuid, 'Taman Baca', null, 'active', null),
  ('a6000000-0000-4000-8000-000000000104'::uuid, 'Ruang 501', null, 'coming_soon', date '2027-01-01')
) as v (id, name, code, status, opening_date)
where t.venue_id = 'a6000000-0000-4000-8000-00000000000a';
insert into public.location_units (location_id, feature_id, is_primary) values
  ('a6000000-0000-4000-8000-000000000101', 'a6000000-0000-4000-8000-0000000000d1', true),
  ('a6000000-0000-4000-8000-000000000102', 'a6000000-0000-4000-8000-0000000000d2', true),
  ('a6000000-0000-4000-8000-000000000103', 'a6000000-0000-4000-8000-0000000000d3', true);
insert into public.location_categories (location_id, category_id) values
  ('a6000000-0000-4000-8000-000000000101', 'a6000000-0000-4000-8000-0000000000e1');

insert into public.closures (venue_id, feature_id, reason, starts_at, ends_at) values
  ('a6000000-0000-4000-8000-00000000000a', 'a6000000-0000-4000-8000-0000000000d1',
   'Renovasi dapur', now() - interval '1 hour', null),
  ('a6000000-0000-4000-8000-00000000000a', 'a6000000-0000-4000-8000-0000000000d2',
   'Pengecatan', now() + interval '1 day', null),
  ('a6000000-0000-4000-8000-00000000000a', 'a6000000-0000-4000-8000-0000000000d3',
   'Banjir', now() - interval '3 days', now() - interval '2 days');

-- v3 lebih baru dari versi aktif tetapi tidak aktif: tidak pernah terbit, jadi tidak tampil.
insert into public.publications (venue_id, version, snapshot_path, notes, is_active, published_by, published_at) values
  ('a6000000-0000-4000-8000-00000000000a', 1, 'uji/v1.json', 'Rilis awal 100%', false, null,
   '2026-01-10T18:00:00Z'),
  ('a6000000-0000-4000-8000-00000000000a', 2, 'uji/v2.json', 'Perbaikan lantai', true,
   'a6000000-0000-4000-8000-000000000001', '2026-02-01T03:00:00Z'),
  ('a6000000-0000-4000-8000-00000000000a', 3, 'uji/v3.json', 'Gagal di tengah', false, null,
   '2026-02-02T03:00:00Z');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a6000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

create function pg_temp.locations(
  p_query text default '',
  p_statuses public.location_status[] default null,
  p_category uuid default null,
  p_building text default null,
  p_floor uuid default null,
  p_unlinked boolean default false
) returns text
language sql as $$
  select coalesce(string_agg(name, ', ' order by name), '')
  from public.search_locations('a6000000-0000-4000-8000-00000000000a', p_query, p_statuses,
    p_category, null, p_building, p_floor, p_unlinked)
$$;

-- Lokasi
select is(pg_temp.locations(), 'Diskon 50%, Kafé Lumière, Ruang 501, Taman Baca', 'tanpa filter: semua lokasi venue');
select is(pg_temp.locations('KAFE lumiere'), 'Kafé Lumière', 'cari tanpa huruf besar dan diakritik');
select is(pg_temp.locations('50%'), 'Diskon 50%', '% dicari sebagai teks (Ruang 501 tidak cocok)');
select is(pg_temp.locations('_'), 'Diskon 50%', '_ bukan wildcard (hanya kode D_02)');
select is(pg_temp.locations('h-201'), 'Diskon 50%', 'kode unit ikut dicari');
select is(pg_temp.locations('', array['active']::public.location_status[]), 'Kafé Lumière, Taman Baca', 'filter status');
select is(pg_temp.locations('', null, 'a6000000-0000-4000-8000-0000000000e1'), 'Kafé Lumière', 'filter kategori');
select is(pg_temp.locations('', null, null, 'outdoor'), 'Taman Baca', 'gedung outdoor = unit di Area Luar');
select is(
  pg_temp.locations('', null, null, 'a6000000-0000-4000-8000-0000000000b1', 'a6000000-0000-4000-8000-0000000000c2'),
  'Diskon 50%',
  'gedung dan lantai berlaku bersamaan'
);
select is(pg_temp.locations('', null, null, null, null, true), 'Ruang 501', 'hanya yang belum tertaut unit');
select is(
  pg_temp.locations('lumiere', array['inactive_temporary']::public.location_status[]),
  '',
  'cari dan filter berupa irisan'
);

-- Penutupan
create function pg_temp.closures(
  p_query text default '',
  p_states text[] default null,
  p_from date default null,
  p_to date default null
) returns text
language sql as $$
  select coalesce(string_agg(reason, ', ' order by reason), '')
  from public.search_closures('a6000000-0000-4000-8000-00000000000a', p_query, p_states, p_from, p_to, 'Asia/Jakarta')
$$;

select is(pg_temp.closures('', array['active']), 'Renovasi dapur', 'sedang berlaku');
select is(pg_temp.closures('', array['scheduled', 'ended']), 'Banjir, Pengecatan', 'terjadwal dan selesai');
select is(pg_temp.closures('h-201'), 'Pengecatan', 'cari kode unit sasaran');
select is(pg_temp.closures('gedung halaman'), 'Pengecatan, Renovasi dapur', 'cari nama gedung sasaran');
select is(
  pg_temp.closures('', null, (now() at time zone 'Asia/Jakarta')::date + 1, (now() at time zone 'Asia/Jakarta')::date + 1),
  'Pengecatan, Renovasi dapur',
  'rentang tanggal: masa berlaku yang beririsan (tanpa akhir = masih berlaku)'
);

-- Riwayat publish
create function pg_temp.versions(
  p_query text default '',
  p_from date default null,
  p_to date default null
) returns text
language sql as $$
  select coalesce(string_agg('v' || version, ', ' order by version), '')
  from public.search_publications('a6000000-0000-4000-8000-00000000000a', p_query, p_from, p_to, 'Asia/Jakarta')
$$;

select is(pg_temp.versions(), 'v1, v2', 'hanya versi yang pernah terbit');
select is(pg_temp.versions('V2'), 'v2', 'cari nomor versi');
select is(pg_temp.versions('100%'), 'v1', 'cari catatan dengan %');
select is(pg_temp.versions('penerbit'), 'v2', 'cari nama penerbit');
-- 2026-01-10 18.00 UTC = 11 Januari 01.00 WIB.
select is(pg_temp.versions('', '2026-01-11', '2026-01-11'), 'v1', 'rentang tanggal menurut zona waktu venue');

-- RLS dan hak eksekusi
select set_config('request.jwt.claims', '{"sub": "a6000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select is(
  (select count(*)::int from public.search_locations('a6000000-0000-4000-8000-00000000000a'))
    + (select count(*)::int from public.search_closures('a6000000-0000-4000-8000-00000000000a'))
    + (select count(*)::int from public.search_publications('a6000000-0000-4000-8000-00000000000a')),
  0,
  'akun tanpa role: tidak ada baris dan total 0'
);
reset role;

set local role anon;
select throws_ok(
  $$ select * from public.search_locations('a6000000-0000-4000-8000-00000000000a') $$,
  '42501', null, 'anon tidak boleh memanggil search_locations'
);
select throws_ok(
  $$ select * from public.search_publications('a6000000-0000-4000-8000-00000000000a') $$,
  '42501', null, 'anon tidak boleh memanggil search_publications'
);
reset role;

-- Kebijakan baca memeriksa role sekali per pernyataan (0037); tanpa `(select ...)` fungsi role
-- dievaluasi per baris dan tabel server 2.000 baris melambat berkali lipat.
select is_empty(
  $$ select tablename from pg_policies
     where schemaname = 'public' and cmd = 'SELECT'
       and replace(qual, 'SELECT app.can_read()', '') like '%app.can_read()%' $$,
  'kebijakan baca memakai (select app.can_read())'
);
select is_empty(
  $$ select tablename from pg_policies
     where schemaname = 'public' and cmd = 'SELECT'
       and replace(qual, 'SELECT app.is_super_admin()', '') like '%app.is_super_admin()%' $$,
  'kebijakan baca memakai (select app.is_super_admin())'
);

select * from finish();
rollback;
