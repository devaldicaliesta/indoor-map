-- =====================================================================
-- 0003_user_admin_guards.sql — pengelolaan pengguna (T-009, T-012)
-- 1. Super Admin aktif terakhir tidak bisa diturunkan, dinonaktifkan, atau dihapus.
-- 2. Perubahan role dan penonaktifan dicatat di audit_events.
-- Kode SQLSTATE 'IM409' adalah konvensi proyek: pesan dari server ditampilkan apa adanya.
-- =====================================================================

create or replace function app.guard_last_super_admin() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.role = 'super_admin' and old.is_active
     and (tg_op = 'DELETE' or new.role <> 'super_admin' or not new.is_active)
     and not exists (
       select 1 from public.profiles
       where role = 'super_admin' and is_active and user_id <> old.user_id
     ) then
    raise exception 'Tidak bisa mengubah satu-satunya Super Admin aktif. Jadikan pengguna lain Super Admin terlebih dahulu.'
      using errcode = 'IM409';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end
$$;

create trigger profiles_guard_last_super_admin
  before update of role, is_active or delete on public.profiles
  for each row execute function app.guard_last_super_admin();

create or replace function app.log_profile_changes() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role then
    insert into public.audit_events (user_id, action, entity, entity_id, details)
    values (app.current_user_id(), 'role_changed', 'user', new.user_id,
            jsonb_build_object('from', old.role, 'to', new.role));
  end if;
  if old.is_active and not new.is_active then
    insert into public.audit_events (user_id, action, entity, entity_id)
    values (app.current_user_id(), 'user_deactivated', 'user', new.user_id);
  end if;
  return new;
end
$$;

create trigger profiles_log_changes
  after update of role, is_active on public.profiles
  for each row execute function app.log_profile_changes();
