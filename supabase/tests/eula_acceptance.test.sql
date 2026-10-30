-- Persetujuan EULA saat aktivasi (T-602, migrasi 0058).
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

-- Instalasi baru: belum pernah menyetujui EULA (seed lokal dibatalkan di akhir).
delete from public.eula_acceptances;

insert into auth.users (id, email) values
  ('e6020000-0000-4000-8000-000000000001', 'sa@eula.test'),
  ('e6020000-0000-4000-8000-000000000002', 'ad@eula.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e6020000-0000-4000-8000-000000000001', 'Sari', 'sa@eula.test', 'super_admin'),
  ('e6020000-0000-4000-8000-000000000002', 'Adi', 'ad@eula.test', 'admin');

create function pg_temp.payload(p_id text) returns jsonb
language sql as $$
  select jsonb_build_object('licenseId', p_id, 'client', 'RS Uji EULA',
    'validFrom', '2026-01-01T00:00:00Z', 'validUntil', '2099-01-01T00:00:00Z',
    'issuedAt', '2026-10-30T00:00:00Z')
$$;

select is(public.eula_status(), null, 'Instalasi baru belum menyetujui EULA');

select lives_ok(
  $$ select public.license_install('LIC-EULA-1', pg_temp.payload('LIC-EULA-1'), 'x', 'manual',
       null, '2026-10-30') $$,
  'Aktivasi pertama mencatat persetujuan EULA'
);
select is(public.eula_status(), '2026-10-30', 'Versi yang disetujui terbaca');
select results_eq(
  $$ select version, accepted_by, license_id, licensee, instance_id from public.eula_acceptances $$,
  $$ select '2026-10-30', null::uuid, 'LIC-EULA-1', 'RS Uji EULA', instance_id
     from public.installation $$,
  'Persetujuan menyimpan versi, lisensi, pemegang lisensi, dan instance; tanpa pelaku saat Super Admin belum ada'
);
select results_eq(
  $$ select user_id, details ->> 'version', details ->> 'licensee', details ->> 'license_id'
     from public.audit_events where action = 'eula_accepted' $$,
  $$ values (null::uuid, '2026-10-30', 'RS Uji EULA', 'LIC-EULA-1') $$,
  'Persetujuan tercatat di log audit'
);

select lives_ok(
  $$ select public.license_install('LIC-EULA-2', pg_temp.payload('LIC-EULA-2'), 'x', 'manual',
       'e6020000-0000-4000-8000-000000000001') $$,
  'Lisensi berikutnya tanpa persetujuan baru tidak menambah baris'
);
select is((select count(*)::int from public.eula_acceptances), 1, 'Tetap satu persetujuan');

select lives_ok(
  $$ select public.license_install('LIC-EULA-3', pg_temp.payload('LIC-EULA-3'), 'x', 'manual',
       'e6020000-0000-4000-8000-000000000001', '2027-01-15') $$,
  'Versi EULA baru disetujui Super Admin'
);
select is(
  (select accepted_by from public.eula_acceptances where version = '2027-01-15'),
  'e6020000-0000-4000-8000-000000000001'::uuid,
  'Persetujuan versi baru menyebut Super Admin yang menyetujui'
);
select throws_ok(
  $$ select public.license_install('LIC-EULA-4', pg_temp.payload('LIC-EULA-4'), 'x', 'manual',
       null, 'versi-1') $$,
  '23514', null, 'Versi EULA harus berbentuk tanggal'
);

-- Hanya Super Admin yang membaca riwayat; tidak ada yang bisa mengubahnya lewat API.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "e6020000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select is_empty('select id from public.eula_acceptances', 'Admin tidak membaca riwayat persetujuan');
select set_config('request.jwt.claims', '{"sub": "e6020000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
select throws_ok(
  $$ delete from public.eula_acceptances $$,
  '42501', null, 'Super Admin pun tidak bisa menghapus bukti persetujuan'
);

select * from finish();
rollback;
