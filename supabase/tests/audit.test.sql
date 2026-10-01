-- Catatan peristiwa penting hanya dibaca Super Admin (T-012, NFR-SEC-05).
begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

insert into auth.users (id, email) values
  ('a3000000-0000-4000-8000-000000000001', 'sa@audit.test'),
  ('a3000000-0000-4000-8000-000000000002', 'ad@audit.test');
insert into public.profiles (user_id, full_name, email, role) values
  ('a3000000-0000-4000-8000-000000000001', 'SA', 'sa@audit.test', 'super_admin'),
  ('a3000000-0000-4000-8000-000000000002', 'AD', 'ad@audit.test', 'admin');
insert into public.audit_events (user_id, action) values ('a3000000-0000-4000-8000-000000000002', 'login');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a3000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select is_empty('select id from public.audit_events', 'Admin tidak bisa membaca catatan');
select throws_ok(
  $$ insert into public.audit_events (action) values ('login') $$, '42501', null,
  'Catatan tidak bisa ditulis langsung dari klien'
);
select set_config('request.jwt.claims', '{"sub": "a3000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
select isnt_empty('select id from public.audit_events', 'Super Admin membaca catatan');
reset role;

select * from finish();
rollback;
