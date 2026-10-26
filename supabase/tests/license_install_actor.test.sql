-- Pelaku audit aktivasi lisensi (T-514).
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email) values
  ('e5140000-0000-4000-8000-000000000001', 'sa@aktivasi.test'),
  ('e5140000-0000-4000-8000-000000000002', 'ad@aktivasi.test'),
  ('e5140000-0000-4000-8000-000000000003', 'nonaktif@aktivasi.test');
insert into public.profiles (user_id, full_name, email, role, is_active) values
  ('e5140000-0000-4000-8000-000000000001', 'Sari Admin', 'sa@aktivasi.test', 'super_admin', true),
  ('e5140000-0000-4000-8000-000000000002', 'Adi', 'ad@aktivasi.test', 'admin', true),
  ('e5140000-0000-4000-8000-000000000003', 'Lama', 'nonaktif@aktivasi.test', 'super_admin', false);

create function pg_temp.payload(p_id text) returns jsonb
language sql as $$
  select jsonb_build_object('licenseId', p_id, 'validFrom', '2026-01-01T00:00:00Z',
    'validUntil', '2099-01-01T00:00:00Z', 'issuedAt', '2026-10-26T00:00:00Z')
$$;

select lives_ok(
  $$ select public.license_install('LIC-SA', pg_temp.payload('LIC-SA'), 'x', 'manual',
       'e5140000-0000-4000-8000-000000000001') $$,
  'Super Admin aktif dicatat sebagai pelaku'
);
select is(
  (select user_id from public.audit_events
   where action = 'license_changed' and details->>'license_id' = 'LIC-SA'),
  'e5140000-0000-4000-8000-000000000001'::uuid,
  'Log aktivasi menyebut Super Admin yang memasang'
);

select lives_ok(
  $$ select public.license_install('LIC-BARU', pg_temp.payload('LIC-BARU'), 'x', 'manual') $$,
  'Instalasi baru tanpa Super Admin tetap bisa diaktifkan'
);
select is(
  (select user_id from public.audit_events
   where action = 'license_changed' and details->>'license_id' = 'LIC-BARU'),
  null,
  'Tanpa pelaku, log tetap tanpa pengguna (Sistem)'
);

select throws_ok(
  $$ select public.license_install('LIC-AD', pg_temp.payload('LIC-AD'), 'x', 'manual',
       'e5140000-0000-4000-8000-000000000002') $$,
  'IM403', 'Pelaku aktivasi bukan Super Admin aktif.',
  'Admin biasa tidak bisa dicatat sebagai pelaku'
);
select throws_ok(
  $$ select public.license_install('LIC-OFF', pg_temp.payload('LIC-OFF'), 'x', 'manual',
       'e5140000-0000-4000-8000-000000000003') $$,
  'IM403', 'Pelaku aktivasi bukan Super Admin aktif.',
  'Super Admin nonaktif tidak bisa dicatat sebagai pelaku'
);

set local role authenticated;
select throws_ok(
  $$ select public.license_install('LIC-X', pg_temp.payload('LIC-X'), 'x', 'manual', null) $$,
  '42501', null,
  'Pengguna login tidak bisa memanggil license_install langsung'
);

select * from finish();
rollback;
