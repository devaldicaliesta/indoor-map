begin;
create extension if not exists pgtap with schema extensions;
delete from app.server_settings where key = 'hosting_mode';

select plan(27);

insert into app.server_settings (key, value) values ('hosting_mode', 'true');

insert into auth.users (id, email) values
  ('b6700000-0000-4000-8000-0000000000f1', 'staf@rilis.id'),
  ('b6700000-0000-4000-8000-0000000000aa', 'admin@rilis.id');
insert into public.profiles (user_id, full_name, email, role, all_venues, is_active) values
  ('b6700000-0000-4000-8000-0000000000f1', 'Staf', 'staf@rilis.id', 'super_admin', true, true),
  ('b6700000-0000-4000-8000-0000000000aa', 'Admin', 'admin@rilis.id', 'admin', false, true);
insert into hosting.vendor_staff (user_id) values ('b6700000-0000-4000-8000-0000000000f1');

create function pg_temp.as_user(p_id uuid, p_aal text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', p_aal)::text, true)
$$;

create function pg_temp.payload(p_license text, p_issued text) returns jsonb
language sql as $$
  select jsonb_build_object(
    'licenseId', p_license, 'client', 'RS Rilis', 'plan', 'professional',
    'validFrom', '2026-11-15T00:00:00Z', 'validUntil', '2027-11-15T00:00:00Z',
    'quota', jsonb_build_object('venues', 1, 'buildings', 1, 'floors', 10, 'infoPoints', 0),
    'features', '[]'::jsonb, 'instanceId', 'c6700000-0000-4000-8000-000000000001',
    'issuedAt', p_issued)
$$;

select ok(not has_function_privilege('anon', 'public.vendor_checkin(text,uuid,text,text)',
  'execute'), 'Tamu tidak bisa memanggil check-in langsung; hanya lewat vendor-api');
select ok(not has_function_privilege('authenticated',
  'public.vendor_checkin(text,uuid,text,text)', 'execute'),
  'Pengguna login tidak bisa memalsukan check-in');
select ok(not has_function_privilege('anon', 'public.vendor_releases()', 'execute'),
  'Tamu tidak bisa membaca daftar rilis');

create temp table ids (key text primary key, id uuid) on commit drop;
grant all on ids to authenticated;

set local role authenticated;
select pg_temp.as_user('b6700000-0000-4000-8000-0000000000f1', 'aal2');
insert into ids values ('client', public.vendor_client_create('Budi', 'RS Rilis', 'budi@rilis.id'));
insert into ids values ('inst', public.vendor_installation_create(
  (select id from ids where key = 'client'), 'c6700000-0000-4000-8000-000000000001', 'Utama'));
reset role;

select public.vendor_license_record('b6700000-0000-4000-8000-0000000000f1',
  (select id from ids where key = 'inst'), pg_temp.payload('LIC-R1', '2026-11-15T01:00:00Z'), 'sig1');

select is(
  (select outcome from public.vendor_checkin('LIC-TIDAK-ADA',
    'c6700000-0000-4000-8000-000000000001', '1.0.0', '203.0.113.1')),
  'unknown', 'Lisensi yang tidak dikenal ditolak');
select is(
  (select outcome from public.vendor_checkin('LIC-R1',
    'c6700000-0000-4000-8000-000000000009', '1.0.0', '203.0.113.1')),
  'wrong_instance', 'Lisensi dari instalasi lain ditolak');
select is((select count(*)::integer from vendor.checkins), 0,
  'Check-in yang ditolak tidak tercatat');

select results_eq(
  $$ select outcome, file ->> 'licenseId', file ->> 'signature' from public.vendor_checkin(
     'LIC-R1', 'c6700000-0000-4000-8000-000000000001', ' 1.2.0 ', '203.0.113.7') $$,
  $$ values ('active', 'LIC-R1', 'sig1') $$,
  'Lisensi berlaku: jawaban aktif beserta berkasnya');
select results_eq(
  $$ select last_version from vendor.installations where instance_id =
     'c6700000-0000-4000-8000-000000000001' $$,
  $$ values ('1.2.0') $$, 'Versi terakhir instalasi diperbarui dari check-in');
select ok(
  (select last_checkin_at from vendor.installations
   where instance_id = 'c6700000-0000-4000-8000-000000000001') is not null,
  'Waktu check-in terakhir dicatat');
select is(
  (select outcome from public.vendor_checkin('LIC-R1', 'c6700000-0000-4000-8000-000000000001')),
  'active', 'Check-in tanpa versi (klien lama) tetap diterima');
select results_eq(
  $$ select last_version from vendor.installations where instance_id =
     'c6700000-0000-4000-8000-000000000001' $$,
  $$ values ('1.2.0') $$, 'Check-in tanpa versi tidak menghapus versi terakhir');

select public.vendor_license_record('b6700000-0000-4000-8000-0000000000f1',
  (select id from ids where key = 'inst'), pg_temp.payload('LIC-R2', '2026-11-16T01:00:00Z'), 'sig2');
select results_eq(
  $$ select outcome, file ->> 'licenseId', file ->> 'signature' from public.vendor_checkin(
     'LIC-R1', 'c6700000-0000-4000-8000-000000000001', '1.2.0') $$,
  $$ values ('active', 'LIC-R1', 'sig1') $$,
  'Lisensi yang digantikan tetap aktif dengan berkasnya sendiri (berkas baru dipasang manual)');

set local role authenticated;
select pg_temp.as_user('b6700000-0000-4000-8000-0000000000f1', 'aal2');
select lives_ok(
  $$ select public.vendor_license_revoke((select l.id from public.vendor_licenses(
     (select id from ids where key = 'inst')) l where l.license_id = 'LIC-R2')) $$,
  'Staf vendor mencabut lisensi pengganti');
reset role;

select is(
  (select outcome from public.vendor_checkin('LIC-R2', 'c6700000-0000-4000-8000-000000000001')),
  'revoked', 'Lisensi yang dicabut dijawab revoked saat check-in');
select is(
  (select outcome from public.vendor_checkin('LIC-R1', 'c6700000-0000-4000-8000-000000000001')),
  'revoked', 'Lisensi lama yang digantikan ikut tidak berlaku setelah penggantinya dicabut');

set local role authenticated;
select pg_temp.as_user('b6700000-0000-4000-8000-0000000000aa', 'aal2');
select throws_ok($$ select * from public.vendor_checkins(
  (select id from ids where key = 'inst')) $$, '42501', null,
  'Admin biasa tidak bisa membaca riwayat check-in');
select throws_ok($$ select public.vendor_release_add('1.0.0', current_date, '',
  'https://unduh.vendor.id/a.tar.gz', repeat('a', 64)) $$, '42501', null,
  'Admin biasa tidak bisa menambah rilis');

select pg_temp.as_user('b6700000-0000-4000-8000-0000000000f1', 'aal2');
select results_eq(
  $$ select version, ip_address from public.vendor_checkins(
     (select id from ids where key = 'inst')) $$,
  $$ values (null::text, null::text), (null, null), ('1.2.0', null), (null, null),
     ('1.2.0', '203.0.113.7') $$,
  'Riwayat check-in terbaru dulu, beserta versi dan IP');

select throws_ok($$ select public.vendor_release_add('1.0 beta', current_date, '',
  'https://unduh.vendor.id/a.tar.gz', repeat('a', 64)) $$, 'IM422', null,
  'Versi berspasi ditolak');
select throws_ok($$ select public.vendor_release_add('1.0.0', current_date, '',
  'http://unduh.vendor.id/a.tar.gz', repeat('a', 64)) $$, 'IM422', null,
  'Alamat unduh tanpa https ditolak');
select throws_ok($$ select public.vendor_release_add('1.0.0', current_date, '',
  'https://unduh.vendor.id/a.tar.gz', 'abc') $$, 'IM422', null, 'SHA-256 tidak sah ditolak');
select throws_ok($$ select public.vendor_release_add('1.0.0', current_date + 7, '',
  'https://unduh.vendor.id/a.tar.gz', repeat('a', 64)) $$, 'IM422', null,
  'Tanggal rilis di masa depan ditolak');

insert into ids values ('r1', public.vendor_release_add(' 1.1.0 ', current_date - 30, 'Rilis awal',
  ' https://unduh.vendor.id/panduarah-1.1.0.tar.gz ', upper(repeat('ab', 32))));
insert into ids values ('r2', public.vendor_release_add('1.2.0', current_date, '',
  'https://unduh.vendor.id/panduarah-1.2.0.tar.gz', repeat('cd', 32)));
select throws_ok($$ select public.vendor_release_add('1.2.0', current_date, '',
  'https://unduh.vendor.id/x.tar.gz', repeat('a', 64)) $$, 'IM409', null,
  'Versi yang sama tidak bisa ditambahkan dua kali');
select results_eq(
  $$ select version, download_url, sha256, created_by_email from public.vendor_releases() $$,
  $$ values
     ('1.2.0', 'https://unduh.vendor.id/panduarah-1.2.0.tar.gz', repeat('cd', 32), 'staf@rilis.id'),
     ('1.1.0', 'https://unduh.vendor.id/panduarah-1.1.0.tar.gz', repeat('ab', 32), 'staf@rilis.id') $$,
  'Rilis terbaru dulu; versi dan alamat dipangkas, SHA-256 huruf kecil');

select lives_ok($$ select public.vendor_release_remove((select id from ids where key = 'r1')) $$,
  'Rilis bisa dihapus');
select throws_ok($$ select public.vendor_release_remove((select id from ids where key = 'r1')) $$,
  'IM404', null, 'Rilis yang sudah dihapus tidak ditemukan');

reset role;
select is(
  (select count(*)::integer from hosting.vendor_actions
   where action in ('release_added', 'release_removed')
     and user_id = 'b6700000-0000-4000-8000-0000000000f1'),
  3, 'Tambah dan hapus rilis tercatat di log vendor');

select * from finish();
rollback;
