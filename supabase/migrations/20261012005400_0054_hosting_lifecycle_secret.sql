-- T-615a: Edge Function `trial-lifecycle` hanya untuk pemanggil sah (keputusan pemilik
-- 2026-10-12, opsi A di PROGRESS.md).
--
-- Fungsi itu `verify_jwt = false` karena pg_cron tidak punya JWT, sehingga sebelumnya siapa pun
-- bisa memicu satu putaran (idempoten, tetapi menghabiskan kuota Edge Function dan Storage paket
-- Free). Kini pemanggil sah hanya dua:
--   pg_cron        header `x-trial-lifecycle-secret` = rahasia Vault `trial_lifecycle_secret`
--   dasbor vendor  JWT staf vendor berverifikasi dua langkah (`vendor_access() = 'ok'`, 0053)
-- Rahasia dibuat acak di sini untuk setiap instalasi (tidak pernah ada di repo) dan hanya dibaca
-- pg_cron (definer) serta Edge Function lewat `hosting_lifecycle_authorized` (service role).

-- ---------------------------------------------------------------------
-- 1. Rahasia
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'trial_lifecycle_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'trial_lifecycle_secret',
      'Rahasia panggilan pg_cron ke Edge Function trial-lifecycle (T-615a)'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 2. Pemeriksaan untuk Edge Function
-- ---------------------------------------------------------------------
create function public.hosting_lifecycle_authorized(p_secret text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  -- Membandingkan hash, bukan teks, agar lama perbandingan tidak bergantung panjang awalan
  -- yang cocok.
  select coalesce(p_secret, '') <> '' and exists (
    select 1 from vault.decrypted_secrets s
    where s.name = 'trial_lifecycle_secret'
      and extensions.digest(s.decrypted_secret, 'sha256') = extensions.digest(p_secret, 'sha256')
  )
$$;
revoke execute on function public.hosting_lifecycle_authorized(text)
  from public, anon, authenticated;
grant execute on function public.hosting_lifecycle_authorized(text) to service_role;

-- ---------------------------------------------------------------------
-- 3. Panggilan terjadwal membawa rahasia (menggantikan versi 0050)
-- ---------------------------------------------------------------------
create or replace function app.request_trial_lifecycle() returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  if not app.hosting_mode() then
    return;
  end if;
  select value into v_url from app.server_settings where key = 'functions_url';
  if v_url is null then
    return;
  end if;
  select decrypted_secret into v_secret
  from vault.decrypted_secrets where name = 'trial_lifecycle_secret';
  if v_secret is null then
    -- Tanpa rahasia panggilan pasti ditolak; peringatan ini tampil di cron.job_run_details.
    raise warning 'Rahasia Vault trial_lifecycle_secret tidak ada: siklus hidup trial dilewati.';
    return;
  end if;
  perform net.http_post(
    url := rtrim(v_url, '/') || '/trial-lifecycle',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-trial-lifecycle-secret', v_secret
    ),
    timeout_milliseconds := 60000
  );
end
$$;
revoke execute on function app.request_trial_lifecycle() from public, anon, authenticated;
