-- =====================================================================
-- 0004_system_settings.sql — pengaturan sistem (T-010, FR-SYS-01)
-- 1. system_settings hanya dibaca Super Admin (berisi konfigurasi SMTP).
-- 2. Password SMTP disimpan di Supabase Vault, tidak pernah di tabel dan tidak
--    pernah dikembalikan ke klien. Fungsi di bawah adalah satu-satunya titik
--    yang terikat Vault; saat pindah dari Supabase cukup fungsi ini yang diganti.
-- 3. Perubahan pengaturan dicatat sebagai settings_changed (NFR-SEC-05).
-- =====================================================================

drop policy system_settings_read on public.system_settings;
create policy system_settings_read on public.system_settings
  for select to authenticated using (app.is_super_admin());

create or replace function public.smtp_password_is_set() returns boolean
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
begin
  if not app.is_super_admin() and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Hanya Super Admin yang bisa melihat pengaturan SMTP.' using errcode = '42501';
  end if;
  return exists (select 1 from vault.secrets where name = 'smtp_password');
end
$$;

create or replace function public.set_smtp_password(p_password text) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not app.is_super_admin() then
    raise exception 'Hanya Super Admin yang bisa mengubah password SMTP.' using errcode = '42501';
  end if;
  select id into v_id from vault.secrets where name = 'smtp_password';
  if coalesce(p_password, '') = '' then
    delete from vault.secrets where id = v_id;
  elsif v_id is null then
    perform vault.create_secret(p_password, 'smtp_password', 'Password SMTP untuk email sistem');
  else
    perform vault.update_secret(v_id, p_password);
  end if;
  perform app.log_event('settings_changed', 'system_settings', null, '{"fields": ["smtp_password"]}');
end
$$;

-- Hanya dipanggil Edge Function (service role) saat mengirim email.
create or replace function public.smtp_password_for_sending() returns text
language sql stable security definer
set search_path = public, pg_temp
as $$ select decrypted_secret from vault.decrypted_secrets where name = 'smtp_password' $$;

revoke execute on function public.smtp_password_is_set() from public, anon;
revoke execute on function public.set_smtp_password(text) from public, anon;
revoke execute on function public.smtp_password_for_sending() from public, anon, authenticated;
grant execute on function public.smtp_password_is_set() to authenticated, service_role;
grant execute on function public.set_smtp_password(text) to authenticated;
grant execute on function public.smtp_password_for_sending() to service_role;

create or replace function app.log_settings_changed() returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_fields text[];
begin
  select array_agg(key order by key) into v_fields
  from jsonb_each(to_jsonb(new)) n
  where key <> 'updated_at' and n.value is distinct from to_jsonb(old) -> key;
  if v_fields is not null then
    insert into public.audit_events (user_id, action, entity, details)
    values (app.current_user_id(), 'settings_changed', 'system_settings',
            jsonb_build_object('fields', v_fields));
  end if;
  return new;
end
$$;

create trigger system_settings_log_changes
  after update on public.system_settings
  for each row execute function app.log_settings_changed();
