-- =====================================================================
-- 0060_admin_mfa_audit.sql — lanjutan 2FA Admin (T-592a)
-- 1. Pengguna mengaktifkan dan mematikan aplikasi autentikator lewat Auth (GoTrue), bukan lewat
--    fungsi SQL kita. Trigger di `auth.mfa_factors` mencatatnya di audit, dan menghapus kode
--    cadangan begitu tidak ada lagi faktor TOTP terverifikasi: kode cadangan untuk aplikasi lama
--    tidak boleh tetap berlaku setelah 2FA dimatikan.
-- 2. `user_mfa_list()`: Super Admin melihat siapa yang sudah memakai 2FA (halaman Pengguna).
-- =====================================================================

create function app.on_mfa_factor_change() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  -- `session_user` tidak ikut berubah oleh security definer: hanya koneksi Auth sendiri yang
  -- dicatat di sini. Hapus lewat `mfa_recover` dan `user_mfa_reset` (0059) sudah mencatat
  -- peristiwanya sendiri dengan pelaku yang benar.
  v_by_auth boolean := session_user = 'supabase_auth_admin';
begin
  if tg_op = 'UPDATE' then
    if new.factor_type = 'totp' and new.status = 'verified'
       and old.status is distinct from 'verified' and v_by_auth then
      insert into public.audit_events (user_id, action, entity, entity_id)
      values (v_user, 'mfa_enabled', 'user', v_user);
    end if;
    return new;
  end if;

  if old.factor_type = 'totp' and old.status = 'verified' and not app.has_verified_totp(v_user) then
    delete from app.mfa_recovery_codes c where c.user_id = v_user;
    if v_by_auth then
      insert into public.audit_events (user_id, action, entity, entity_id)
      values (v_user, 'mfa_disabled', 'user', v_user);
    end if;
  end if;
  return old;
end
$$;

create trigger mfa_factors_audit
  after update of status or delete on auth.mfa_factors
  for each row execute function app.on_mfa_factor_change();

create function public.user_mfa_list() returns table (user_id uuid)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not app.is_super_admin() then
    raise exception 'Hanya Super Admin yang bisa melihat status verifikasi dua langkah pengguna.'
      using errcode = '42501';
  end if;
  return query
    select distinct f.user_id from auth.mfa_factors f
    where f.factor_type = 'totp' and f.status = 'verified';
end
$$;
revoke execute on function public.user_mfa_list() from public, anon;
grant execute on function public.user_mfa_list() to authenticated;
