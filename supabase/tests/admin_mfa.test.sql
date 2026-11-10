-- T-592a: 2FA Admin — wajib per role ditegakkan di app.user_role(), kode cadangan, reset Super Admin.
begin;
create extension if not exists pgtap with schema extensions;

select plan(42);

insert into auth.users (id, email) values
  ('f5920000-0000-4000-8000-000000000001', 'super@mfa.test'),
  ('f5920000-0000-4000-8000-000000000002', 'editor@mfa.test'),
  ('f5920000-0000-4000-8000-000000000003', 'admin@mfa.test'),
  ('f5920000-0000-4000-8000-000000000004', 'super2@mfa.test');
insert into public.profiles (user_id, full_name, email, role, all_venues) values
  ('f5920000-0000-4000-8000-000000000001', 'Super', 'super@mfa.test', 'super_admin', true),
  ('f5920000-0000-4000-8000-000000000002', 'Editor', 'editor@mfa.test', 'editor', true),
  ('f5920000-0000-4000-8000-000000000003', 'Admin', 'admin@mfa.test', 'admin', true),
  ('f5920000-0000-4000-8000-000000000004', 'Super Dua', 'super2@mfa.test', 'super_admin', true);
-- Admin dan Super Dua sudah mengaktifkan 2FA sendiri.
insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret)
values
  ('f5921000-0000-4000-8000-000000000003', 'f5920000-0000-4000-8000-000000000003', 'A', 'totp',
   'verified', now(), now(), 'JBSWY3DPEHPK3PXP'),
  ('f5921000-0000-4000-8000-000000000004', 'f5920000-0000-4000-8000-000000000004', 'S', 'totp',
   'verified', now(), now(), 'JBSWY3DPEHPK3PXP');
insert into public.venues (id, name) values ('f5922000-0000-4000-8000-000000000001', 'Venue MFA');

create function pg_temp.as_user(p_id uuid, p_aal text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', p_aal)::text, true)
$$;

-- ---- Tanpa kewajiban: hanya pengguna yang mengaktifkan 2FA sendiri yang ditantang ----
select pg_temp.as_user('f5920000-0000-4000-8000-000000000002', 'aal1');
select is(app.user_role(), 'editor', 'Editor tanpa 2FA dan tanpa kewajiban punya hak dengan password');
select is((select satisfied from public.mfa_status()), true, 'Status 2FA Editor terpenuhi');

select pg_temp.as_user('f5920000-0000-4000-8000-000000000003', 'aal1');
select is(app.user_role(), null, 'Pengguna yang mengaktifkan 2FA tanpa hak sebelum memasukkan kode');
select is(
  (select row(required, role_required, has_totp, satisfied)::text from public.mfa_status()),
  '(t,f,t,f)', 'Status 2FA: wajib karena diaktifkan sendiri, belum terpenuhi');
select pg_temp.as_user('f5920000-0000-4000-8000-000000000003', 'aal2');
select is(app.user_role(), 'admin', 'Setelah kode benar (aal2) hak kembali');

-- ---- Super Admin mewajibkan 2FA per role ----
select pg_temp.as_user('f5920000-0000-4000-8000-000000000001', 'aal1');
select throws_ok(
  $$ update public.system_settings set mfa_required_roles = '{super_admin}' where id $$,
  'IM409', null, 'Super Admin tanpa 2FA tidak bisa mewajibkan 2FA untuk role-nya sendiri');
select lives_ok(
  $$ update public.system_settings set mfa_required_roles = '{editor,admin}' where id $$,
  'Super Admin mewajibkan 2FA untuk Editor dan Admin');
select ok(
  exists (
    select 1 from public.audit_events
    where action = 'settings_changed' and user_id = 'f5920000-0000-4000-8000-000000000001'
      and details -> 'fields' ? 'mfa_required_roles'),
  'Perubahan role wajib 2FA tercatat di audit');

select pg_temp.as_user('f5920000-0000-4000-8000-000000000002', 'aal1');
select is(app.user_role(), null, 'Editor yang diwajibkan 2FA tanpa hak dengan password saja');
select is(
  (select row(required, role_required, has_totp, satisfied)::text from public.mfa_status()),
  '(t,t,f,f)', 'Status 2FA Editor: wajib, belum punya aplikasi, belum terpenuhi');
set local role authenticated;
select is((select count(*)::int from public.venues where id = 'f5922000-0000-4000-8000-000000000001'),
  0, 'Venue tidak terbaca tanpa kode');
select is((select count(*)::int from public.profiles where user_id = auth.uid()), 1,
  'Profil sendiri tetap terbaca untuk layar kode');
select throws_ok(
  $$ insert into public.venues (name) values ('Tanpa kode') $$, '42501', null,
  'Venue tidak bisa dibuat tanpa kode');
reset role;
select pg_temp.as_user('f5920000-0000-4000-8000-000000000002', 'aal2');
set local role authenticated;
select is((select count(*)::int from public.venues where id = 'f5922000-0000-4000-8000-000000000001'),
  1, 'Venue terbaca setelah kode benar');
reset role;

select pg_temp.as_user('f5920000-0000-4000-8000-000000000001', 'aal1');
select is(app.user_role(), 'super_admin', 'Role yang tidak diwajibkan tetap masuk dengan password');

-- ---- Kode cadangan ----
select pg_temp.as_user('f5920000-0000-4000-8000-000000000003', 'aal1');
select throws_ok($$ select public.mfa_recovery_codes_generate() $$, 'IM403', null,
  'Kode cadangan tidak bisa dibuat dengan password saja');
select pg_temp.as_user('f5920000-0000-4000-8000-000000000002', 'aal2');
select throws_ok($$ select public.mfa_recovery_codes_generate() $$, 'IM403', null,
  'Kode cadangan tidak bisa dibuat sebelum aplikasi autentikator terdaftar');

select pg_temp.as_user('f5920000-0000-4000-8000-000000000003', 'aal2');
create temp table codes as select unnest(public.mfa_recovery_codes_generate()) as code;
select is((select count(distinct code)::int from codes), 10, '10 kode cadangan berbeda');
select ok((select bool_and(code ~ '^[2-9A-HJ-NP-Z]{5}-[2-9A-HJ-NP-Z]{5}$') from codes),
  'Kode berbentuk XXXXX-XXXXX tanpa 0/O/1/I');
select is(public.mfa_recovery_codes_left(), 10, 'Sisa 10 kode');
select ok(
  not exists (
    select 1 from app.mfa_recovery_codes c join codes on c.code_hash = replace(codes.code, '-', '')),
  'Kode disimpan sebagai hash, bukan teks');
select ok(
  exists (select 1 from public.audit_events where action = 'mfa_recovery_codes_created'
          and entity_id = 'f5920000-0000-4000-8000-000000000003'),
  'Pembuatan kode cadangan tercatat di audit');

select pg_temp.as_user('f5920000-0000-4000-8000-000000000003', 'aal1');
select is(public.mfa_recover('AAAAA-AAAAA'), false, 'Kode cadangan salah ditolak');
select ok(
  exists (select 1 from public.audit_events where action = 'mfa_recovery_failed'
          and user_id = 'f5920000-0000-4000-8000-000000000003'),
  'Percobaan gagal tercatat di audit');
select is(public.mfa_recover(lower(replace((select min(code) from codes), '-', ''))), true,
  'Kode cadangan benar diterima tanpa tanda hubung dan huruf besar');
select is(
  (select count(*)::int from auth.mfa_factors where user_id = 'f5920000-0000-4000-8000-000000000003'),
  0, 'Aplikasi autentikator lama dilepas setelah kode cadangan dipakai');
select is(public.mfa_recovery_codes_left(), 0, 'Kode cadangan lain tidak berlaku lagi');
select is(public.mfa_recover((select min(code) from codes)), false,
  'Kode cadangan yang sama tidak bisa dipakai dua kali');
select ok(
  exists (select 1 from public.audit_events where action = 'mfa_recovery_used'
          and user_id = 'f5920000-0000-4000-8000-000000000003'),
  'Pemakaian kode cadangan tercatat di audit');
select is(app.user_role(), null,
  'Role yang diwajibkan tetap tanpa hak sampai aplikasi baru didaftarkan');
select is((select row(has_totp, satisfied)::text from public.mfa_status()), '(f,f)',
  'Status meminta pendaftaran aplikasi baru');

select public.mfa_recover('AAAAA-AAAAA');
select public.mfa_recover('AAAAA-AAAAA');
select public.mfa_recover('AAAAA-AAAAA');
select throws_ok($$ select public.mfa_recover('AAAAA-AAAAA') $$, 'IM429', null,
  'Lima kode salah dalam 15 menit menahan percobaan berikutnya');

-- ---- Reset 2FA oleh Super Admin ----
insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret)
values ('f5921000-0000-4000-8000-000000000002', 'f5920000-0000-4000-8000-000000000002', 'E', 'totp',
        'verified', now(), now(), 'JBSWY3DPEHPK3PXP');
insert into auth.sessions (id, user_id) values
  ('f5923000-0000-4000-8000-000000000002', 'f5920000-0000-4000-8000-000000000002');

select pg_temp.as_user('f5920000-0000-4000-8000-000000000002', 'aal2');
select throws_ok($$ select public.user_mfa_reset('f5920000-0000-4000-8000-000000000003') $$,
  '42501', null, 'Selain Super Admin tidak bisa mereset 2FA');
select throws_ok($$ select * from public.user_mfa_list() $$, '42501', null,
  'Selain Super Admin tidak bisa melihat daftar pengguna ber-2FA');
select pg_temp.as_user('f5920000-0000-4000-8000-000000000004', 'aal1');
select throws_ok($$ select public.user_mfa_reset('f5920000-0000-4000-8000-000000000002') $$,
  '42501', null, 'Super Admin ber-2FA tidak bisa mereset dengan password saja');

select pg_temp.as_user('f5920000-0000-4000-8000-000000000001', 'aal1');
select is(
  (select array_agg(user_id order by user_id)::text from public.user_mfa_list()
   where user_id::text like 'f5920000-%'),
  '{f5920000-0000-4000-8000-000000000002,f5920000-0000-4000-8000-000000000004}',
  'Super Admin melihat pengguna yang memakai 2FA');
select throws_ok($$ select public.user_mfa_reset('f5920000-0000-4000-8000-000000000001') $$,
  'IM409', null, 'Super Admin tidak mereset 2FA akunnya sendiri dari halaman Pengguna');
select lives_ok($$ select public.user_mfa_reset('f5920000-0000-4000-8000-000000000002') $$,
  'Super Admin mereset 2FA Editor');
select is(
  (select count(*)::int from auth.mfa_factors where user_id = 'f5920000-0000-4000-8000-000000000002')
  + (select count(*)::int from auth.sessions where user_id = 'f5920000-0000-4000-8000-000000000002'),
  0, 'Aplikasi autentikator dan sesi Editor dihapus');
select ok(
  exists (select 1 from public.audit_events where action = 'mfa_reset'
          and user_id = 'f5920000-0000-4000-8000-000000000001'
          and entity_id = 'f5920000-0000-4000-8000-000000000002'),
  'Reset tercatat di audit dengan pelaku Super Admin dan sasaran Editor');

-- ---- Faktor dilepas di luar fungsi kita: kode cadangan ikut gugur ----
insert into app.mfa_recovery_codes (user_id, code_hash)
values ('f5920000-0000-4000-8000-000000000004', 'hash-uji');
delete from auth.mfa_factors where id = 'f5921000-0000-4000-8000-000000000004';
select is(
  (select count(*)::int from app.mfa_recovery_codes where user_id = 'f5920000-0000-4000-8000-000000000004'),
  0, 'Melepas aplikasi autentikator terakhir menghapus kode cadangannya');
select ok(
  not exists (select 1 from public.audit_events where action = 'mfa_disabled'
              and entity_id = 'f5920000-0000-4000-8000-000000000004'),
  'Hanya pelepasan oleh Auth yang dicatat sebagai mfa_disabled');

select * from finish();
rollback;
