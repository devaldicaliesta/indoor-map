-- =====================================================================
-- 0055_license_install_actor.sql — pelaku audit aktivasi lisensi (T-514)
-- license_install dipanggil Edge Function `license-activate` dengan service role, sehingga
-- app.current_user_id() kosong dan log mencatat "Sistem". Edge Function kini meneruskan Super
-- Admin yang memasang lisensi; instalasi baru (belum ada Super Admin) tetap tanpa pelaku.
-- =====================================================================

drop function public.license_install(text, jsonb, text, public.license_source);

create function public.license_install(
  p_license_id text,
  p_payload jsonb,
  p_signature text,
  p_source public.license_source,
  p_actor_id uuid default null
) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  -- Pelaku hanya dipercaya bila memang Super Admin aktif: log audit tidak boleh menyebut orang lain.
  if p_actor_id is not null and not exists (
    select 1 from public.profiles p
    where p.user_id = p_actor_id and p.role = 'super_admin' and p.is_active
  ) then
    raise exception 'Pelaku aktivasi bukan Super Admin aktif.' using errcode = 'IM403';
  end if;
  if exists (
    select 1 from public.licenses l
    where l.license_id = p_license_id
      and l.status = 'revoked'
      and (l.payload->>'issuedAt')::timestamptz >= (p_payload->>'issuedAt')::timestamptz
  ) then
    raise exception 'Lisensi ini sudah dicabut vendor. Minta berkas lisensi baru dari vendor.'
      using errcode = 'IM409';
  end if;
  update public.licenses set is_current = false where is_current;
  insert into public.licenses (license_id, payload, signature, status, source)
  values (p_license_id, p_payload, p_signature, 'active', p_source);
  insert into public.audit_events (user_id, action, entity, entity_id, details)
  values (
    coalesce(p_actor_id, app.current_user_id()),
    'license_changed',
    'license',
    null,
    jsonb_build_object('license_id', p_license_id, 'source', p_source)
  );
end
$$;

revoke execute on function public.license_install(text, jsonb, text, public.license_source, uuid)
  from public, anon, authenticated;
grant execute on function public.license_install(text, jsonb, text, public.license_source, uuid)
  to service_role;
