begin;
create extension if not exists pgtap with schema extensions;
delete from app.server_settings where key = 'hosting_mode';

select plan(30);

insert into app.server_settings (key, value) values ('hosting_mode', 'true');

insert into auth.users (id, email) values
  ('b6800000-0000-4000-8000-0000000000f1', 'staf@kunci.id'),
  ('b6800000-0000-4000-8000-0000000000aa', 'admin@kunci.id');
insert into public.profiles (user_id, full_name, email, role, all_venues, is_active) values
  ('b6800000-0000-4000-8000-0000000000f1', 'Staf', 'staf@kunci.id', 'super_admin', true, true),
  ('b6800000-0000-4000-8000-0000000000aa', 'Admin', 'admin@kunci.id', 'admin', false, true);
insert into hosting.vendor_staff (user_id) values ('b6800000-0000-4000-8000-0000000000f1');

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
    'validFrom', '2026-11-15T00:00:00Z', 'validUntil', '2027-11-15T00:00:00Z',
    'quota', jsonb_build_object('venues', 1, 'buildings', 1, 'floors', 10, 'infoPoints', 0),
    'features', '[]'::jsonb, 'instanceId', p_instance, 'issuedAt', '2026-11-15T01:00:00Z')
$$;

select ok(not has_function_privilege('anon',
  'public.vendor_license_key_create(uuid,text,integer,jsonb,jsonb)', 'execute'),
  'Tamu tidak bisa membuat kunci lisensi');
select ok(not has_function_privilege('authenticated',
  'public.vendor_license_key_claim(text,uuid)', 'execute'),
  'Pengguna login tidak bisa mengklaim kunci tanpa vendor-api');
select ok(not has_function_privilege('authenticated',
  'public.vendor_license_key_record(text,jsonb,text)', 'execute'),
  'Pengguna login tidak bisa mencatat lisensi dari kunci');
select ok(has_function_privilege('service_role',
  'public.vendor_license_key_claim(text,uuid)', 'execute'),
  'vendor-api (service role) bisa mengklaim kunci');
select ok(not has_table_privilege('authenticated', 'vendor.license_keys', 'select'),
  'Tabel kunci tidak bisa dibaca langsung');

create temp table ids (key text primary key, id uuid, txt text) on commit drop;
grant all on ids to authenticated, service_role;

set local role authenticated;
select pg_temp.as_user('b6800000-0000-4000-8000-0000000000f1', 'aal2');
insert into ids (key, id) values ('client', public.vendor_client_create('Sari', 'RS Kunci', 'sari@rs.id'));
insert into ids (key, id) values ('other', public.vendor_client_create('Tono', 'RS Lain', 'tono@rs.id'));

select pg_temp.as_user('b6800000-0000-4000-8000-0000000000aa', 'aal2');
select throws_ok($$ select public.vendor_license_key_create(
  (select id from ids where key = 'client'), 'Pro', 365, '{}'::jsonb, '[]'::jsonb) $$,
  '42501', null, 'Admin biasa tidak bisa membuat kunci');

select pg_temp.as_user('b6800000-0000-4000-8000-0000000000f1', 'aal1');
select throws_ok($$ select public.vendor_license_key_create(
  (select id from ids where key = 'client'), 'Pro', 365, '{}'::jsonb, '[]'::jsonb) $$,
  '42501', null, 'Staf vendor tanpa verifikasi dua langkah ditolak');

select pg_temp.as_user('b6800000-0000-4000-8000-0000000000f1', 'aal2');
select throws_ok($$ select public.vendor_license_key_create(
  (select id from ids where key = 'client'), 'trial', 30, '{}'::jsonb, '[]'::jsonb) $$,
  'IM422', null, 'Kunci untuk paket trial ditolak');
select throws_ok($$ select public.vendor_license_key_create(
  (select id from ids where key = 'client'), 'Pro', 0, '{}'::jsonb, '[]'::jsonb) $$,
  'IM422', null, 'Masa berlaku 0 hari ditolak');
select throws_ok($$ select public.vendor_license_key_create(
  (select id from ids where key = 'client'), 'Pro', 365, '[]'::jsonb, '[]'::jsonb) $$,
  'IM422', null, 'Kuota bukan objek ditolak');
select throws_ok($$ select public.vendor_license_key_create(
  'b6800000-0000-4000-8000-000000000999', 'Pro', 365, '{}'::jsonb, '[]'::jsonb) $$,
  'IM404', null, 'Klien yang tidak ada ditolak');

insert into ids (key, txt) values ('key', public.vendor_license_key_create(
  (select id from ids where key = 'client'), 'Pro', 365,
  '{"venues":1,"buildings":1,"floors":10,"infoPoints":0}'::jsonb, '["3d"]'::jsonb));
insert into ids (key, txt) values ('spare', public.vendor_license_key_create(
  (select id from ids where key = 'client'), 'Pro', 365,
  '{"venues":1,"buildings":1,"floors":10,"infoPoints":0}'::jsonb, '[]'::jsonb));

select matches((select txt from ids where key = 'key'),
  '^[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{5}){4}$', 'Kunci 25 karakter Crockford dalam 5 grup');
select is((select count(*)::int from public.vendor_license_keys((select id from ids where key = 'client'))
  where status = 'available'), 2, 'Dua kunci baru berstatus belum dipakai');
select is((select key_hint from public.vendor_license_keys((select id from ids where key = 'client'))
  where key_hint = right((select txt from ids where key = 'key'), 5)),
  right((select txt from ids where key = 'key'), 5), 'Daftar hanya menampilkan lima karakter terakhir');

reset role;
select is((select count(*)::int from vendor.license_keys
  where key_hash = (select txt from ids where key = 'key')), 0, 'Kunci tidak disimpan apa adanya');

set local role service_role;
select results_eq(
  $$ select outcome from public.vendor_license_key_claim('AAAAA-AAAAA-AAAAA-AAAAA-AAAAA',
     'c6800000-0000-4000-8000-000000000001') $$,
  $$ values ('unknown') $$, 'Kunci tak dikenal ditolak');
select results_eq(
  $$ select outcome, client, plan, duration_days from public.vendor_license_key_claim(
     (select txt from ids where key = 'key'), 'c6800000-0000-4000-8000-000000000001') $$,
  $$ values ('claim', 'RS Kunci', 'Pro', 365) $$,
  'Aktivasi pertama mengikat kunci ke instalasi dan memberi templatnya');
reset role;
select is((select count(*)::int from vendor.installations
  where instance_id = 'c6800000-0000-4000-8000-000000000001'), 1,
  'Instalasi baru dibuat otomatis untuk klien pemilik kunci');
set local role service_role;
select results_eq(
  $$ select outcome from public.vendor_license_key_claim(
     (select txt from ids where key = 'key'), 'c6800000-0000-4000-8000-000000000002') $$,
  $$ values ('other_instance') $$, 'Kunci yang sudah terikat ditolak untuk instalasi lain');
select throws_ok($$ select public.vendor_license_key_record((select txt from ids where key = 'key'),
  pg_temp.payload('LIC-KEY00001', 'c6800000-0000-4000-8000-000000000001', 'RS Kunci', 'Basic'),
  'sig') $$, 'IM422', null, 'Lisensi dengan paket berbeda dari kunci ditolak');
select lives_ok($$ select public.vendor_license_key_record((select txt from ids where key = 'key'),
  pg_temp.payload('LIC-KEY00001', 'c6800000-0000-4000-8000-000000000001', 'RS Kunci', 'Pro'),
  'sig') $$, 'Lisensi bertanda tangan dicatat untuk kunci');
select throws_ok($$ select public.vendor_license_key_record((select txt from ids where key = 'key'),
  pg_temp.payload('LIC-KEY00002', 'c6800000-0000-4000-8000-000000000001', 'RS Kunci', 'Pro'),
  'sig') $$, 'IM409', null, 'Kunci yang sudah diaktifkan tidak mencatat lisensi kedua');
select results_eq(
  $$ select outcome, file ->> 'licenseId' from public.vendor_license_key_claim(
     (select txt from ids where key = 'key'), 'c6800000-0000-4000-8000-000000000001') $$,
  $$ values ('existing', 'LIC-KEY00001') $$,
  'Aktivasi ulang dari instalasi yang sama mengembalikan lisensi yang sama');

reset role;
update vendor.licenses set status = 'revoked' where license_id = 'LIC-KEY00001';
set local role service_role;
select results_eq(
  $$ select outcome from public.vendor_license_key_claim(
     (select txt from ids where key = 'key'), 'c6800000-0000-4000-8000-000000000001') $$,
  $$ values ('revoked') $$, 'Lisensi dari kunci yang dicabut tidak diberikan lagi');

reset role;
insert into vendor.installations (client_id, instance_id, name)
values ((select id from ids where key = 'other'), 'c6800000-0000-4000-8000-000000000003', 'Lain');
set local role service_role;
select results_eq(
  $$ select outcome from public.vendor_license_key_claim(
     (select txt from ids where key = 'spare'), 'c6800000-0000-4000-8000-000000000003') $$,
  $$ values ('other_client') $$, 'Instalasi milik klien lain tidak bisa memakai kunci ini');

set local role authenticated;
select pg_temp.as_user('b6800000-0000-4000-8000-0000000000f1', 'aal2');
select throws_ok($$ select public.vendor_license_key_revoke((select id from public.vendor_license_keys(
  (select id from ids where key = 'client')) where status = 'activated')) $$, 'IM409', null,
  'Kunci yang sudah diaktifkan tidak dicabut lewat kunci');
select lives_ok($$ select public.vendor_license_key_revoke((select id from public.vendor_license_keys(
  (select id from ids where key = 'client')) where status = 'available')) $$,
  'Kunci yang belum dipakai bisa dicabut');
select results_eq(
  $$ select status, instance_id, license_id from public.vendor_license_keys(
     (select id from ids where key = 'client')) order by status $$,
  $$ values ('activated', 'c6800000-0000-4000-8000-000000000001'::uuid, 'LIC-KEY00001'),
            ('revoked', null::uuid, null::text) $$,
  'Daftar kunci menampilkan status, instalasi, dan lisensinya');

set local role service_role;
select results_eq(
  $$ select outcome from public.vendor_license_key_claim(
     (select txt from ids where key = 'spare'), 'c6800000-0000-4000-8000-000000000009') $$,
  $$ values ('revoked') $$, 'Kunci yang dicabut tidak bisa diaktifkan');

reset role;
select is(
  (select array_agg(action order by id)::text[] from hosting.vendor_actions
   where action like 'license_key_%' and occurred_at = now()),
  array['license_key_created', 'license_key_created', 'license_key_activated', 'license_key_revoked'],
  'Pembuatan, aktivasi, dan pencabutan kunci tercatat di log vendor');

select * from finish();
rollback;
