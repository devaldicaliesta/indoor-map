-- T-611a (lanjutan): isolasi venue di Storage (NFR-HT-02 jalur Storage).
-- Pengguna trial tidak bisa membaca, menulis, atau menghapus berkas venue lain:
-- denah (floor-plans), aset publik (public-assets), dan snapshot terbitan (snapshots).
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

insert into public.venues (id, name) values
  ('da000000-0000-4000-8000-0000000000aa', 'Venue A'),
  ('da000000-0000-4000-8000-0000000000bb', 'Venue B');

insert into auth.users (id, email) values
  ('ab000000-0000-4000-8000-000000000001', 'a1@trial.test'),
  ('ab000000-0000-4000-8000-0000000000c1', 'omni@panduarah.test');
insert into public.profiles (user_id, full_name, email, role, all_venues) values
  ('ab000000-0000-4000-8000-000000000001', 'A1', 'a1@trial.test', 'admin', false),
  ('ab000000-0000-4000-8000-0000000000c1', 'OMNI', 'omni@panduarah.test', 'admin', true);
insert into public.venue_members (venue_id, user_id) values
  ('da000000-0000-4000-8000-0000000000aa', 'ab000000-0000-4000-8000-000000000001');

-- Berkas milik venue B (disiapkan sebagai postgres, menembus RLS).
insert into storage.objects (bucket_id, name) values
  ('floor-plans', 'da000000-0000-4000-8000-0000000000bb/lantai-1/denah-source.png'),
  ('public-assets', 'locations/da000000-0000-4000-8000-0000000000bb/foto.png'),
  ('snapshots', 'da000000-0000-4000-8000-0000000000bb/v1.json');

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;

-- ---- Pengguna trial A1 (anggota venue A) ----
select pg_temp.as_user('ab000000-0000-4000-8000-000000000001');

select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'floor-plans' and name like 'da000000-0000-4000-8000-0000000000bb/%'),
  0, 'A1 tidak melihat denah venue B');
select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'snapshots' and name like 'da000000-0000-4000-8000-0000000000bb/%'),
  0, 'A1 tidak melihat snapshot venue B');

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('floor-plans', 'da000000-0000-4000-8000-0000000000bb/lantai-1/liar.png') $$,
  '42501', null, 'A1 tidak bisa mengunggah denah ke venue B');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('floor-plans', 'da000000-0000-4000-8000-0000000000aa/lantai-1/ok.png') $$,
  'A1 bisa mengunggah denah ke venue sendiri (A)');

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('public-assets', 'locations/da000000-0000-4000-8000-0000000000bb/liar.png') $$,
  '42501', null, 'A1 tidak bisa mengunggah foto lokasi ke venue B');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('public-assets', 'locations/da000000-0000-4000-8000-0000000000aa/ok.png') $$,
  'A1 bisa mengunggah foto lokasi ke venue sendiri (A)');

-- ---- Pengguna akses-semua ----
select pg_temp.as_user('ab000000-0000-4000-8000-0000000000c1');
select is(
  (select count(*)::int from storage.objects
   where bucket_id = 'floor-plans' and name like 'da000000-0000-4000-8000-0000000000bb/%'),
  1, 'OMNI (akses-semua) melihat denah venue B');

-- Menghapus berkas lewat SQL mentah diblokir Supabase untuk semua orang
-- (trigger `storage.protect_delete`: "Use the Storage API instead"), jadi penghapusan lintas
-- venue hanya mungkin lewat Storage API — jalur itulah yang dijaga kebijakan `*_delete`.
-- Di sini dipastikan kebijakan hapusnya memang memuat syarat venue.
select is(
  (select count(*)::int from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname in ('floor_plans_delete', 'snapshots_delete')
     and qual like '%accessible_venue_keys%'),
  2, 'Kebijakan hapus denah dan snapshot memuat syarat venue');

select * from finish();
rollback;
