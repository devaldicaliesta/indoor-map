-- Sesi dicabut saat pengguna dinonaktifkan (T-009b, temuan T-307a).
begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

insert into auth.users (id, email) values
  ('e0000000-0000-4000-8000-000000000001', 'sesi@revoke.test'),
  ('e0000000-0000-4000-8000-000000000002', 'lain@revoke.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('e0000000-0000-4000-8000-000000000001', 'Uji Sesi', 'sesi@revoke.test', 'editor'),
  ('e0000000-0000-4000-8000-000000000002', 'Uji Lain', 'lain@revoke.test', 'viewer');
insert into auth.sessions (id, user_id) values
  ('e1000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000002');

update public.profiles set full_name = 'Uji Sesi Diubah'
where user_id = 'e0000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::int from auth.sessions where user_id = 'e0000000-0000-4000-8000-000000000001'),
  2,
  'Perubahan lain pada profil tidak mencabut sesi'
);

update public.profiles set is_active = false
where user_id = 'e0000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::int from auth.sessions where user_id = 'e0000000-0000-4000-8000-000000000001'),
  0,
  'Menonaktifkan pengguna mencabut semua sesinya'
);
select is(
  (select count(*)::int from auth.sessions where user_id = 'e0000000-0000-4000-8000-000000000002'),
  1,
  'Sesi pengguna lain tidak tersentuh'
);

select * from finish();
rollback;
