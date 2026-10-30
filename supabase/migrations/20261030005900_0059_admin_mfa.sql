-- =====================================================================
-- 0059_admin_mfa.sql — verifikasi dua langkah (TOTP) untuk Admin (T-592a)
-- 1. `system_settings.mfa_required_roles`: Super Admin mewajibkan 2FA untuk role tertentu.
-- 2. Penegakan di satu titik: `app.user_role()` (dasar semua kebijakan RLS dan fungsi hak)
--    mengembalikan NULL bila sesi wajib 2FA tetapi belum `aal2`. Wajib = role diwajibkan, atau
--    pengguna sudah mengaktifkan 2FA sendiri. Profil sendiri tetap terbaca (kebijakan
--    `profiles_read` berdasarkan user_id), sehingga Admin bisa menampilkan layar kode.
-- 3. Kode cadangan sekali pakai (hash SHA-256) untuk pemilik yang kehilangan aplikasinya, dan
--    reset 2FA oleh Super Admin. Faktor TOTP dihapus langsung di `auth.mfa_factors` (pola yang
--    sama dengan penghapusan akun di 0057), dicatat di audit dalam transaksi yang sama.
-- =====================================================================

alter table public.system_settings
  add column mfa_required_roles public.app_role[] not null default '{}';
comment on column public.system_settings.mfa_required_roles is
  'Role yang wajib verifikasi dua langkah (TOTP) untuk memakai Admin.';

create function app.mfa_required_roles() returns public.app_role[]
language sql stable security definer
set search_path = ''
as $$ select coalesce((select s.mfa_required_roles from public.system_settings s where s.id), '{}') $$;

create function app.session_aal() returns text
language sql stable
as $$ select coalesce(auth.jwt() ->> 'aal', 'aal1') $$;

create function app.has_verified_totp(p_user_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.mfa_factors f
    where f.user_id = p_user_id and f.factor_type = 'totp' and f.status = 'verified'
  )
$$;

create function app.mfa_required(p_user_id uuid, p_role public.app_role) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select p_role = any (app.mfa_required_roles())
      or app.has_verified_totp(p_user_id)
$$;

create or replace function app.user_role() returns public.app_role
language sql stable security definer
set search_path = public, pg_temp
as $$
  select p.role from public.profiles p
  where p.user_id = app.current_user_id() and p.is_active
    and (app.session_aal() = 'aal2' or not app.mfa_required(p.user_id, p.role))
$$;

-- Keadaan 2FA pemanggil untuk layar masuk Admin dan pemeriksaan Edge Function.
create function public.mfa_status()
returns table (required boolean, role_required boolean, has_totp boolean, aal text, satisfied boolean)
language sql stable security definer
set search_path = ''
as $$
  select
    app.mfa_required(p.user_id, p.role),
    p.role = any (app.mfa_required_roles()),
    app.has_verified_totp(p.user_id),
    app.session_aal(),
    app.session_aal() = 'aal2' or not app.mfa_required(p.user_id, p.role)
  from public.profiles p
  where p.user_id = auth.uid()
$$;
revoke execute on function public.mfa_status() from public, anon;
grant execute on function public.mfa_status() to authenticated;

-- Super Admin tidak bisa mewajibkan 2FA untuk role-nya sendiri dari sesi tanpa 2FA: itu
-- mengunci dirinya sendiri sebelum sempat mendaftarkan aplikasi autentikator.
create function app.guard_mfa_required_roles() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  if new.mfa_required_roles is not distinct from old.mfa_required_roles then
    return new;
  end if;
  select p.role into v_role from public.profiles p where p.user_id = auth.uid();
  if v_role = any (new.mfa_required_roles) and app.session_aal() <> 'aal2' then
    raise exception 'Aktifkan verifikasi dua langkah untuk akun Anda (menu akun → Keamanan akun) sebelum mewajibkannya untuk role Anda sendiri.'
      using errcode = 'IM409';
  end if;
  return new;
end
$$;

create trigger system_settings_guard_mfa
  before update of mfa_required_roles on public.system_settings
  for each row execute function app.guard_mfa_required_roles();

-- ---------------------------------------------------------------------
-- Kode cadangan
-- ---------------------------------------------------------------------
create table app.mfa_recovery_codes (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  code_hash text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  primary key (user_id, code_hash)
);
revoke all on app.mfa_recovery_codes from public, anon, authenticated;

-- Huruf dan angka tanpa 0/O/1/I agar mudah dibaca dari kertas; 32 simbol × 10 = 50 bit.
create function app.normalize_recovery_code(p_code text) returns text
language sql immutable
as $$ select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')) $$;

-- 10 kode baru menggantikan semua kode lama; hanya dari sesi yang sudah lolos 2FA.
create function public.mfa_recovery_codes_generate() returns text[]
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_codes text[] := '{}';
  v_code text;
  v_bytes bytea;
begin
  if v_uid is null or not exists (
    select 1 from public.profiles p where p.user_id = v_uid and p.is_active
  ) then
    raise exception 'Masuk sebagai pengguna Admin aktif.' using errcode = '42501';
  end if;
  if app.session_aal() <> 'aal2' or not app.has_verified_totp(v_uid) then
    raise exception 'Masukkan kode dari aplikasi autentikator sebelum membuat kode cadangan.'
      using errcode = 'IM403';
  end if;
  delete from app.mfa_recovery_codes c where c.user_id = v_uid;
  for i in 1..10 loop
    v_bytes := extensions.gen_random_bytes(10);
    v_code := '';
    for j in 0..9 loop
      -- 256 habis dibagi 32, jadi setiap simbol sama peluangnya.
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, j) % 32) + 1, 1);
    end loop;
    insert into app.mfa_recovery_codes (user_id, code_hash)
    values (v_uid, encode(extensions.digest(v_code, 'sha256'), 'hex'));
    v_codes := v_codes || (substr(v_code, 1, 5) || '-' || substr(v_code, 6, 5));
  end loop;
  perform app.log_event('mfa_recovery_codes_created', 'user', v_uid, '{}');
  return v_codes;
end
$$;

-- Kode cadangan menghapus aplikasi autentikator pemilik (sesi tetap aal1); bila role-nya wajib
-- 2FA, Admin lalu meminta pendaftaran aplikasi baru. Mengembalikan false untuk kode salah
-- (bukan exception) agar percobaan gagal tetap tercatat untuk batas percobaan.
create function public.mfa_recover(p_code text) returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (
    select 1 from public.profiles p where p.user_id = v_uid and p.is_active
  ) then
    raise exception 'Masuk dengan email dan password dulu.' using errcode = '42501';
  end if;
  if (
    select count(*) from public.audit_events e
    where e.user_id = v_uid and e.action = 'mfa_recovery_failed'
      and e.occurred_at > now() - interval '15 minutes'
  ) >= 5 then
    raise exception 'Terlalu banyak percobaan kode cadangan. Tunggu 15 menit, lalu coba lagi.'
      using errcode = 'IM429';
  end if;

  update app.mfa_recovery_codes c set used_at = now()
  where c.user_id = v_uid and c.used_at is null
    and c.code_hash = encode(extensions.digest(app.normalize_recovery_code(p_code), 'sha256'), 'hex');
  if not found then
    perform app.log_event('mfa_recovery_failed', 'user', v_uid, '{}');
    return false;
  end if;

  delete from auth.mfa_factors f where f.user_id = v_uid;
  -- Kode lain tidak berlaku lagi: kode baru dibuat setelah aplikasi baru didaftarkan.
  delete from app.mfa_recovery_codes c where c.user_id = v_uid;
  perform app.log_event('mfa_recovery_used', 'user', v_uid, '{}');
  return true;
end
$$;

-- Sisa kode cadangan pemanggil yang belum dipakai, untuk halaman Keamanan akun.
create function public.mfa_recovery_codes_left() returns integer
language sql stable security definer
set search_path = ''
as $$
  select count(*)::integer from app.mfa_recovery_codes c
  where c.user_id = auth.uid() and c.used_at is null
$$;

-- Super Admin mereset 2FA pengguna lain (ponsel hilang tanpa kode cadangan). Sesi pengguna itu
-- dicabut agar masuk ulang dan, bila role-nya wajib 2FA, mendaftarkan aplikasi baru.
create function public.user_mfa_reset(p_user_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not app.is_super_admin() then
    raise exception 'Hanya Super Admin yang bisa mereset verifikasi dua langkah.' using errcode = '42501';
  end if;
  if p_user_id = app.current_user_id() then
    raise exception 'Kelola verifikasi dua langkah akun Anda sendiri di menu akun → Keamanan akun.'
      using errcode = 'IM409';
  end if;
  if not exists (select 1 from public.profiles p where p.user_id = p_user_id) then
    raise exception 'Pengguna tidak ditemukan atau sudah dihapus.' using errcode = 'IM404';
  end if;
  delete from auth.mfa_factors f where f.user_id = p_user_id;
  delete from app.mfa_recovery_codes c where c.user_id = p_user_id;
  delete from auth.sessions s where s.user_id = p_user_id;
  perform app.log_event('mfa_reset', 'user', p_user_id, '{}');
end
$$;

revoke execute on function public.mfa_recovery_codes_generate() from public, anon;
revoke execute on function public.mfa_recover(text) from public, anon;
revoke execute on function public.mfa_recovery_codes_left() from public, anon;
revoke execute on function public.user_mfa_reset(uuid) from public, anon;
grant execute on function public.mfa_recovery_codes_generate() to authenticated;
grant execute on function public.mfa_recover(text) to authenticated;
grant execute on function public.mfa_recovery_codes_left() to authenticated;
grant execute on function public.user_mfa_reset(uuid) to authenticated;
