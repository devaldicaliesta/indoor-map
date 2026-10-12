-- T-617: dasbor vendor — hanya staf vendor dengan sesi dua langkah; tindakan memajukan siklus hidup.
begin;
create extension if not exists pgtap with schema extensions;
-- Mulai dari keadaan on-premise: test E2E dan integrasi sengaja membiarkan hosting_mode menyala.
delete from app.server_settings where key in ('hosting_mode', 'trial_capacity');

select plan(38);

insert into app.server_settings (key, value) values ('hosting_mode', 'true');

insert into auth.users (id, email) values
  ('b3000000-0000-4000-8000-0000000000f1', 'staf@vendor.id'),
  ('b3000000-0000-4000-8000-0000000000f2', 'mantan@vendor.id'),
  ('b3000000-0000-4000-8000-0000000000aa', 'a@dasbor.id'),
  ('b3000000-0000-4000-8000-0000000000bb', 'b@dasbor.id');
insert into public.profiles (user_id, full_name, email, role, all_venues, is_active) values
  ('b3000000-0000-4000-8000-0000000000f1', 'Staf', 'staf@vendor.id', 'super_admin', true, true),
  ('b3000000-0000-4000-8000-0000000000f2', 'Mantan', 'mantan@vendor.id', 'super_admin', true,
   false),
  ('b3000000-0000-4000-8000-0000000000aa', 'A', 'a@dasbor.id', 'admin', false, true),
  ('b3000000-0000-4000-8000-0000000000bb', 'B', 'b@dasbor.id', 'admin', false, true);
insert into hosting.vendor_staff (user_id) values
  ('b3000000-0000-4000-8000-0000000000f1'),
  ('b3000000-0000-4000-8000-0000000000f2');

insert into public.venues (id, name, slug) values
  ('d3000000-0000-4000-8000-0000000000aa', 'Trial A', 'dasbor-a'),
  ('d3000000-0000-4000-8000-0000000000bb', 'Trial B', 'dasbor-b');
insert into hosting.trial_requests
  (id, name, institution, title, email, phone, building_type, building_size, language, status,
   ip)
values
  ('e3000000-0000-4000-8000-0000000000aa', 'A', 'RS A', 'M', 'a@dasbor.id', '+62 812 0000 0000',
   'hospital', 'lt5k', 'id', 'active', '203.0.113.7'),
  ('e3000000-0000-4000-8000-0000000000bb', 'B', 'RS B', 'M', 'b@dasbor.id', '+62 812 0000 0000',
   'hospital', 'lt5k', 'id', 'active', null),
  ('e3000000-0000-4000-8000-0000000000cc', 'C', 'RS C', 'M', 'c@dasbor.id', '+62 812 0000 0000',
   'mall', 'lt5k', 'en', 'queued', null);
insert into hosting.trials (venue_id, user_id, request_id, started_at, ends_at, reminded_at) values
  ('d3000000-0000-4000-8000-0000000000aa', 'b3000000-0000-4000-8000-0000000000aa',
   'e3000000-0000-4000-8000-0000000000aa', now() - interval '15 days', now() + interval '2 days',
   now() - interval '1 hour'),
  ('d3000000-0000-4000-8000-0000000000bb', 'b3000000-0000-4000-8000-0000000000bb',
   'e3000000-0000-4000-8000-0000000000bb', now() - interval '1 day', now() + interval '16 days',
   null);
insert into public.venue_members (venue_id, user_id) values
  ('d3000000-0000-4000-8000-0000000000aa', 'b3000000-0000-4000-8000-0000000000aa'),
  ('d3000000-0000-4000-8000-0000000000bb', 'b3000000-0000-4000-8000-0000000000bb');
insert into public.publications (venue_id, version, snapshot_path, is_active) values
  ('d3000000-0000-4000-8000-0000000000aa', 1, 'x/v1.json', false),
  ('d3000000-0000-4000-8000-0000000000aa', 2, 'x/v2.json', true);

create function pg_temp.as_user(p_id uuid, p_aal text) returns void
language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', p_aal)::text, true)
$$;

-- ---- Akses: staf vendor + dua langkah + project ter-hosting ----
set local role anon;
select throws_ok($$ select public.vendor_access() $$, '42501', null,
  'Pengunjung tanpa login tidak bisa memanggil fungsi dasbor');
reset role;
set local role authenticated;
select lives_ok($$ select public.vendor_access() $$, 'Pengguna login boleh menanyakan aksesnya');
reset role;
select pg_temp.as_user('b3000000-0000-4000-8000-0000000000aa', 'aal2');
select is(public.vendor_access(), 'denied', 'Pengguna trial (walau aal2) bukan staf vendor');
select pg_temp.as_user('b3000000-0000-4000-8000-0000000000f2', 'aal2');
select is(public.vendor_access(), 'denied', 'Staf vendor yang profilnya nonaktif ditolak');
select pg_temp.as_user('b3000000-0000-4000-8000-0000000000f1', 'aal1');
select is(public.vendor_access(), 'mfa', 'Staf vendor dengan password saja diminta kode 2FA');
select throws_ok($$ select * from public.vendor_requests() $$, '42501', null,
  'Leads tidak terbaca tanpa verifikasi dua langkah');
select throws_ok($$ select public.vendor_trial_lock('d3000000-0000-4000-8000-0000000000aa') $$,
  '42501', null, 'Tindakan ditolak tanpa verifikasi dua langkah');

select pg_temp.as_user('b3000000-0000-4000-8000-0000000000aa', 'aal2');
select throws_ok($$ select * from public.vendor_requests() $$, '42501', null,
  'Pengguna trial tidak bisa membaca leads trial lain');
select throws_ok($$ select public.vendor_block('pesaing.co.id') $$, '42501', null,
  'Pengguna trial tidak bisa mengubah daftar blokir');

delete from app.server_settings where key = 'hosting_mode';
select pg_temp.as_user('b3000000-0000-4000-8000-0000000000f1', 'aal2');
select is(public.vendor_access(), 'denied', 'Tanpa hosting_mode (on-premise) dasbor tertutup');
insert into app.server_settings (key, value) values ('hosting_mode', 'true');

select is(public.vendor_access(), 'ok', 'Staf vendor dengan sesi aal2 boleh masuk');

-- ---- Baca ----
select is(public.vendor_capacity(), 15, 'Kapasitas bawaan 15 trial');
select is((select count(*)::int from public.vendor_requests() where email like '%@dasbor.id'), 3,
  'Semua permintaan trial terbaca, termasuk antrean');
select is(
  (select published_versions || '/' || slug from public.vendor_requests()
   where email = 'a@dasbor.id'),
  '2/dasbor-a', 'Baris memuat ruang kerja dan jumlah versi terbit');
select ok(
  not exists (
    select 1 from pg_proc p, unnest(p.proargnames) a
    where p.proname = 'vendor_requests' and a = 'ip'),
  'IP pemohon tidak ikut dibaca dasbor');

-- ---- Perpanjang (total ≤ 17 hari) ----
select lives_ok($$ select public.vendor_trial_extend('d3000000-0000-4000-8000-0000000000aa', 5) $$,
  'Staf vendor memperpanjang trial 5 hari');
select ok(
  (select ends_at between now() + interval '7 days' - interval '1 minute'
                      and now() + interval '7 days' + interval '1 minute'
   from hosting.trials where venue_id = 'd3000000-0000-4000-8000-0000000000aa'),
  'Tanggal berakhir bertambah 5 hari');
select is(
  (select extended_days from hosting.trials
   where venue_id = 'd3000000-0000-4000-8000-0000000000aa'),
  5, 'Jumlah hari perpanjangan dicatat');
select is(
  (select reminded_at from hosting.trials
   where venue_id = 'd3000000-0000-4000-8000-0000000000aa'),
  null, 'Pengingat dikirim lagi untuk masa yang baru');
select throws_like(
  $$ select public.vendor_trial_extend('d3000000-0000-4000-8000-0000000000aa', 13) $$,
  '%sisa 12 hari%', 'Perpanjangan melewati total 17 hari ditolak');
select lives_ok(
  $$ select public.vendor_trial_extend('d3000000-0000-4000-8000-0000000000aa', 12) $$,
  'Perpanjangan tepat sampai total 17 hari diterima');
select throws_ok(
  $$ select public.vendor_trial_extend('d3000000-0000-4000-8000-0000000000aa', 1) $$,
  'IM422', null, 'Setelah total 17 hari tidak bisa diperpanjang lagi');
select throws_ok(
  $$ select public.vendor_trial_extend('d3000000-0000-4000-8000-0000000000bb', 0) $$,
  'IM422', null, 'Perpanjangan 0 hari ditolak');

-- ---- Kunci: siklus hidup yang mengerjakan ----
select lives_ok($$ select public.vendor_trial_lock('d3000000-0000-4000-8000-0000000000bb') $$,
  'Staf vendor mengakhiri trial sekarang');
select ok(
  (select ends_at <= now() and locked_at is null from hosting.trials
   where venue_id = 'd3000000-0000-4000-8000-0000000000bb'),
  'Trial berakhir sekarang; penguncian diserahkan ke siklus hidup');
reset role;
select is(
  (select array_agg(venue_id::text) from public.hosting_lifecycle_lock()),
  array['d3000000-0000-4000-8000-0000000000bb'], 'Siklus hidup menguncinya seperti hari ke-17');
select throws_ok(
  $$ select public.vendor_trial_extend('d3000000-0000-4000-8000-0000000000bb', 3) $$,
  'IM409', null, 'Trial terkunci tidak bisa diperpanjang');
select throws_ok($$ select public.vendor_trial_lock('d3000000-0000-4000-8000-0000000000bb') $$,
  'IM409', null, 'Trial terkunci tidak dikunci dua kali');

-- ---- Hapus ----
select lives_ok($$ select public.vendor_trial_delete('d3000000-0000-4000-8000-0000000000aa') $$,
  'Staf vendor menghapus trial aktif');
select is(
  (select status from hosting.trial_requests where id = 'e3000000-0000-4000-8000-0000000000aa'),
  'locked', 'Slot trial yang dihapus langsung dilepas');
select is(
  (select array_agg(venue_id::text order by venue_id) from public.hosting_lifecycle_expired()),
  array['d3000000-0000-4000-8000-0000000000aa'],
  'Siklus hidup menghapusnya di putaran berikutnya');
select throws_ok(
  $$ select public.vendor_trial_delete('d3000000-0000-4000-8000-0000000000ff') $$,
  'IM404', null, 'Venue yang bukan trial tidak bisa dihapus dari dasbor');

-- ---- Daftar blokir ----
select is(public.vendor_block('  Spam@Contoh.ID ', 'iklan'), 'email',
  'Alamat email diblokir (huruf kecil, tanpa spasi)');
select is(public.vendor_block('pesaing.co.id'), 'domain', 'Domain kantor diblokir');
select throws_like($$ select public.vendor_block('gmail.com') $$, '%Domain email umum%',
  'Domain email umum tidak bisa diblokir');
select throws_ok($$ select public.vendor_block('bukan domain') $$, 'IM422', null,
  'Isian yang bukan email atau domain ditolak');
select public.vendor_unblock('PESAING.co.id');
select is(
  (select array_agg(value) from public.vendor_blocklist()
   where value in ('spam@contoh.id', 'pesaing.co.id')),
  array['spam@contoh.id'],
  'Blokir domain dibuka lagi');

reset role;
select is(
  (select array_agg(action order by id) from hosting.vendor_actions
   where user_id = 'b3000000-0000-4000-8000-0000000000f1'),
  array['trial_extended', 'trial_extended', 'trial_locked', 'trial_deleted', 'blocked',
    'blocked', 'unblocked'],
  'Setiap tindakan staf vendor tercatat');

select * from finish();
rollback;
