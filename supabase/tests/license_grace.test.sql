-- Masa tenggang, kedaluwarsa, perubahan paket (T-406).
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values ('e4060000-0000-4000-8000-000000000001', 'ad@tenggang.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e4060000-0000-4000-8000-000000000001', 'AD', 'ad@tenggang.test', 'admin');

create function pg_temp.license(p_until timestamptz, p_quota jsonb default null) returns void
language sql as $$
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values ('LIC-TENGGANG', jsonb_build_object('validFrom', '2020-01-01T00:00:00Z',
    'validUntil', p_until, 'quota', p_quota), 'x', 'active', 'manual');
$$;

create function pg_temp.state() returns text
language sql as $$ select state from public.license_status() $$;

select pg_temp.license(now() + interval '5 days');
select is(pg_temp.state(), 'active', 'Sebelum berakhir: aktif');
select is(app.service_active(), true, 'Visitor berjalan');

select pg_temp.license(now() - interval '1 day');
select is(pg_temp.state(), 'grace', 'Hari ke-1 setelah berakhir: masa tenggang');
select is(app.license_active(), false, 'Masa tenggang: Admin hanya-baca');
select is(app.service_active(), true, 'Masa tenggang: Visitor tetap berjalan');

select pg_temp.license(now() - interval '15 days');
select is(pg_temp.state(), 'expired', 'Setelah hari ke-14: kedaluwarsa');
select is(app.service_active(), false, 'Kedaluwarsa: layanan Visitor dihentikan');

select pg_temp.license(now() + interval '1 year');
select is(app.service_active(), true, 'Lisensi baru memulihkan layanan');

-- Downgrade: pemakaian venue melebihi kuota.
select pg_temp.license(now() + interval '1 year',
  jsonb_build_object('venues', 0, 'buildings', 100000, 'floors', 100000, 'infoPoints', 100000));
select is(app.quota_exceeded(), 'venues', 'Pemakaian berlebih terdeteksi');
select throws_ok(
  $$ insert into public.publications (venue_id, version, snapshot_path)
     select id, 999, 'uji/v999.json' from public.venues limit 1 $$,
  'IM422', null, 'Publish ditolak saat pemakaian melebihi kuota'
);

select * from finish();
rollback;
