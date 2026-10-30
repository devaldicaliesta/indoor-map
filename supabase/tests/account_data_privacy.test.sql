-- Export dan hapus data akun, retensi log audit (T-601a, migrasi 0057).
begin;
create extension if not exists pgtap with schema extensions;

select plan(26);

delete from public.audit_events;
-- Mulai dari bawaan, terlepas dari isi database lokal.
update public.system_settings set audit_retention_days = 365;

insert into auth.users (id, email, last_sign_in_at) values
  ('d6010000-0000-4000-8000-000000000001', 'sa@pdp.test', now()),
  ('d6010000-0000-4000-8000-000000000002', 'ed@pdp.test', '2026-10-01 08:00+07'),
  ('d6010000-0000-4000-8000-000000000003', 'ad@pdp.test', now());
insert into public.profiles (user_id, full_name, email, role) values
  ('d6010000-0000-4000-8000-000000000001', 'SA PDP', 'sa@pdp.test', 'super_admin'),
  ('d6010000-0000-4000-8000-000000000002', 'Editor PDP', 'ed@pdp.test', 'editor'),
  ('d6010000-0000-4000-8000-000000000003', 'Admin PDP', 'ad@pdp.test', 'admin');
-- Super Admin dari seed dihapus agar SA PDP menjadi satu-satunya Super Admin.
delete from public.profiles where user_id = '00000000-0000-4000-8000-000000000001';

insert into public.venues (id, name) values ('d6010000-0000-4000-8000-0000000000a1', 'Venue PDP');
insert into public.venue_members (venue_id, user_id)
  values ('d6010000-0000-4000-8000-0000000000a1', 'd6010000-0000-4000-8000-000000000002');
insert into public.tour_progress (user_id, tour_key)
  values ('d6010000-0000-4000-8000-000000000002', 'locations@1');
insert into public.publications (venue_id, version, snapshot_path, published_by)
  values ('d6010000-0000-4000-8000-0000000000a1', 1, 'snapshots/pdp/1.json', 'd6010000-0000-4000-8000-000000000002');
insert into public.audit_events (user_id, action, entity, entity_id, details) values
  ('d6010000-0000-4000-8000-000000000002', 'login', 'user', 'd6010000-0000-4000-8000-000000000002', '{}'),
  ('d6010000-0000-4000-8000-000000000001', 'role_changed', 'user', 'd6010000-0000-4000-8000-000000000002',
   '{"from": "viewer", "to": "editor"}'),
  ('d6010000-0000-4000-8000-000000000003', 'publish', 'venue', 'd6010000-0000-4000-8000-0000000000a1', '{}');

set local role authenticated;

-- Bukan Super Admin
select set_config('request.jwt.claims', '{"sub": "d6010000-0000-4000-8000-000000000003", "role": "authenticated"}', true);
select throws_ok(
  $$ select public.user_data_export('d6010000-0000-4000-8000-000000000002') $$,
  '42501', null, 'Admin tidak bisa mengekspor data pengguna lain'
);
select throws_ok(
  $$ select public.user_data_delete('d6010000-0000-4000-8000-000000000002') $$,
  '42501', null, 'Admin tidak bisa menghapus akun pengguna'
);
update public.system_settings set audit_retention_days = 30;
reset role;
select is(
  (select audit_retention_days from public.system_settings), 365,
  'Admin tidak bisa mengubah masa simpan log audit (RLS); bawaan 365 hari'
);
set local role authenticated;

-- Export oleh Super Admin
select set_config('request.jwt.claims', '{"sub": "d6010000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
create temporary table export_result on commit drop as
  select public.user_data_export('d6010000-0000-4000-8000-000000000002') as doc;

select is((select doc ->> 'format' from export_result), 'panduarah.user-data/1', 'Berkas export berformat versi');
select is((select doc -> 'account' ->> 'email' from export_result), 'ed@pdp.test', 'Export memuat email akun');
select is((select doc -> 'account' ->> 'full_name' from export_result), 'Editor PDP', 'Export memuat nama akun');
select is((select doc -> 'account' ->> 'role' from export_result), 'editor', 'Export memuat role');
select ok((select doc -> 'sign_in' ? 'last_sign_in_at' from export_result), 'Export memuat waktu masuk terakhir');
select is(
  (select doc -> 'venues' -> 0 ->> 'name' from export_result), 'Venue PDP', 'Export memuat keanggotaan venue'
);
select is(
  (select doc -> 'tour_progress' -> 0 ->> 'tour_key' from export_result), 'locations@1', 'Export memuat status tur'
);
select is(
  (select jsonb_array_length(doc -> 'audit_events') from export_result), 2,
  'Export memuat peristiwa audit sebagai pelaku dan sebagai sasaran, bukan milik orang lain'
);
select is(
  (select (doc -> 'authored_counts' ->> 'publications')::int from export_result), 1,
  'Export memuat jumlah konten yang dibuat akun'
);
select is(
  (select count(*)::int from public.audit_events
   where action = 'user_data_exported' and entity_id = 'd6010000-0000-4000-8000-000000000002'
     and user_id = 'd6010000-0000-4000-8000-000000000001'),
  1, 'Export tercatat di audit dengan pelaku Super Admin'
);
select throws_ok(
  $$ select public.user_data_export('d6010000-0000-4000-8000-0000000000ff') $$,
  'IM404', null, 'Export akun yang tidak ada ditolak'
);

-- Hapus
select throws_ok(
  $$ select public.user_data_delete('d6010000-0000-4000-8000-000000000001') $$,
  'IM409', null, 'Super Admin tidak bisa menghapus akunnya sendiri'
);
select lives_ok(
  $$ select public.user_data_delete('d6010000-0000-4000-8000-000000000002') $$,
  'Super Admin menghapus akun Editor'
);
reset role;

select is(
  (select count(*)::int from auth.users where id = 'd6010000-0000-4000-8000-000000000002'),
  0, 'Akun Auth ikut terhapus'
);
select is(
  (select count(*)::int from public.profiles where user_id = 'd6010000-0000-4000-8000-000000000002')
  + (select count(*)::int from public.venue_members where user_id = 'd6010000-0000-4000-8000-000000000002')
  + (select count(*)::int from public.tour_progress where user_id = 'd6010000-0000-4000-8000-000000000002'),
  0, 'Profil, keanggotaan venue, dan status tur ikut terhapus'
);
select is(
  (select count(*)::int from public.publications where snapshot_path = 'snapshots/pdp/1.json' and published_by is null),
  1, 'Konten venue tetap ada tanpa jejak pembuat'
);
select results_eq(
  $$ select user_id, details ->> 'role' from public.audit_events
     where action = 'user_data_deleted' and entity_id = 'd6010000-0000-4000-8000-000000000002' $$,
  $$ values ('d6010000-0000-4000-8000-000000000001'::uuid, 'editor') $$,
  'Penghapusan tercatat di audit dengan pelaku dan role, tanpa nama atau email'
);
select is(
  (select count(*)::int from public.audit_events
   where details::text ilike '%ed@pdp.test%' or details::text ilike '%Editor PDP%'),
  0, 'Log audit tidak menyimpan email atau nama akun yang dihapus'
);

-- Super Admin lain yang sudah nonaktif boleh dihapus (yang aktif terakhir dijaga 0003)
update public.profiles set role = 'super_admin' where user_id = 'd6010000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "d6010000-0000-4000-8000-000000000003", "role": "authenticated"}', true);
update public.profiles set is_active = false where user_id = 'd6010000-0000-4000-8000-000000000001';
select lives_ok(
  $$ select public.user_data_delete('d6010000-0000-4000-8000-000000000001') $$,
  'Super Admin nonaktif bisa dihapus Super Admin lain'
);
reset role;

-- Retensi
delete from public.audit_events;
insert into public.audit_events (occurred_at, action) values
  ('2026-01-01 00:00+00', 'login'),
  ('2026-09-29 00:00+00', 'login'),
  ('2026-10-29 00:00+00', 'login');
update public.system_settings set audit_retention_days = 30;
select is(
  app.purge_audit_events('2026-10-30 00:00+00'), 2,
  'Peristiwa lebih tua dari 30 hari dihapus'
);
select results_eq(
  $$ select action, (details ->> 'deleted')::int, (details ->> 'retention_days')::int
     from public.audit_events where action <> 'settings_changed' order by occurred_at $$,
  $$ values ('login', null::int, null::int), ('audit_purged', 2, 30) $$,
  'Yang masih dalam masa simpan tetap ada; pembersihan dicatat'
);
select throws_ok(
  $$ update public.system_settings set audit_retention_days = 7 $$,
  '23514', null, 'Masa simpan di bawah 30 hari ditolak'
);
select is(
  (select count(*)::int from cron.job where jobname = 'audit-retention'),
  1, 'Job harian audit-retention terjadwal'
);

select * from finish();
rollback;
