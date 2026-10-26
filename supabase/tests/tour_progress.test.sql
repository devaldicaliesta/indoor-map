-- Status tur hanya milik pengguna itu sendiri (T-599, TC-SEC-73).
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email) values
  ('e5990000-0000-4000-8000-000000000001', 'ana@tur.test'),
  ('e5990000-0000-4000-8000-000000000002', 'budi@tur.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e5990000-0000-4000-8000-000000000001', 'Ana', 'ana@tur.test', 'viewer'),
  ('e5990000-0000-4000-8000-000000000002', 'Budi', 'budi@tur.test', 'super_admin');

create function pg_temp.as_user(p_id uuid) returns void
language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;
select pg_temp.as_user('e5990000-0000-4000-8000-000000000002');
select lives_ok(
  $$ insert into public.tour_progress (tour_key) values ('locations@1') $$,
  'Budi menandai tur miliknya (user_id dari sesi)'
);

select pg_temp.as_user('e5990000-0000-4000-8000-000000000001');
select lives_ok(
  $$ insert into public.tour_progress (tour_key) values ('locations@1') on conflict do nothing $$,
  'Viewer juga menyimpan status tur (bukan konten venue)'
);
select is(
  (select count(*)::int from public.tour_progress), 1,
  'Ana hanya melihat barisnya sendiri'
);
select throws_ok(
  $$ insert into public.tour_progress (user_id, tour_key)
     values ('e5990000-0000-4000-8000-000000000002', 'editor@1') $$,
  '42501', null,
  'Ana tidak bisa menulis status tur atas nama Budi'
);
select is_empty(
  $$ update public.tour_progress set seen_at = now()
     where user_id = 'e5990000-0000-4000-8000-000000000002' returning 1 $$,
  'Ana tidak bisa mengubah baris Budi'
);
select throws_ok(
  $$ update public.tour_progress set user_id = 'e5990000-0000-4000-8000-000000000002'
     where user_id = 'e5990000-0000-4000-8000-000000000001' $$,
  '42501', null,
  'Ana tidak bisa memindahkan barisnya menjadi milik Budi'
);
select throws_ok(
  $$ delete from public.tour_progress $$,
  '42501', null,
  'Status tur tidak dihapus lewat API'
);
select throws_ok(
  $$ insert into public.tour_progress (tour_key) values ('Editor') $$,
  '23514', null,
  'Kunci tur wajib berbentuk nama@versi'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.tour_progress $$,
  '42501', null,
  'Pengunjung (anon) tidak punya akses'
);

reset role;
select is(
  (select count(*)::int from public.tour_progress
   where user_id = 'e5990000-0000-4000-8000-000000000002'),
  1,
  'Baris Budi tetap satu dan tidak berubah pemilik'
);

select * from finish();
rollback;
