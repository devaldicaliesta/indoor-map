-- Uji RLS minimal (T-004). Setiap uji berjalan dalam transaksi dan di-rollback.
begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

-- Data uji dibuat sebagai postgres (melewati RLS).
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-000000000001', 'editor@rls.test'),
  ('a0000000-0000-4000-8000-000000000002', 'admin@rls.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('a0000000-0000-4000-8000-000000000001', 'Editor Uji', 'editor@rls.test', 'editor'),
  ('a0000000-0000-4000-8000-000000000002', 'Admin Uji', 'admin@rls.test', 'admin');

insert into public.venues (id, name) values ('b0000000-0000-4000-8000-000000000001', 'Venue Uji RLS');
insert into public.connectors (id, venue_id, kind, name, is_accessible) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'stairs', 'Tangga A', false),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'stairs', 'Tangga B', false),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'stairs', 'Tangga C', false);
insert into public.closures (venue_id, connector_id, reason, starts_at, ends_at) values
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'berlaku', now() - interval '1 hour', null),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002',
   'sudah selesai', now() - interval '2 days', now() - interval '1 day'),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003',
   'belum mulai', now() + interval '1 day', null);

-- anon
set local role anon;
select is_empty('select id from public.venues', 'anon tidak bisa membaca venues');
select throws_ok(
  $$ delete from extensions.spatial_ref_sys where srid = 4326 $$,
  '42501',
  null,
  'anon tidak bisa mengubah spatial_ref_sys'
);
-- Dibatasi ke venue uji ini: data demo (`db:seed-demo`) juga punya penutupan yang sedang
-- berlaku, dan uji ini soal jendela waktu, bukan soal jumlah penutupan di seluruh database.
select results_eq(
  $$ select reason from public.closures
     where venue_id = 'b0000000-0000-4000-8000-000000000001' order by reason $$,
  array['berlaku'],
  'anon hanya membaca penutupan yang sedang berlaku'
);
reset role;

-- Editor
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ insert into public.venues (name) values ('Venue dari Editor') $$,
  '42501',
  null,
  'Editor tidak bisa insert venues'
);
select isnt_empty('select id from public.venues', 'Editor bisa membaca venues');
select throws_ok(
  $$ insert into extensions.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text)
     values (990001, 'uji', 1, 'uji', 'uji') $$,
  '42501',
  null,
  'Pengguna login tidak bisa menambah spatial_ref_sys'
);
reset role;

-- Admin
set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select lives_ok(
  $$ insert into public.venues (name) values ('Venue dari Admin') $$,
  'Admin bisa insert venues (termasuk data bawaan dari trigger)'
);
select is(
  (select count(*)::int from public.floors f join public.venues v on v.id = f.venue_id
   where v.name = 'Venue dari Admin' and f.is_outdoor),
  1,
  'Venue buatan Admin otomatis punya lapisan Area Luar'
);
reset role;

select * from finish();
rollback;
