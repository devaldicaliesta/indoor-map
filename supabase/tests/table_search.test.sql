-- Pencarian tabel server (T-502): normalisasi teks, karakter khusus, dan RLS pada total.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

select is(app.search_text('  Kafé   LUMIÈRE '), 'kafe lumiere', 'huruf kecil, tanpa diakritik, spasi dirapatkan');
select is(app.contains_pattern('50%_\x'), '%50\%\_\\x%', '%, _, dan \ di-escape');

insert into auth.users (id, email) values
  ('a5000000-0000-4000-8000-000000000001', 'sa@search.test'),
  ('a5000000-0000-4000-8000-000000000002', 'ad@search.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('a5000000-0000-4000-8000-000000000001', 'Super Cari', 'sa@search.test', 'super_admin'),
  ('a5000000-0000-4000-8000-000000000002', 'Admin Cari', 'ad@search.test', 'admin');
insert into public.audit_events (user_id, action, details, occurred_at) values
  ('a5000000-0000-4000-8000-000000000001', 'publish', '{"venue": "Uji Cari Diskon 50%"}', '2026-10-06T17:30:00Z'),
  (null, 'settings_changed', '{"venue": "Uji Cari kode_unit"}', '2026-10-05T03:00:00Z'),
  (null, 'rollback', '{"venue": "Uji Cari Kafé"}', '2026-10-01T03:00:00Z');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a5000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select is_empty(
  $$ select id from public.search_audit_events('uji cari') $$,
  'Admin tidak melihat catatan lewat fungsi pencarian (RLS tetap berlaku)'
);

select set_config('request.jwt.claims', '{"sub": "a5000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
select is((select count(*)::int from public.search_audit_events('uji cari')), 3, 'Super Admin melihat semua');
select is((select count(*)::int from public.search_audit_events('diskon 50%')), 1, '% dicari sebagai teks');
select is((select count(*)::int from public.search_audit_events('cari kode_unit')), 1, '_ dicari sebagai teks');
select is(
  (select count(*)::int from public.search_audit_events('_', array['rollback'])),
  0,
  '_ bukan wildcard (baris tanpa garis bawah tidak cocok)'
);
select is((select count(*)::int from public.search_audit_events('super cari')), 1, 'nama pelaku ikut dicari');
select is(
  (select count(*)::int from public.search_audit_events('uji cari', array['publish', 'rollback'])),
  2,
  'filter aksi'
);
-- 2026-10-06 17.30 UTC = 7 Oktober 00.30 WIB.
select is(
  (select count(*)::int from public.search_audit_events('uji cari', null, null, '2026-10-07', '2026-10-07', 'Asia/Jakarta')),
  1,
  'rentang tanggal menurut zona waktu'
);
reset role;

select * from finish();
rollback;
