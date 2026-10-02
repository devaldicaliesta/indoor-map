-- =====================================================================
-- 0014_edit_locks.sql — kunci edit per lantai (T-301, FR-AUTH-05)
-- 1. Kunci diambil, diperpanjang (heartbeat), dilepas, dan diambil alih lewat
--    fungsi atomik; kunci dianggap lepas setelah 30 menit tanpa aktivitas.
-- 2. Penegakan di server: fitur dan graf lantai yang dikunci orang lain tidak
--    bisa diubah (RLS), bukan hanya disembunyikan di UI.
-- 3. Ambil alih oleh Super Admin dicatat (edit_lock_taken_over).
-- =====================================================================

create or replace function app.edit_lock_ttl() returns interval
language sql immutable
as $$ select interval '30 minutes' $$;

/** Lantai boleh ditulis pengguna ini: tidak ada kunci aktif milik orang lain. */
create or replace function app.floor_writable(p_floor_id uuid) returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.edit_locks l
    where l.floor_id = p_floor_id
      and l.user_id <> app.current_user_id()
      and l.last_activity_at > now() - app.edit_lock_ttl()
  )
$$;

-- Fitur dan graf: aturan Editor (0001) ditambah syarat lantai tidak dikunci orang lain.
do $$
declare
  t text;
begin
  foreach t in array array['features', 'nav_nodes', 'nav_edges'] loop
    execute format('drop policy %I on public.%I', t || '_insert', t);
    execute format('drop policy %I on public.%I', t || '_update', t);
    execute format('drop policy %I on public.%I', t || '_delete', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (app.can_edit() and app.floor_writable(floor_id))',
      t || '_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (app.can_edit() and app.floor_writable(floor_id)) with check (app.can_edit() and app.floor_writable(floor_id))',
      t || '_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (app.can_edit() and app.floor_writable(floor_id))',
      t || '_delete', t);
  end loop;
end
$$;

/**
 * Ambil atau perpanjang kunci lantai. Mengembalikan pemegang kunci yang berlaku setelah
 * panggilan: pengguna ini (berhasil) atau orang lain (mode baca), beserta nama dan waktunya.
 */
create or replace function public.acquire_edit_lock(p_floor_id uuid)
returns table (user_id uuid, full_name text, started_at timestamptz, last_activity_at timestamptz)
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := app.current_user_id();
begin
  if not app.can_edit() then
    raise exception 'Hanya Editor, Admin, dan Super Admin yang bisa mengunci lantai.' using errcode = '42501';
  end if;
  -- Baris dikunci agar dua pengguna yang membuka lantai bersamaan tidak sama-sama menang.
  perform 1 from public.edit_locks l where l.floor_id = p_floor_id for update;
  insert into public.edit_locks as l (floor_id, user_id, started_at, last_activity_at)
  values (p_floor_id, v_me, now(), now())
  on conflict (floor_id) do update
    set user_id = excluded.user_id,
        started_at = case when l.user_id = excluded.user_id then l.started_at else now() end,
        last_activity_at = now()
    where l.user_id = excluded.user_id
       or l.last_activity_at <= now() - app.edit_lock_ttl();
  return query
    select l.user_id, p.full_name, l.started_at, l.last_activity_at
    from public.edit_locks l join public.profiles p on p.user_id = l.user_id
    where l.floor_id = p_floor_id;
end
$$;

/** Lepas kunci milik sendiri (keluar editor, tutup tab). Tidak berbuat apa-apa bila bukan pemegang. */
create or replace function public.release_edit_lock(p_floor_id uuid) returns void
language sql security definer
set search_path = public, pg_temp
as $$
  delete from public.edit_locks where floor_id = p_floor_id and user_id = app.current_user_id()
$$;

/** Super Admin membuka paksa kunci orang lain lalu memegangnya; dicatat di audit. */
create or replace function public.take_over_edit_lock(p_floor_id uuid) returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_previous uuid;
begin
  if not app.is_super_admin() then
    raise exception 'Hanya Super Admin yang bisa mengambil alih kunci.' using errcode = '42501';
  end if;
  select l.user_id into v_previous from public.edit_locks l where l.floor_id = p_floor_id for update;
  insert into public.edit_locks (floor_id, user_id, started_at, last_activity_at)
  values (p_floor_id, app.current_user_id(), now(), now())
  on conflict (floor_id) do update
    set user_id = excluded.user_id, started_at = now(), last_activity_at = now();
  if v_previous is not null and v_previous <> app.current_user_id() then
    insert into public.audit_events (user_id, action, entity, entity_id, details)
    values (app.current_user_id(), 'edit_lock_taken_over', 'floor', p_floor_id,
            jsonb_build_object('previous_user_id', v_previous));
  end if;
end
$$;

revoke execute on function public.acquire_edit_lock(uuid) from public, anon;
revoke execute on function public.release_edit_lock(uuid) from public, anon;
revoke execute on function public.take_over_edit_lock(uuid) from public, anon;
grant execute on function public.acquire_edit_lock(uuid) to authenticated;
grant execute on function public.release_edit_lock(uuid) to authenticated;
grant execute on function public.take_over_edit_lock(uuid) to authenticated;
