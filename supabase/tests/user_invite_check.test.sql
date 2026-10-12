-- T-612c: siapa boleh mengundang pengguna, ke venue mana, dan dalam batas berapa.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into public.venues (id, name) values
  ('dd000000-0000-4000-8000-0000000000aa', 'Venue Trial Undangan');

insert into auth.users (id, email) values
  ('ae000000-0000-4000-8000-000000000001', 'va@undang.test'),
  ('ae000000-0000-4000-8000-000000000002', 've@undang.test'),
  ('ae000000-0000-4000-8000-000000000003', 'ad@undang.test'),
  ('ae000000-0000-4000-8000-000000000004', 'ed@undang.test'),
  ('ae000000-0000-4000-8000-0000000000c1', 'sa@undang.test');
insert into public.profiles (user_id, full_name, email, role, all_venues) values
  ('ae000000-0000-4000-8000-000000000001', 'Admin Venue', 'va@undang.test', 'admin', false),
  ('ae000000-0000-4000-8000-000000000002', 'Editor Venue', 've@undang.test', 'editor', false),
  ('ae000000-0000-4000-8000-000000000003', 'Admin Instalasi', 'ad@undang.test', 'admin', true),
  ('ae000000-0000-4000-8000-000000000004', 'Editor', 'ed@undang.test', 'editor', true),
  ('ae000000-0000-4000-8000-0000000000c1', 'Super', 'sa@undang.test', 'super_admin', true);
insert into public.venue_members (venue_id, user_id) values
  ('dd000000-0000-4000-8000-0000000000aa', 'ae000000-0000-4000-8000-000000000001');

insert into app.server_settings (key, value) values ('hosting_mode', 'true');
insert into hosting.trials (venue_id, user_id, ends_at) values
  ('dd000000-0000-4000-8000-0000000000aa', 'ae000000-0000-4000-8000-000000000001',
   now() + interval '17 days');

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;

-- ---- Super Admin: undangan tingkat instalasi seperti sebelumnya ----
select pg_temp.as_user('ae000000-0000-4000-8000-0000000000c1');
select is(public.user_invite_check('super_admin'), null::uuid,
  'Super Admin mengundang tingkat instalasi');

-- ---- Peran lain di instalasi tetap tidak bisa ----
select pg_temp.as_user('ae000000-0000-4000-8000-000000000003');
select throws_ok($$ select public.user_invite_check('editor') $$, '42501', null,
  'Admin instalasi (akses-semua) tetap tidak bisa mengundang');
select pg_temp.as_user('ae000000-0000-4000-8000-000000000004');
select throws_ok($$ select public.user_invite_check('viewer') $$, '42501', null,
  'Editor tidak bisa mengundang');

-- ---- Admin venue: mengundang ke venue-nya sendiri ----
select pg_temp.as_user('ae000000-0000-4000-8000-000000000001');
select is(public.user_invite_check('editor'), 'dd000000-0000-4000-8000-0000000000aa'::uuid,
  'Admin venue mengundang ke venue keanggotaannya');
select throws_ok($$ select public.user_invite_check('super_admin') $$, '42501', null,
  'Admin venue tidak bisa mengundang Super Admin');

reset role;
insert into public.venue_members (venue_id, user_id) values
  ('dd000000-0000-4000-8000-0000000000aa', 'ae000000-0000-4000-8000-000000000002');
set local role authenticated;
select pg_temp.as_user('ae000000-0000-4000-8000-000000000001');
select throws_like($$ select public.user_invite_check('editor') $$,
  '%Batas trial tercapai: pengguna aktif 2/2%',
  'Batas 2 pengguna ditolak sebelum email undangan dikirim');

-- Pengguna yang dinonaktifkan tidak dihitung, jadi slotnya bisa dipakai lagi.
reset role;
update public.profiles set is_active = false
where user_id = 'ae000000-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.as_user('ae000000-0000-4000-8000-000000000001');
select lives_ok($$ select public.user_invite_check('viewer') $$,
  'Anggota nonaktif tidak memakan batas');

-- ---- Venue terkunci: tidak bisa mengundang ----
reset role;
update hosting.trials set locked_at = now()
where venue_id = 'dd000000-0000-4000-8000-0000000000aa';
set local role authenticated;
select pg_temp.as_user('ae000000-0000-4000-8000-000000000001');
select throws_ok($$ select public.user_invite_check('viewer') $$, '42501', null,
  'Venue trial terkunci tidak bisa mengundang');

-- ---- Pengunjung tanpa login ----
reset role;
set local role anon;
select throws_ok($$ select public.user_invite_check('viewer') $$, '42501', null,
  'Pengunjung tidak bisa memanggil pemeriksa undangan');
reset role;

select * from finish();
rollback;
