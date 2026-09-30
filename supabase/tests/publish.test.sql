-- Publish minimal: pesanan versi, aktivasi, pembatalan (T-117).
begin;
create extension if not exists pgtap with schema extensions;

select plan(28);

insert into auth.users (id, email) values
  ('e3000000-0000-4000-8000-000000000001', 'ad@publish.test'),
  ('e3000000-0000-4000-8000-000000000002', 'ed@publish.test'),
  ('e3000000-0000-4000-8000-000000000003', 'op@publish.test'),
  ('e3000000-0000-4000-8000-000000000004', 'vw@publish.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e3000000-0000-4000-8000-000000000001', 'AD', 'ad@publish.test', 'admin'),
  ('e3000000-0000-4000-8000-000000000002', 'ED', 'ed@publish.test', 'editor'),
  ('e3000000-0000-4000-8000-000000000003', 'OP', 'op@publish.test', 'operator'),
  ('e3000000-0000-4000-8000-000000000004', 'VW', 'vw@publish.test', 'viewer');
insert into public.venues (id, name) values
  ('a3000000-0000-4000-8000-00000000000a', 'Venue Uji Publish');

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

create function pg_temp.pub(p_version integer) returns uuid
language sql as $$
  select id from public.publications
  where venue_id = 'a3000000-0000-4000-8000-00000000000a' and version = p_version
$$;

set local role authenticated;

-- Hanya Admin dan Super Admin yang boleh menerbitkan
select pg_temp.as_user('e3000000-0000-4000-8000-000000000002');
select throws_ok(
  $$ select * from public.publish_begin('a3000000-0000-4000-8000-00000000000a') $$,
  '42501',
  'Hanya Admin dan Super Admin yang bisa menerbitkan peta.',
  'Editor ditolak saat memesan publish'
);
select pg_temp.as_user('e3000000-0000-4000-8000-000000000003');
select throws_ok(
  $$ select * from public.publish_begin('a3000000-0000-4000-8000-00000000000a') $$,
  '42501', null, 'Operator ditolak saat memesan publish'
);
select pg_temp.as_user('e3000000-0000-4000-8000-000000000004');
select throws_ok(
  $$ select * from public.publish_begin('a3000000-0000-4000-8000-00000000000a') $$,
  '42501', null, 'Viewer ditolak saat memesan publish'
);

select pg_temp.as_user('e3000000-0000-4000-8000-000000000001');
select throws_ok(
  $$ select * from public.publish_begin('a3000000-0000-4000-8000-0000000000ff') $$,
  'P0002', 'Venue tidak ditemukan.', 'Venue yang tidak ada ditolak'
);

-- Versi pertama
select is(
  (select version from public.publish_begin('a3000000-0000-4000-8000-00000000000a')),
  1,
  'Admin memesan versi 1'
);
select throws_ok(
  $$ select * from public.publish_begin('a3000000-0000-4000-8000-00000000000a') $$,
  'IM409', null, 'Publish kedua ditolak selama publish pertama belum selesai'
);
select is(
  (select count(*)::int from public.publications
   where venue_id = 'a3000000-0000-4000-8000-00000000000a' and is_active),
  0,
  'Pesanan belum aktif sebelum di-commit'
);
select lives_ok(
  $$ select public.publish_commit(pg_temp.pub(1)) $$,
  'Admin mengaktifkan versi 1'
);
select results_eq(
  $$ select version, is_active, snapshot_path, published_by from public.publications
     where venue_id = 'a3000000-0000-4000-8000-00000000000a' $$,
  $$ values (1, true, 'a3000000-0000-4000-8000-00000000000a/v1.json',
             'e3000000-0000-4000-8000-000000000001'::uuid) $$,
  'Versi 1 aktif dengan path snapshot dan penerbitnya'
);

reset role;
select results_eq(
  $$ select user_id, details->>'version', details->>'venue' from public.audit_events
     where action = 'publish' and entity_id = 'a3000000-0000-4000-8000-00000000000a' $$,
  $$ values ('e3000000-0000-4000-8000-000000000001'::uuid, '1', 'Venue Uji Publish') $$,
  'Publish tercatat di catatan peristiwa'
);
set local role authenticated;
select pg_temp.as_user('e3000000-0000-4000-8000-000000000001');

-- Pembatalan
select is(
  (select version from public.publish_begin('a3000000-0000-4000-8000-00000000000a')),
  2,
  'Versi berikutnya 2'
);
select lives_ok(
  $$ select public.publish_abort(pg_temp.pub(2)) $$,
  'Pesanan versi 2 dibatalkan'
);
select is(
  (select count(*)::int from public.publications where venue_id = 'a3000000-0000-4000-8000-00000000000a'),
  1,
  'Pesanan yang batal terhapus; versi 1 tetap ada'
);
select lives_ok($$ select public.publish_abort(pg_temp.pub(1)) $$, 'Membatalkan versi aktif tidak error');
select is(
  (select is_active from public.publications where id = pg_temp.pub(1)),
  true,
  'Versi aktif tidak ikut terhapus oleh pembatalan'
);

-- Versi baru menggantikan yang lama
select is(
  (select version from public.publish_begin('a3000000-0000-4000-8000-00000000000a')),
  2,
  'Nomor versi yang batal dipakai lagi'
);
select lives_ok($$ select public.publish_commit(pg_temp.pub(2)) $$, 'Admin mengaktifkan versi 2');
select results_eq(
  $$ select version, is_active from public.publications
     where venue_id = 'a3000000-0000-4000-8000-00000000000a' order by version $$,
  $$ values (1, false), (2, true) $$,
  'Hanya versi terbaru yang aktif'
);
select throws_ok(
  $$ select public.publish_commit(pg_temp.pub(1)) $$,
  'IM409',
  'Versi yang lebih baru sudah terbit.',
  'Versi lama tidak bisa diaktifkan lewat publish'
);

-- Pesanan dari proses yang mati lebih dari 5 menit lalu tidak menghalangi
reset role;
insert into public.publications (venue_id, version, snapshot_path, published_at)
values ('a3000000-0000-4000-8000-00000000000a', 3,
        'a3000000-0000-4000-8000-00000000000a/v3.json', now() - interval '10 minutes');
set local role authenticated;
select pg_temp.as_user('e3000000-0000-4000-8000-000000000001');
select is(
  (select version from public.publish_begin('a3000000-0000-4000-8000-00000000000a')),
  4,
  'Pesanan lama yang tertinggal dilewati'
);

-- Editor tidak bisa mengaktifkan atau membatalkan; klien tidak bisa menulis langsung
select pg_temp.as_user('e3000000-0000-4000-8000-000000000002');
select throws_ok(
  $$ select public.publish_commit(pg_temp.pub(4)) $$,
  '42501', null, 'Editor ditolak saat mengaktifkan versi'
);
select throws_ok(
  $$ select public.publish_abort(pg_temp.pub(4)) $$,
  '42501', null, 'Editor ditolak saat membatalkan pesanan'
);
select pg_temp.as_user('e3000000-0000-4000-8000-000000000001');
select throws_ok(
  $$ insert into public.publications (venue_id, version, snapshot_path)
     values ('a3000000-0000-4000-8000-00000000000a', 9, 'x/v9.json') $$,
  '42501', null, 'Admin tidak bisa menulis tabel publications langsung'
);

-- Snapshot di Storage: Admin boleh mendaftar dan menghapus (saat venue dihapus), Editor tidak.
-- Storage menolak DELETE langsung dari SQL; perilaku hapus diuji di test integrasi venue.
reset role;
insert into storage.objects (bucket_id, name)
values ('snapshots', 'a3000000-0000-4000-8000-00000000000a/v1.json'),
       ('snapshots', 'a3000000-0000-4000-8000-00000000000a/latest.json');
select policy_cmd_is(
  'storage', 'objects', 'snapshots_delete', 'delete',
  'Policy hapus snapshot untuk Admin tersedia'
);
set local role authenticated;
select pg_temp.as_user('e3000000-0000-4000-8000-000000000002');
select is_empty(
  $$ select name from storage.objects where bucket_id = 'snapshots' $$,
  'Editor tidak bisa mendaftar snapshot'
);
select pg_temp.as_user('e3000000-0000-4000-8000-000000000001');
select results_eq(
  $$ select count(*)::int from storage.objects where bucket_id = 'snapshots'
     and name like 'a3000000-0000-4000-8000-00000000000a/%' $$,
  $$ values (2) $$,
  'Admin bisa mendaftar snapshot venue'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('snapshots', 'x/latest.json') $$,
  '42501', null, 'Admin tidak bisa menulis snapshot langsung; hanya Edge Function'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.publish_begin('a3000000-0000-4000-8000-00000000000a') $$,
  '42501', null, 'Pengunjung (anon) tidak bisa memanggil publish_begin'
);

select * from finish();
rollback;
