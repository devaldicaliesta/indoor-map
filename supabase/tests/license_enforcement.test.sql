-- Lisensi ditegakkan di server (T-402).
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, email) values
  ('e4000000-0000-4000-8000-000000000001', 'ad@license.test'),
  ('e4000000-0000-4000-8000-000000000002', 'op@license.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e4000000-0000-4000-8000-000000000001', 'AD', 'ad@license.test', 'admin'),
  ('e4000000-0000-4000-8000-000000000002', 'OP', 'op@license.test', 'operator');

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

create function pg_temp.license(p_from text, p_until text, p_status public.license_status default 'active')
returns void
language sql as $$
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values ('LIC-UJI', jsonb_build_object('validFrom', p_from, 'validUntil', p_until), 'x', p_status, 'manual');
$$;

-- Dengan lisensi dev dari seed
select is((select state from public.license_status()), 'active', 'Lisensi seed berlaku');
set local role authenticated;
select pg_temp.as_user('e4000000-0000-4000-8000-000000000001');
select lives_ok(
  $$ insert into public.venues (name) values ('Venue Berlisensi') $$,
  'Admin bisa menambah venue saat lisensi berlaku'
);

-- Tanpa lisensi
reset role;
update public.licenses set is_current = false where is_current;
select is((select state from public.license_status()), 'missing', 'Status missing tanpa lisensi');
set local role authenticated;
select pg_temp.as_user('e4000000-0000-4000-8000-000000000001');
select throws_ok(
  $$ insert into public.venues (name) values ('Venue Tanpa Lisensi') $$,
  '42501', null, 'Admin ditolak menambah venue tanpa lisensi'
);
select is(
  (select count(*)::int from public.venues where name = 'Venue Berlisensi'),
  1,
  'Data tetap bisa dibaca tanpa lisensi'
);
select pg_temp.as_user('e4000000-0000-4000-8000-000000000002');
select throws_ok(
  $$ insert into public.closures (venue_id, reason) select id, 'uji' from public.venues limit 1 $$,
  '42501', null, 'Operator tidak bisa menambah penutupan tanpa lisensi'
);

-- Kedaluwarsa, belum berlaku, dicabut
reset role;
select pg_temp.license('2020-01-01T00:00:00Z', '2021-01-01T00:00:00Z');
select is((select state from public.license_status()), 'expired', 'Status expired');
select is(app.license_active(), false, 'Lisensi kedaluwarsa tidak berlaku');
select pg_temp.license('2090-01-01T00:00:00Z', '2091-01-01T00:00:00Z');
select is((select state from public.license_status()), 'not_yet_valid', 'Status not_yet_valid');
select pg_temp.license('2020-01-01T00:00:00Z', '2099-01-01T00:00:00Z', 'revoked');
select is((select state from public.license_status()), 'revoked', 'Status revoked tidak berlaku');

-- Pengunjung bisa membaca status (halaman aktivasi sebelum login), tidak rinciannya
set local role anon;
select is(
  (select instance_id from public.license_status()),
  (select '00000000-0000-4000-8000-0000000de701'::uuid),
  'anon membaca instance_id untuk halaman aktivasi'
);
select is_empty('select id from public.licenses', 'anon tidak bisa membaca tabel licenses');

select * from finish();
rollback;
