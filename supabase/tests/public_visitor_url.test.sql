-- URL publik Visitor dibaca staf tanpa membuka system_settings (T-212, migrasi 0013).
begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

update public.system_settings set public_visitor_url = 'https://peta.contoh.id';
insert into auth.users (id, email) values
  ('b3000000-0000-4000-8000-000000000001', 'ed@url.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('b3000000-0000-4000-8000-000000000001', 'ED', 'ed@url.test', 'editor');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "b3000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
select is(public.public_visitor_url(), 'https://peta.contoh.id', 'Editor membaca URL publik');
select is_empty('select id from public.system_settings', 'Editor tetap tidak membaca system_settings');

select set_config('request.jwt.claims', '{"sub": "b3000000-0000-4000-8000-0000000000ff", "role": "authenticated"}', true);
select throws_ok($$ select public.public_visitor_url() $$, '42501', null, 'Tanpa profil ditolak');
reset role;

set local role anon;
select throws_ok($$ select public.public_visitor_url() $$, '42501', null, 'Pengunjung tidak bisa memanggil');
reset role;

select * from finish();
rollback;
