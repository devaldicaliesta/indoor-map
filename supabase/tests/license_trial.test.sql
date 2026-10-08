-- Lisensi trial dan batas data trial (T-504): setiap batas ditolak server dengan IM422
-- "Batas trial tercapai: … n/n", lisensi berbayar tanpa batas tambahan tidak berubah.
begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

insert into auth.users (id, email) values
  ('e5040000-0000-4000-8000-000000000001', 'ad@trial.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e5040000-0000-4000-8000-000000000001', 'AD Trial', 'ad@trial.test', 'admin');

create function pg_temp.as_admin() returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', 'e5040000-0000-4000-8000-000000000001', 'role', 'authenticated')::text, true)
$$;

-- Lantai terpadat: batas fitur per lantai berlaku untuk semua lantai sekaligus.
create temp table venue as
  select v.id as venue_id, f.id as floor_id,
    (select t.id from public.location_types t where t.venue_id = v.id limit 1) as type_id
  from public.venues v
  join public.floors f on f.venue_id = v.id
  where exists (select 1 from public.location_types t where t.venue_id = v.id)
  order by (select count(*) from public.features x where x.floor_id = f.id) desc
  limit 1;
grant select on venue to authenticated;

-- Lisensi trial dengan batas = pemakaian sekarang + 1 untuk jenis berjalan, agar test tidak
-- bergantung pada isi database lokal; batas per tindakan memakai nilai trial asli.
create function pg_temp.trial(p_plan text default 'trial') returns void
language sql as $$
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values ('LIC-TRIAL-UJI', jsonb_build_object(
    'plan', p_plan,
    'validFrom', '2020-01-01T00:00:00Z', 'validUntil', '2099-01-01T00:00:00Z',
    'features', jsonb_build_array('3d', 'info_point'),
    'quota', jsonb_build_object(
      'venues', app.quota_used('venues') + 1,
      'buildings', app.quota_used('buildings') + 1,
      'floors', app.quota_used('floors') + 1,
      'infoPoints', app.quota_used('infoPoints') + 1,
      'locations', app.quota_used('locations') + 1,
      'originPoints', app.quota_used('originPoints') + 1,
      'users', app.quota_used('users') + 1,
      'features', (select count(*) from public.features f join venue v on v.floor_id = f.floor_id) + 1,
      'storageMb', app.quota_used('storageMb') + 30,
      'maxUploadMb', 20,
      'importRows', 500,
      'publishPerDay', (select count(*) from public.publications p join venue v using (venue_id)
        where p.published_at::date = now()::date) + 1)),
    'x', 'active', 'manual');
$$;


select pg_temp.trial();

select is(
  (select is_trial from public.license_status()),
  true,
  'license_status menandai lisensi trial'
);
set local role authenticated;
select pg_temp.as_admin();
select results_eq(
  $$ select kind from public.license_usage() where quota is not null order by kind $$,
  $$ values ('buildings'), ('features'), ('floors'), ('importRows'), ('infoPoints'), ('locations'),
     ('maxUploadMb'), ('originPoints'), ('publishPerDay'), ('storageMb'), ('users'), ('venues') $$,
  'Pemakaian dan batas semua jenis trial terbaca'
);

-- Lokasi, titik asal, dan pengguna: yang terakhir dalam batas boleh, berikutnya ditolak.
set local role authenticated;
select pg_temp.as_admin();
select lives_ok(
  $$ insert into public.locations (venue_id, location_type_id, name)
     select venue_id, type_id, 'Lokasi Terakhir Trial' from venue $$,
  'Lokasi terakhir dalam batas trial boleh ditambah'
);
reset role;
create temp table expected as select app.quota_used('locations') as n;
grant select on expected to authenticated;
set local role authenticated;
select pg_temp.as_admin();
select throws_ok(
  $$ insert into public.locations (venue_id, location_type_id, name)
     select venue_id, type_id, 'Lokasi Lewat Trial' from venue $$,
  'IM422',
  format('Batas trial tercapai: lokasi %s/%s. Hapus yang tidak dipakai atau pasang lisensi berbayar.',
    (select n from expected), (select n from expected)),
  'Lokasi berikutnya ditolak dengan pesan batas trial n/n'
);
select lives_ok(
  $$ insert into public.origin_points (venue_id, floor_id, name, geom)
     select venue_id, floor_id, 'Titik Terakhir', 'SRID=4326;POINT(106.8 -6.2)' from venue $$,
  'Titik asal terakhir dalam batas boleh ditambah'
);
select throws_ok(
  $$ insert into public.origin_points (venue_id, floor_id, name, geom)
     select venue_id, floor_id, 'Titik Lewat', 'SRID=4326;POINT(106.8 -6.2)' from venue $$,
  'IM422', null, 'Titik asal berikutnya ditolak'
);
reset role;

insert into auth.users (id, email) values
  ('e5040000-0000-4000-8000-000000000002', 'ed1@trial.test'),
  ('e5040000-0000-4000-8000-000000000003', 'ed2@trial.test'),
  ('e5040000-0000-4000-8000-000000000004', 'ed3@trial.test');
select lives_ok(
  $$ insert into public.profiles (user_id, full_name, email, role) values
     ('e5040000-0000-4000-8000-000000000002', 'ED1', 'ed1@trial.test', 'editor') $$,
  'Pengguna terakhir dalam batas boleh ditambah'
);
select throws_ok(
  $$ insert into public.profiles (user_id, full_name, email, role) values
     ('e5040000-0000-4000-8000-000000000003', 'ED2', 'ed2@trial.test', 'editor') $$,
  'IM422', null, 'Pengguna aktif berikutnya ditolak'
);
select lives_ok(
  $$ insert into public.profiles (user_id, full_name, email, role, is_active) values
     ('e5040000-0000-4000-8000-000000000004', 'ED3', 'ed3@trial.test', 'editor', false) $$,
  'Pengguna nonaktif tidak dihitung'
);
select throws_ok(
  $$ update public.profiles set is_active = true where user_id = 'e5040000-0000-4000-8000-000000000004' $$,
  'IM422', null, 'Mengaktifkan kembali pengguna melebihi batas ditolak'
);

-- Fitur peta dihitung per lantai.
select lives_ok(
  $$ insert into public.features (venue_id, floor_id, kind, geom)
     select venue_id, floor_id, 'landmark', 'SRID=4326;POINT(106.8 -6.2)' from venue $$,
  'Fitur terakhir di lantai ini boleh ditambah'
);
select throws_ok(
  $$ insert into public.features (venue_id, floor_id, kind, geom)
     select venue_id, floor_id, 'landmark', 'SRID=4326;POINT(106.8 -6.2)' from venue $$,
  'IM422', null, 'Fitur berikutnya di lantai yang penuh ditolak'
);
select matches(
  (select app.quota_message('features', 1000, 1000)),
  '^Batas trial tercapai: fitur peta di lantai ini 1000/1000\.',
  'Pesan fitur menyebut lantai'
);

-- Venue, gedung, lantai, dan Info Point memakai pesan trial yang sama.
select throws_like(
  $$ insert into public.venues (name) values ('Venue A Trial'), ('Venue B Trial') $$,
  'Batas trial tercapai: venue %', 'Venue melebihi batas trial ditolak'
);

-- Publish per hari menurut zona waktu venue; besoknya boleh lagi.
select lives_ok(
  $$ insert into public.publications (venue_id, version, snapshot_path)
     select venue_id, 9001, 'uji/v9001.json' from venue $$,
  'Publish terakhir hari ini boleh'
);
select throws_ok(
  $$ insert into public.publications (venue_id, version, snapshot_path)
     select venue_id, 9002, 'uji/v9002.json' from venue $$,
  'IM422', null, 'Publish berikutnya pada hari yang sama ditolak'
);
update public.publications set published_at = now() - interval '1 day'
where venue_id = (select venue_id from venue)
  and (published_at at time zone (select timezone from public.venues where id = venue_id))::date
    = (now() at time zone (select timezone from public.venues where id = venue_id))::date;
select lives_ok(
  $$ insert into public.publications (venue_id, version, snapshot_path)
     select venue_id, 9003, 'uji/v9003.json' from venue $$,
  'Publish keesokan harinya boleh lagi'
);

-- Storage: ukuran satu berkas dan total; snapshot tidak ditolak.
select throws_like(
  $$ insert into storage.objects (bucket_id, name, metadata)
     values ('floor-plans', 'uji/besar.png', jsonb_build_object('size', 21 * 1048576)) $$,
  'Batas trial tercapai: ukuran berkas (MB) 21/20%', 'Berkas 21 MB ditolak'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, metadata)
     values ('floor-plans', 'uji/pas.png', jsonb_build_object('size', 20 * 1048576)) $$,
  'Berkas 20 MB boleh'
);
select throws_like(
  $$ insert into storage.objects (bucket_id, name, metadata)
     values ('floor-plans', 'uji/sisa.png', jsonb_build_object('size', 15 * 1048576)) $$,
  'Batas trial tercapai: Storage (MB) %', 'Storage melebihi batas total ditolak'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, metadata)
     values ('snapshots', 'uji/v1.json', jsonb_build_object('size', 15 * 1048576)) $$,
  'Snapshot publish tidak ditolak walau Storage penuh'
);

-- Pemeriksa sebelum unggah dan impor (pesan untuk Admin).
set local role authenticated;
select pg_temp.as_admin();
select throws_like(
  'select public.license_upload_check(21 * 1048576)',
  'Batas trial tercapai: ukuran berkas (MB) 21/20%', 'Pemeriksa unggah menolak 21 MB'
);
select throws_like(
  'select public.license_import_check(501)',
  'Batas trial tercapai: baris impor 501/500%', 'Impor 501 baris ditolak'
);
select lives_ok('select public.license_import_check(500)', 'Impor 500 baris boleh');
reset role;
set local role anon;
select throws_ok('select public.license_import_check(1)', '42501', null,
  'Pengunjung tidak bisa memanggil pemeriksa impor');
reset role;

-- Turun ke trial dengan data melebihi batas: publish ditolak sampai data dikurangi.
update public.licenses
set payload = jsonb_set(jsonb_set(payload, '{quota,locations}', to_jsonb(1)),
  '{quota,publishPerDay}', to_jsonb(1000))
where is_current;
select throws_like(
  $$ insert into public.publications (venue_id, version, snapshot_path)
     select venue_id, 9004, 'uji/v9004.json' from venue $$,
  'Pemakaian melebihi kuota paket%', 'Publish ditolak saat lokasi melebihi batas trial'
);

-- Lisensi berbayar tanpa batas tambahan: tidak ada batas baru; pesan memakai "Kuota paket".
update public.licenses set is_current = false where is_current;
insert into public.licenses (license_id, payload, signature, status, source)
values ('LIC-BAYAR-UJI', jsonb_build_object(
  'plan', 'professional',
  'validFrom', '2020-01-01T00:00:00Z', 'validUntil', '2099-01-01T00:00:00Z',
  'features', jsonb_build_array('3d', 'info_point'),
  'quota', jsonb_build_object('venues', 100000, 'buildings', 100000, 'floors', 100000, 'infoPoints', 100000)),
  'x', 'active', 'manual');
select is(
  (select is_trial from public.license_status()),
  false,
  'Lisensi berbayar bukan trial'
);
select lives_ok(
  $$ insert into public.locations (venue_id, location_type_id, name)
     select venue_id, type_id, 'Lokasi Setelah Upgrade' from venue $$,
  'Setelah lisensi berbayar dipasang batas lokasi terangkat'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, metadata)
     values ('floor-plans', 'uji/besar-bayar.png', jsonb_build_object('size', 45 * 1048576)) $$,
  'Lisensi berbayar tanpa batas unggah tidak menolak berkas besar'
);
select matches(
  (select app.quota_message('locations', 5, 5)),
  '^Kuota paket tercapai: lokasi 5/5\. Hapus yang tidak dipakai atau tingkatkan paket\.$',
  'Pesan lisensi berbayar tetap "Kuota paket tercapai"'
);

select * from finish();
rollback;
