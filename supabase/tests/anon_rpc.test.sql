-- RPC public yang bisa dipanggil anon hanya yang sengaja dibuka (sama dengan TC-SEC-45b di E2E):
-- license_status dan eula_status untuk halaman aktivasi, notification_unsubscribe untuk tautan email.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select is_empty(
  $$
    select p.proname::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_roles r on r.oid = p.proowner
    where n.nspname = 'public'
      and p.prokind = 'f'
      and r.rolname <> 'supabase_admin'
      and has_function_privilege('anon', p.oid, 'execute')
      and p.proname not like 'st\_%'
      and p.proname not like '\_%'
      and p.proname not in ('license_status', 'eula_status', 'notification_unsubscribe')
  $$,
  'tidak ada RPC public yang bisa dipanggil anon selain yang disengaja'
);

select ok(
  has_function_privilege('authenticated', 'public.vendor_clients()', 'execute'),
  'vendor_clients tetap bisa dipanggil pengguna login (require_vendor yang menyaring)'
);
select ok(
  has_function_privilege('authenticated', 'public.vendor_installations()', 'execute'),
  'vendor_installations tetap bisa dipanggil pengguna login (require_vendor yang menyaring)'
);

select * from finish();
rollback;
