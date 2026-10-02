-- =====================================================================
-- 0021_lockout_generic_notice.sql — penguncian tanpa membocorkan akun (T-008, keputusan T-307a)
-- Saat terkunci, login ditolak dengan pesan yang sama persis dengan email tidak terdaftar,
-- sehingga daftar email Admin tidak bisa ditebak. Pemilik akun diberi tahu lewat email:
-- hook mencatat pemberitahuan lalu pg_net memanggil Edge Function account-notice.
-- =====================================================================

create extension if not exists pg_net with schema extensions;

-- Konfigurasi server yang hanya dibaca fungsi internal (tidak diekspos PostgREST).
create table app.server_settings (
  key text primary key,
  value text not null
);
revoke all on app.server_settings from public, anon, authenticated;
comment on table app.server_settings is
  'functions_url: alamat Edge Function yang bisa dijangkau dari database, mis. http://kong:8000/functions/v1. Diisi installer.';

-- Antrean pemberitahuan akun. Hanya service role (Edge Function) yang membaca dan menandai terkirim.
create table public.account_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  kind text not null check (kind in ('account_locked')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.account_notices enable row level security;
revoke all on public.account_notices from anon, authenticated;

create or replace function app.request_account_notice(p_user_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_url text;
begin
  -- Paling banyak satu email per jam per akun: penyerang bisa mengunci ulang tiap 15 menit.
  if exists (
    select 1 from public.account_notices
    where user_id = p_user_id and kind = p_kind and created_at > now() - interval '1 hour'
  ) then
    return;
  end if;
  insert into public.account_notices (user_id, kind) values (p_user_id, p_kind) returning id into v_id;
  select value into v_url from app.server_settings where key = 'functions_url';
  -- Tanpa alamat fungsi, pemberitahuan tetap tercatat dan bisa dikirim ulang nanti.
  if v_url is null then
    return;
  end if;
  -- pg_net mengirim setelah transaksi selesai; kegagalan kirim tidak menggagalkan login.
  perform net.http_post(
    url := rtrim(v_url, '/') || '/account-notice',
    body := jsonb_build_object('id', v_id),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
end
$$;
revoke execute on function app.request_account_notice(uuid, text) from public, anon, authenticated;

create or replace function app.hook_password_verification_attempt(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_max_failures constant integer := 5;
  c_lock_duration constant interval := interval '15 minutes';
  -- Pesan bawaan GoTrue untuk email/password salah; dipakai juga saat terkunci.
  c_invalid_credentials constant text := 'Invalid login credentials';
  v_user_id uuid := (event ->> 'user_id')::uuid;
  v_valid boolean := coalesce((event ->> 'valid')::boolean, false);
  v_profile public.profiles;
  v_failures integer;
begin
  select * into v_profile from public.profiles where user_id = v_user_id for update;

  -- Akun tanpa profil tidak diatur di sini; Admin menolaknya setelah login.
  if not found then
    return jsonb_build_object('decision', 'continue');
  end if;

  if v_profile.locked_until is not null and v_profile.locked_until > now() then
    insert into public.audit_events (user_id, action, entity, entity_id, details)
    values (v_user_id, 'login_failed', 'user', v_user_id, jsonb_build_object('reason', 'locked'));
    return jsonb_build_object(
      'decision', 'reject',
      'message', c_invalid_credentials,
      'should_logout_user', true
    );
  end if;

  -- Kunci yang sudah lewat masanya memulai hitungan baru.
  v_failures := case when v_profile.locked_until is null then v_profile.failed_login_count else 0 end;

  if not v_valid then
    v_failures := v_failures + 1;
    update public.profiles
    set failed_login_count = v_failures,
        locked_until = case when v_failures >= c_max_failures then now() + c_lock_duration end
    where user_id = v_user_id;
    insert into public.audit_events (user_id, action, entity, entity_id, details)
    values (v_user_id, 'login_failed', 'user', v_user_id,
            jsonb_build_object('reason', 'invalid_password', 'failures', v_failures));
    if v_failures = c_max_failures then
      perform app.request_account_notice(v_user_id, 'account_locked');
    end if;
    -- GoTrue tetap menolak password yang salah dengan pesan umum.
    return jsonb_build_object('decision', 'continue');
  end if;

  -- Hanya terlihat oleh pemegang password yang benar, jadi tidak membocorkan akun.
  if not v_profile.is_active then
    insert into public.audit_events (user_id, action, entity, entity_id, details)
    values (v_user_id, 'login_failed', 'user', v_user_id, jsonb_build_object('reason', 'inactive'));
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'Akun Anda dinonaktifkan. Hubungi Super Admin.',
      'should_logout_user', true
    );
  end if;

  update public.profiles set failed_login_count = 0, locked_until = null where user_id = v_user_id;
  insert into public.audit_events (user_id, action, entity, entity_id)
  values (v_user_id, 'login', 'user', v_user_id);
  return jsonb_build_object('decision', 'continue');
end
$$;

revoke execute on function app.hook_password_verification_attempt(jsonb) from public, anon, authenticated;
grant execute on function app.hook_password_verification_attempt(jsonb) to supabase_auth_admin;
