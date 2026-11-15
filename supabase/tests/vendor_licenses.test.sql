begin;
create extension if not exists pgtap with schema extensions;
delete from app.server_settings where key = 'hosting_mode';

select plan(30);

insert into app.server_settings (key, value) values ('hosting_mode', 'true');

insert into auth.users (id, email) values
  ('b6500000-0000-4000-8000-0000000000f1', 'staf@lisensi.id'),
  ('b6500000-0000-4000-8000-0000000000aa', 'admin@lisensi.id');
insert into public.profiles (user_id, full_name, email, role, all_venues, is_active) values
  ('b6500000-0000-4000-8000-0000000000f1', 'Staf', 'staf@lisensi.id', 'super_admin', true, true),
  ('b6500000-0000-4000-8000-0000000000aa', 'Admin', 'admin@lisensi.id', 'admin', false, true);
insert into hosting.vendor_staff (user_id) values ('b6500000-0000-4000-8000-0000000000f1');

create function pg_temp.as_user(p_id uuid, p_aal text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', p_aal)::text, true)
$$;

create function pg_temp.payload(p_license text, p_instance text, p_client text, p_plan text,
  p_until text) returns jsonb
language sql as $$
  select jsonb_build_object(
    'licenseId', p_license, 'client', p_client, 'plan', p_plan,
    'validFrom', '2026-11-15T00:00:00Z', 'validUntil', p_until,
    'quota', jsonb_build_object('venues', 1, 'buildings', 1, 'floors', 10, 'infoPoints', 0),
    'features', '[]'::jsonb, 'instanceId', p_instance, 'issuedAt', '2026-11-15T01:00:00Z')
$$;

select ok(not has_function_privilege('anon', 'public.vendor_client_create(text,text,text,text)',
  'execute'), 'Tamu tidak bisa menambah klien');
select ok(not has_function_privilege('anon', 'public.vendor_licenses(uuid)', 'execute'),
  'Tamu tidak bisa membaca lisensi');
select ok(not has_function_privilege('authenticated',
  'public.vendor_license_record(uuid,uuid,jsonb,text)', 'execute'),
  'Pengguna login tidak bisa mencatat lisensi tanpa tanda tangan dari Edge Function');
select ok(has_function_privilege('service_role',
  'public.vendor_license_record(uuid,uuid,jsonb,text)', 'execute'),
  'Edge Function (service role) bisa mencatat lisensi');

set local role authenticated;

select pg_temp.as_user('b6500000-0000-4000-8000-0000000000aa', 'aal2');
select throws_ok($$ select public.vendor_client_create('A', 'RS A', 'a@rs.id') $$, '42501', null,
  'Admin biasa tidak bisa menambah klien');

select pg_temp.as_user('b6500000-0000-4000-8000-0000000000f1', 'aal1');
select throws_ok($$ select public.vendor_client_create('A', 'RS A', 'a@rs.id') $$, '42501', null,
  'Staf vendor tanpa verifikasi dua langkah ditolak');

select pg_temp.as_user('b6500000-0000-4000-8000-0000000000f1', 'aal2');
select throws_ok($$ select public.vendor_client_create('A', ' ', 'a@rs.id') $$, 'IM422', null,
  'Instansi kosong ditolak');
select throws_ok($$ select public.vendor_client_create('A', 'RS A', 'bukan-email') $$, 'IM422',
  null, 'Email tidak sah ditolak');

create temp table ids (key text primary key, id uuid) on commit drop;
grant all on ids to authenticated;
insert into ids values ('client',
  public.vendor_client_create(' Budi ', ' RS Contoh Sehat ', ' Budi@RS.id ', ''));
select results_eq(
  $$ select name, institution, email, phone from public.vendor_clients()
     where id = (select id from ids where key = 'client') $$,
  $$ values ('Budi', 'RS Contoh Sehat', 'budi@rs.id', null::text) $$,
  'Klien disimpan dengan spasi dipangkas, email huruf kecil, telepon kosong menjadi null');

select throws_ok($$ select public.vendor_installation_create(
  'b6500000-0000-4000-8000-000000000999', 'c6500000-0000-4000-8000-000000000001', 'Utama') $$,
  'IM404', null, 'Instalasi untuk klien yang tidak ada ditolak');
insert into ids values ('inst', public.vendor_installation_create(
  (select id from ids where key = 'client'), 'c6500000-0000-4000-8000-000000000001', 'Gedung Utama'));
select throws_ok($$ select public.vendor_installation_create(
  (select id from ids where key = 'client'), 'c6500000-0000-4000-8000-000000000001', 'Lain') $$,
  'IM409', null, 'ID instalasi yang sama tidak bisa didaftarkan dua kali');
select results_eq(
  $$ select plan, valid_until from public.vendor_installations()
     where id = (select id from ids where key = 'inst') $$,
  $$ values (null::text, null::timestamptz) $$,
  'Instalasi baru belum punya paket sampai lisensi pertama terbit');

select results_eq(
  $$ select instance_id, client from public.vendor_license_target(
     (select id from ids where key = 'inst')) $$,
  $$ values ('c6500000-0000-4000-8000-000000000001'::uuid, 'RS Contoh Sehat') $$,
  'Edge Function membaca instance dan nama instansi untuk payload');
select throws_ok($$ select * from public.vendor_license_target(
  'b6500000-0000-4000-8000-000000000999') $$, 'IM404', null,
  'Target lisensi untuk instalasi yang tidak ada ditolak');

reset role;

select throws_ok(format($$ select public.vendor_license_record(
  'b6500000-0000-4000-8000-0000000000f1', %L, pg_temp.payload('LIC-0001',
  'c6500000-0000-4000-8000-000000000002', 'RS Contoh Sehat', 'professional',
  '2027-11-15T00:00:00Z'), 'sig') $$, (select id from ids where key = 'inst')),
  'IM422', null, 'Payload untuk instance lain ditolak');
select throws_ok(format($$ select public.vendor_license_record(
  'b6500000-0000-4000-8000-0000000000f1', %L, pg_temp.payload('LIC-0001',
  'c6500000-0000-4000-8000-000000000001', 'RS Lain', 'professional',
  '2027-11-15T00:00:00Z'), 'sig') $$, (select id from ids where key = 'inst')),
  'IM422', null, 'Payload untuk klien lain ditolak');

select lives_ok(format($$ select public.vendor_license_record(
  'b6500000-0000-4000-8000-0000000000f1', %L, pg_temp.payload('LIC-0001',
  'c6500000-0000-4000-8000-000000000001', 'RS Contoh Sehat', 'professional',
  '2027-11-15T00:00:00Z'), 'sig-1') $$, (select id from ids where key = 'inst')),
  'Lisensi pertama tercatat');
select results_eq(
  $$ select plan, valid_until from vendor.installations
     where id = (select id from ids where key = 'inst') $$,
  $$ values ('professional', '2027-11-15T00:00:00Z'::timestamptz) $$,
  'Paket dan masa berlaku instalasi mengikuti lisensi terbaru');

select lives_ok(format($$ select public.vendor_license_record(
  'b6500000-0000-4000-8000-0000000000f1', %L, pg_temp.payload('LIC-0002',
  'c6500000-0000-4000-8000-000000000001', 'RS Contoh Sehat', 'enterprise',
  '2028-11-15T00:00:00Z'), 'sig-2') $$, (select id from ids where key = 'inst')),
  'Perpanjangan atau ubah paket menerbitkan lisensi baru');
select results_eq(
  $$ select license_id, status from vendor.licenses order by issued_at, license_id $$,
  $$ values ('LIC-0001', 'superseded'), ('LIC-0002', 'active') $$,
  'Lisensi lama digantikan; hanya satu lisensi berlaku per instalasi');
select is(
  (select count(*)::integer from hosting.vendor_actions where action = 'license_issued'
     and user_id = 'b6500000-0000-4000-8000-0000000000f1'),
  2, 'Setiap penerbitan tercatat atas nama staf yang menerbitkan');
select ok(
  not exists (select 1 from information_schema.columns where table_schema = 'vendor'
    and (column_name ilike '%private%' or column_name ilike '%secret%')),
  'Tidak ada kolom kunci privat di skema portal');
insert into ids select 'lic' || right(license_id, 1), id from vendor.licenses;

set local role authenticated;
select pg_temp.as_user('b6500000-0000-4000-8000-0000000000f1', 'aal2');

select results_eq(
  $$ select license_id, status, plan, issued_by_email, file ->> 'signature', file ->> 'licenseId'
     from public.vendor_licenses((select id from ids where key = 'inst')) $$,
  $$ values ('LIC-0002', 'active', 'enterprise', 'staf@lisensi.id', 'sig-2', 'LIC-0002'),
            ('LIC-0001', 'superseded', 'professional', 'staf@lisensi.id', 'sig-1', 'LIC-0001') $$,
  'Riwayat lisensi terbaru dulu, lengkap dengan berkas untuk diunduh ulang');

select throws_ok($$ select public.vendor_license_revoke(
  (select id from ids where key = 'lic1')) $$, 'IM404', null,
  'Lisensi yang sudah digantikan tidak bisa dicabut');
select lives_ok($$ select public.vendor_license_revoke(
  (select id from ids where key = 'lic2')) $$,
  'Lisensi yang berlaku bisa dicabut');
select results_eq(
  $$ select status, revoked_at is not null from public.vendor_licenses(
     (select id from ids where key = 'inst')) where license_id = 'LIC-0002' $$,
  $$ values ('revoked', true) $$, 'Pencabutan menyimpan waktu cabut');
select throws_ok($$ select public.vendor_license_revoke(
  (select id from ids where key = 'lic2')) $$, 'IM404', null,
  'Lisensi tidak bisa dicabut dua kali');

select pg_temp.as_user('b6500000-0000-4000-8000-0000000000aa', 'aal2');
select throws_ok($$ select * from public.vendor_licenses(
  (select id from ids where key = 'inst')) $$, '42501', null,
  'Admin biasa tidak bisa membaca lisensi vendor');
select throws_ok($$ select public.vendor_license_revoke(
  (select id from ids where key = 'lic1')) $$, '42501', null,
  'Admin biasa tidak bisa mencabut lisensi');

reset role;
select is(
  (select count(*)::integer from hosting.vendor_actions
   where action in ('client_created', 'installation_created', 'license_revoked')),
  3, 'Tambah klien, tambah instalasi, dan cabut lisensi tercatat di log vendor');

select * from finish();
rollback;
