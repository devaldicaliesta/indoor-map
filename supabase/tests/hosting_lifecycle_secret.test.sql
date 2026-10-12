-- T-615a (migrasi 0054): trial-lifecycle hanya untuk pg_cron (rahasia Vault) dan dasbor vendor.
begin;
create extension if not exists pgtap with schema extensions;
delete from app.server_settings where key in ('hosting_mode', 'functions_url');

select plan(11);

-- ---- Rahasia di Vault ----
select is((select count(*)::int from vault.secrets where name = 'trial_lifecycle_secret'), 1,
  'Migrasi membuat rahasia trial_lifecycle_secret di Vault');
select matches(
  (select decrypted_secret from vault.decrypted_secrets where name = 'trial_lifecycle_secret'),
  '^[0-9a-f]{64}$',
  'Rahasia acak 256 bit (64 hex)');

-- ---- Pemeriksaan untuk Edge Function ----
select ok(public.hosting_lifecycle_authorized(
    (select decrypted_secret from vault.decrypted_secrets where name = 'trial_lifecycle_secret')),
  'Rahasia yang benar diterima');
select ok(not public.hosting_lifecycle_authorized('salah'), 'Rahasia salah ditolak');
select ok(not public.hosting_lifecycle_authorized(''), 'Rahasia kosong ditolak');
select ok(not public.hosting_lifecycle_authorized(null), 'Tanpa rahasia ditolak');

select ok(not has_function_privilege('anon', 'public.hosting_lifecycle_authorized(text)', 'execute'),
  'anon tidak bisa menebak rahasia lewat RPC');
select ok(not has_function_privilege('authenticated',
    'public.hosting_lifecycle_authorized(text)', 'execute'),
  'Pengguna masuk tidak bisa menebak rahasia lewat RPC');
select ok(has_function_privilege('service_role', 'public.hosting_lifecycle_authorized(text)',
    'execute'),
  'Edge Function (service role) bisa memeriksa');

-- ---- pg_cron mengirim rahasia ----
insert into app.server_settings (key, value) values
  ('hosting_mode', 'true'),
  ('functions_url', 'http://lifecycle.invalid/functions/v1');
select app.request_trial_lifecycle();
select is(
  (select headers ->> 'x-trial-lifecycle-secret' from net.http_request_queue
   where url = 'http://lifecycle.invalid/functions/v1/trial-lifecycle'
   order by id desc limit 1),
  (select decrypted_secret from vault.decrypted_secrets where name = 'trial_lifecycle_secret'),
  'Panggilan terjadwal membawa header rahasia');

-- Tanpa rahasia panggilan pasti ditolak, jadi tidak dikirim sama sekali.
delete from net.http_request_queue where url = 'http://lifecycle.invalid/functions/v1/trial-lifecycle';
delete from vault.secrets where name = 'trial_lifecycle_secret';
select app.request_trial_lifecycle();
select is(
  (select count(*)::int from net.http_request_queue
   where url = 'http://lifecycle.invalid/functions/v1/trial-lifecycle'),
  0,
  'Rahasia hilang: tidak ada panggilan yang dikirim');

select * from finish();
rollback;
