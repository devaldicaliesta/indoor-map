-- =====================================================================
-- 0002_login_lockout.sql — penguncian login dan catatan login (T-008)
-- NFR-SEC-02: akun terkunci 15 menit setelah 5 kali gagal login beruntun.
-- Dipanggil GoTrue lewat Auth Hook "password verification attempt" setiap kali
-- password diperiksa, sehingga penghitung hanya berubah di server.
-- =====================================================================

create or replace function app.hook_password_verification_attempt(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_max_failures constant integer := 5;
  c_lock_duration constant interval := interval '15 minutes';
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
      'message', 'Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.',
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
    -- GoTrue tetap menolak password yang salah dengan pesan umum.
    return jsonb_build_object('decision', 'continue');
  end if;

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

-- Hanya GoTrue yang boleh memanggil hook; klien tidak boleh mengubah penghitung.
revoke execute on function app.hook_password_verification_attempt(jsonb) from public, anon, authenticated;
grant usage on schema app to supabase_auth_admin;
grant execute on function app.hook_password_verification_attempt(jsonb) to supabase_auth_admin;
