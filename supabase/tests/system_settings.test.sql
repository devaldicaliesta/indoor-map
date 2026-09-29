-- Pengaturan sistem dan password SMTP di Vault (T-010, migrasi 0004).
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email) values
  ('b2000000-0000-4000-8000-000000000001', 'sa@settings.test'),
  ('b2000000-0000-4000-8000-000000000002', 'ad@settings.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('b2000000-0000-4000-8000-000000000001', 'SA', 'sa@settings.test', 'super_admin'),
  ('b2000000-0000-4000-8000-000000000002', 'AD', 'ad@settings.test', 'admin');

set local role authenticated;

-- Admin (bukan Super Admin)
select set_config('request.jwt.claims', '{"sub": "b2000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select is_empty('select id from public.system_settings', 'Admin tidak bisa membaca system_settings');
select throws_ok($$ select public.set_smtp_password('rahasia') $$, '42501', null, 'Admin tidak bisa mengubah password SMTP');
select throws_ok($$ select public.smtp_password_is_set() $$, '42501', null, 'Admin tidak bisa melihat status password SMTP');
select throws_ok($$ select public.smtp_password_for_sending() $$, '42501', null, 'Pengguna login tidak pernah bisa membaca password SMTP');

-- Super Admin
select set_config('request.jwt.claims', '{"sub": "b2000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
select isnt_empty('select id from public.system_settings', 'Super Admin membaca system_settings');
select lives_ok($$ select public.set_smtp_password('rahasia-smtp') $$, 'Super Admin menyimpan password SMTP');
select ok(public.smtp_password_is_set(), 'Status password SMTP: tersimpan');
select lives_ok(
  $$ update public.system_settings set public_visitor_url = 'https://peta.contoh.id', smtp_port = 587 $$,
  'Super Admin mengubah pengaturan'
);
reset role;

select results_eq(
  $$ select details -> 'fields' from public.audit_events where action = 'settings_changed' order by id $$,
  $$ values ('["smtp_password"]'::jsonb), ('["public_visitor_url", "smtp_port"]'::jsonb) $$,
  'Perubahan dicatat tanpa menyimpan nilai rahasia'
);

select * from finish();
rollback;
