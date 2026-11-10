-- T-597: Kesehatan sistem — laporan agen, hasil backup, peringatan sekali per kejadian, hak baca.
begin;
create extension if not exists pgtap with schema extensions;

select plan(24);

delete from app.server_health;
delete from app.backup_runs;
delete from app.health_alerts;
insert into auth.users (id, email) values
  ('f5970000-0000-4000-8000-000000000001', 'super@health.test'),
  ('f5970000-0000-4000-8000-000000000002', 'admin@health.test'),
  ('f5970000-0000-4000-8000-000000000003', 'super-nonaktif@health.test');
insert into public.profiles (user_id, full_name, email, role, is_active) values
  ('f5970000-0000-4000-8000-000000000001', 'Super', 'super@health.test', 'super_admin', true),
  ('f5970000-0000-4000-8000-000000000002', 'Admin', 'admin@health.test', 'admin', true),
  ('f5970000-0000-4000-8000-000000000003', 'Nonaktif', 'super-nonaktif@health.test',
   'super_admin', false);
-- Hanya Super Admin uji yang aktif, agar jumlah email bisa dihitung pasti.
update public.profiles set is_active = false
where role = 'super_admin' and user_id <> 'f5970000-0000-4000-8000-000000000001';

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', 'aal1')::text, true)
$$;

create function pg_temp.notices(p_kind text) returns integer
language sql as $$ select count(*)::int from public.account_notices where kind = p_kind $$;

create function pg_temp.report(p_used bigint, p_cert_days integer) returns void
language sql as $$
  select app.health_report(jsonb_build_object(
    'version', '1.4.0',
    'services', jsonb_build_array(
      jsonb_build_object('name', 'db', 'state', 'running', 'health', 'healthy'),
      jsonb_build_object('name', 'auth', 'state', 'exited', 'health', '')),
    'disks', jsonb_build_array(
      jsonb_build_object('path', '/var/lib/docker', 'total', 100, 'used', p_used),
      jsonb_build_object('path', '/opt/panduarah', 'total', 100, 'used', 10)),
    'cert', jsonb_build_object('domain', 'admin.rs.test',
      'expires_at', now() + make_interval(days => p_cert_days))))
$$;

-- ---- Hak baca ----
set local role anon;
select throws_ok($$ select public.system_health() $$, '42501', null,
  'Pengunjung tanpa login tidak bisa membaca kesehatan sistem');
reset role;
select pg_temp.as_user('f5970000-0000-4000-8000-000000000002');
select throws_ok($$ select public.system_health() $$, '42501', null,
  'Admin (bukan Super Admin) tidak bisa membaca kesehatan sistem');
set local role authenticated;
select throws_ok($$ select app.health_report('{}') $$, '42501', null,
  'Pengguna login tidak bisa menulis laporan agen');
select throws_ok($$ select app.health_backup_result(true, null) $$, '42501', null,
  'Pengguna login tidak bisa mencatat hasil backup');
reset role;

select pg_temp.as_user('f5970000-0000-4000-8000-000000000001');
select is(public.system_health() -> 'report', 'null'::jsonb, 'Sebelum agen melapor: tanpa laporan');
select is(public.system_health() -> 'alerts', '[]'::jsonb, 'Tanpa laporan: tanpa peringatan');

-- ---- Laporan agen ----
select throws_ok($$ select app.health_report('[]') $$, '22023', null, 'Laporan bukan objek ditolak');
select pg_temp.report(85, 30);
select is(
  public.system_health() #>> '{report,app_version}', '1.4.0', 'Versi aplikasi tersimpan');
select is(
  jsonb_array_length(public.system_health() #> '{report,services}'), 2, 'Status layanan tersimpan');
select is(public.system_health() -> 'alerts', '[]'::jsonb,
  'Disk tepat 85% dan sertifikat 30 hari belum memicu peringatan');

-- ---- Backup gagal 2 kali berturut-turut ----
select app.health_backup_result(false, 'pg_basebackup: koneksi ditolak');
select is(pg_temp.notices('backup_failed'), 0, 'Satu kegagalan backup belum memicu email');
select app.health_backup_result(true, null);
select app.health_backup_result(false, 'disk penuh');
select is(pg_temp.notices('backup_failed'), 0, 'Gagal–berhasil–gagal bukan dua kali berturut-turut');
select app.health_backup_result(false, 'disk penuh lagi');
select is(pg_temp.notices('backup_failed'), 1,
  'Dua kegagalan berturut-turut: satu email per Super Admin aktif');
select is(
  (select user_id from public.account_notices where kind = 'backup_failed'),
  'f5970000-0000-4000-8000-000000000001'::uuid,
  'Email hanya ke Super Admin aktif, bukan Admin atau Super Admin nonaktif');
select is(
  (select details ->> 'message' from public.account_notices where kind = 'backup_failed'),
  'disk penuh lagi', 'Email memuat pesan kegagalan terakhir');
select ok(
  public.system_health() -> 'alerts' @> '[{"kind": "backup_failed"}]',
  'Halaman menampilkan peringatan backup gagal');
select app.health_backup_result(false, 'masih gagal');
select is(pg_temp.notices('backup_failed'), 1, 'Kegagalan ketiga tidak mengirim email lagi');
select app.health_backup_result(true, null);
select is((select count(*)::int from app.health_alerts where kind = 'backup_failed'), 0,
  'Backup berhasil memulihkan kejadian');
select app.health_backup_result(false, 'a');
select app.health_backup_result(false, 'b');
select is(pg_temp.notices('backup_failed'), 2, 'Kejadian baru setelah pulih mengirim email lagi');

-- ---- Disk dan sertifikat ----
select pg_temp.report(86, 13);
select is(pg_temp.notices('disk_high'), 1, 'Disk 86% memicu email');
select is(pg_temp.notices('cert_expiring'), 1, 'Sertifikat 13 hari lagi memicu email');
select is(
  (select details ->> 'percent' from app.health_alerts where kind = 'disk_high'), '86',
  'Peringatan disk menyebut persentasenya');
select pg_temp.report(87, 12);
select is(pg_temp.notices('disk_high') + pg_temp.notices('cert_expiring'), 2,
  'Laporan berikutnya selama kejadian berlangsung tidak mengirim email lagi');

-- ---- Riwayat backup dibatasi ----
select app.health_backup_result(true, null) from generate_series(1, 70);
select is((select count(*)::int from app.backup_runs), 60, 'Riwayat backup disimpan 60 terakhir');

select * from finish();
rollback;
