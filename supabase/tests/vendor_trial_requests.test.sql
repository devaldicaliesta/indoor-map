begin;
create extension if not exists pgtap with schema extensions;
delete from app.server_settings where key = 'hosting_mode';

select plan(28);

insert into app.server_settings (key, value) values ('hosting_mode', 'true');

insert into auth.users (id, email) values
  ('b6600000-0000-4000-8000-0000000000f1', 'staf@trial.id'),
  ('b6600000-0000-4000-8000-0000000000aa', 'admin@trial.id');
insert into public.profiles (user_id, full_name, email, role, all_venues, is_active) values
  ('b6600000-0000-4000-8000-0000000000f1', 'Staf', 'staf@trial.id', 'super_admin', true, true),
  ('b6600000-0000-4000-8000-0000000000aa', 'Admin', 'admin@trial.id', 'admin', false, true);
insert into hosting.vendor_staff (user_id) values ('b6600000-0000-4000-8000-0000000000f1');
insert into hosting.blocklist (value, kind) values ('spam.id', 'domain');

create function pg_temp.as_user(p_id uuid, p_aal text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', p_aal)::text, true)
$$;

create function pg_temp.payload(p_license text, p_instance text, p_client text, p_plan text)
returns jsonb
language sql as $$
  select jsonb_build_object(
    'licenseId', p_license, 'client', p_client, 'plan', p_plan,
    'validFrom', '2026-11-15T00:00:00Z', 'validUntil', '2026-11-29T00:00:00Z',
    'quota', jsonb_build_object('venues', 1, 'buildings', 2, 'floors', 6, 'infoPoints', 2),
    'features', '["3d"]'::jsonb, 'instanceId', p_instance, 'issuedAt', '2026-11-15T01:00:00Z')
$$;

select ok(not has_function_privilege('anon',
  'public.vendor_trial_submit(text,text,text,uuid,text)', 'execute'),
  'Tamu tidak bisa memanggil antrean langsung; hanya lewat vendor-api');
select ok(not has_function_privilege('authenticated',
  'public.vendor_trial_submit(text,text,text,uuid,text)', 'execute'),
  'Pengguna login tidak bisa memanggil antrean langsung');
select ok(not has_function_privilege('authenticated',
  'public.vendor_trial_approve(uuid,uuid,uuid,jsonb,text)', 'execute'),
  'Persetujuan hanya lewat Edge Function yang menandatangani');
select ok(not has_function_privilege('anon', 'public.vendor_trial_requests()', 'execute'),
  'Tamu tidak bisa membaca antrean');

select is(public.vendor_trial_submit(' Rina ', ' RS Satu ', ' Rina@RS-Satu.id ',
  'c6600000-0000-4000-8000-000000000001', '203.0.113.9'), 'queued', 'Permintaan baru masuk antrean');
select is(public.vendor_trial_submit('Rina', 'RS Satu', 'rina@rs-satu.id',
  'c6600000-0000-4000-8000-000000000001'), 'already_pending',
  'Permintaan ulang dari instalasi yang sama tidak menambah antrean');
select is((select count(*)::integer from vendor.trial_requests), 1, 'Hanya satu baris antre');
select results_eq(
  $$ select name, institution, email from vendor.trial_requests $$,
  $$ values ('Rina', 'RS Satu', 'rina@rs-satu.id') $$, 'Isian dirapikan, email huruf kecil');
select is(public.vendor_trial_submit('X', 'Spam', 'x@spam.id',
  'c6600000-0000-4000-8000-000000000009'), 'blocked', 'Domain di daftar blokir ditolak');

set local role authenticated;
select pg_temp.as_user('b6600000-0000-4000-8000-0000000000aa', 'aal2');
select throws_ok($$ select * from public.vendor_trial_requests() $$, '42501', null,
  'Admin biasa tidak bisa membaca antrean');
select throws_ok($$ select * from public.vendor_trial_prepare(
  (select id from vendor.trial_requests limit 1)) $$, '42501', null,
  'Admin biasa tidak bisa memproses permintaan');

select pg_temp.as_user('b6600000-0000-4000-8000-0000000000f1', 'aal2');
select results_eq(
  $$ select name, status, instance_id from public.vendor_trial_requests() $$,
  $$ values ('Rina', 'pending', 'c6600000-0000-4000-8000-000000000001'::uuid) $$,
  'Staf vendor melihat antrean');

create temp table ids (key text primary key, id uuid) on commit drop;
grant all on ids to authenticated;
insert into ids select 'request', id from public.vendor_trial_requests();
insert into ids select 'installation', installation_id
  from public.vendor_trial_prepare((select id from ids where key = 'request'));
select results_eq(
  $$ select c.name, c.email, i.client_name, i.instance_id from public.vendor_installations() i
     join public.vendor_clients() c on c.id = i.client_id
     where i.id = (select id from ids where key = 'installation') $$,
  $$ values ('Rina'::text, 'rina@rs-satu.id'::text, 'RS Satu'::text,
     'c6600000-0000-4000-8000-000000000001'::uuid) $$,
  'Persiapan membuat klien dan instalasi dari permintaan');
select is(
  (select installation_id from public.vendor_trial_prepare((select id from ids where key = 'request'))),
  (select id from ids where key = 'installation'),
  'Persiapan ulang memakai instalasi yang sama (aman dicoba lagi)');
select is((select count(*)::integer from public.vendor_clients()), 1,
  'Persiapan ulang tidak membuat klien kedua');

reset role;

select throws_ok(format($$ select public.vendor_trial_approve(
  'b6600000-0000-4000-8000-0000000000f1', %L, %L,
  pg_temp.payload('LIC-T1', 'c6600000-0000-4000-8000-000000000001', 'RS Satu', 'professional'),
  'sig') $$, (select id from ids where key = 'request'), (select id from ids where key = 'installation')),
  'IM422', null, 'Persetujuan hanya menerima lisensi berpaket trial');
select throws_ok(format($$ select public.vendor_trial_approve(
  'b6600000-0000-4000-8000-0000000000f1', %L, %L,
  pg_temp.payload('LIC-T1', 'c6600000-0000-4000-8000-000000000002', 'RS Satu', 'trial'),
  'sig') $$, (select id from ids where key = 'request'), (select id from ids where key = 'installation')),
  'IM422', null, 'Persetujuan menolak lisensi untuk instalasi lain');
select lives_ok(format($$ select public.vendor_trial_approve(
  'b6600000-0000-4000-8000-0000000000f1', %L, %L,
  pg_temp.payload('LIC-T1', 'c6600000-0000-4000-8000-000000000001', 'RS Satu', 'trial'),
  'sig') $$, (select id from ids where key = 'request'), (select id from ids where key = 'installation')),
  'Persetujuan mencatat lisensi trial');
select results_eq(
  $$ select r.status, l.license_id, l.status, r.decided_by
     from vendor.trial_requests r join vendor.licenses l on l.id = r.license_id $$,
  $$ values ('approved', 'LIC-T1', 'active', 'b6600000-0000-4000-8000-0000000000f1'::uuid) $$,
  'Permintaan disetujui dan terhubung ke lisensinya');
select throws_ok(format($$ select public.vendor_trial_approve(
  'b6600000-0000-4000-8000-0000000000f1', %L, %L,
  pg_temp.payload('LIC-T2', 'c6600000-0000-4000-8000-000000000001', 'RS Satu', 'trial'),
  'sig') $$, (select id from ids where key = 'request'), (select id from ids where key = 'installation')),
  'IM409', null, 'Permintaan yang sudah disetujui tidak bisa disetujui lagi');

select is(public.vendor_trial_submit('Rina', 'RS Satu', 'lain@lain.id',
  'c6600000-0000-4000-8000-000000000001'), 'instance_used', 'Instalasi yang pernah trial ditolak');
select is(public.vendor_trial_submit('Rina', 'RS Dua', 'rina@rs-satu.id',
  'c6600000-0000-4000-8000-000000000002'), 'email_used', 'Email yang pernah trial ditolak');
select is(public.vendor_trial_submit('Budi', 'RS Dua', 'budi@rs-satu.id',
  'c6600000-0000-4000-8000-000000000003'), 'domain_used', 'Domain kantor yang pernah trial ditolak');
select is(public.vendor_trial_submit('Sari', 'RS Tiga', 'sari@gmail.com',
  'c6600000-0000-4000-8000-000000000004'), 'queued', 'Domain email umum tidak dihitung per domain');

set local role authenticated;
select pg_temp.as_user('b6600000-0000-4000-8000-0000000000f1', 'aal2');
select throws_ok($$ select * from public.vendor_trial_reject(
  (select id from public.vendor_trial_requests() where email = 'sari@gmail.com'), '  ') $$,
  'IM422', null, 'Penolakan wajib beralasan');
select results_eq(
  $$ select name, email from public.vendor_trial_reject(
     (select id from public.vendor_trial_requests() where email = 'sari@gmail.com'),
     'Data instansi tidak lengkap') $$,
  $$ values ('Sari', 'sari@gmail.com') $$, 'Penolakan mengembalikan penerima email');
select results_eq(
  $$ select status, reject_reason, decided_by_email from public.vendor_trial_requests()
     where email = 'sari@gmail.com' $$,
  $$ values ('rejected', 'Data instansi tidak lengkap', 'staf@trial.id') $$,
  'Penolakan tercatat dengan alasan dan staf');

reset role;
select is(
  (select count(*)::integer from hosting.vendor_actions
   where action in ('trial_request_approved', 'trial_request_rejected')
     and user_id = 'b6600000-0000-4000-8000-0000000000f1'),
  2, 'Persetujuan dan penolakan tercatat di log vendor');

select * from finish();
rollback;
