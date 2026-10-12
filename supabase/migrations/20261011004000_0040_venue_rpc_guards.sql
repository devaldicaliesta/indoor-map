-- T-611c: jaga fungsi RPC `security definer` ber-venue (NFR-HT-02, jalur RPC).
--
-- Fungsi `security definer` berjalan sebagai pemilik dan MELEWATI RLS, sehingga peran global
-- saja (mis. trial admin) bisa memanggilnya untuk venue lain. Tiap fungsi diberi guard
-- `app.can_access_*`. Fungsi `security invoker` (save_location, apply_template, import_locations,
-- set_search_aliases, remove_field_definition, save_connector, delete_connector) tidak diubah:
-- RLS tabel ber-venue (migrasi 0039) sudah menolak lintas-venue di dalamnya.
--
-- `release_edit_lock` tidak diberi guard karena hanya menghapus kunci milik pemanggil sendiri.

-- ---------------------------------------------------------------------
-- publish_begin: hanya untuk venue yang boleh diakses pemanggil
-- ---------------------------------------------------------------------
create or replace function public.publish_begin(
  p_venue_id uuid,
  p_notes text default null,
  p_source_version integer default null
)
returns table (publication_id uuid, version integer, published_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_active integer;
  v_notes text := nullif(btrim(p_notes), '');
  v_row public.publications;
begin
  if not app.can_manage() then
    raise exception 'Hanya Admin dan Super Admin yang bisa menerbitkan peta.' using errcode = '42501';
  end if;
  if not app.can_access_venue(p_venue_id) then
    raise exception 'Akses ke venue ini ditolak.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.venues v where v.id = p_venue_id) then
    raise exception 'Venue tidak ditemukan.' using errcode = 'P0002';
  end if;
  if char_length(v_notes) > 500 then
    raise exception 'Catatan rilis paling banyak 500 karakter.' using errcode = '22023';
  end if;

  -- Pesanan diproses berurutan per venue agar nomor versi tidak bentrok.
  perform pg_advisory_xact_lock(hashtextextended('publish:' || p_venue_id::text, 0));

  select coalesce(max(p.version), 0) into v_active
  from public.publications p
  where p.venue_id = p_venue_id and p.is_active;

  -- Sumber rollback harus versi yang pernah terbit (bukan pesanan yang belum selesai) dan
  -- bukan versi yang sedang aktif.
  if p_source_version is not null and not exists (
    select 1 from public.publications p
    where p.venue_id = p_venue_id and p.version = p_source_version and p.version < v_active
  ) then
    raise exception 'Versi % tidak bisa diaktifkan kembali.', p_source_version using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.publications p
    where p.venue_id = p_venue_id
      and not p.is_active
      and p.version > v_active
      and p.published_at > now() - interval '5 minutes'
  ) then
    raise exception 'Publish lain untuk venue ini sedang berjalan. Coba lagi sebentar lagi.'
      using errcode = 'IM409';
  end if;

  insert into public.publications (
    venue_id, version, snapshot_path, published_by, notes, origin, source_version
  )
  select
    p_venue_id,
    n,
    format('%s/v%s.json', p_venue_id, n),
    app.current_user_id(),
    v_notes,
    case when p_source_version is null then 'publish' else 'rollback' end::public.publication_origin,
    p_source_version
  from (
    select coalesce(max(p.version), 0) + 1 as n
    from public.publications p
    where p.venue_id = p_venue_id
  ) next_version
  returning * into v_row;

  return query select v_row.id, v_row.version, v_row.published_at;
end
$$;

-- ---------------------------------------------------------------------
-- publish_commit: venue diambil dari pesanan publish
-- ---------------------------------------------------------------------
create or replace function public.publish_commit(p_publication_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pub public.publications;
begin
  if not app.can_manage() then
    raise exception 'Hanya Admin dan Super Admin yang bisa menerbitkan peta.' using errcode = '42501';
  end if;

  select * into v_pub from public.publications p where p.id = p_publication_id and not p.is_active;
  if not found then
    raise exception 'Pesanan publish tidak ditemukan atau sudah aktif.' using errcode = 'P0002';
  end if;
  if not app.can_access_venue(v_pub.venue_id) then
    raise exception 'Akses ke venue ini ditolak.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('publish:' || v_pub.venue_id::text, 0));

  if exists (
    select 1 from public.publications p
    where p.venue_id = v_pub.venue_id and p.is_active and p.version > v_pub.version
  ) then
    raise exception 'Versi yang lebih baru sudah terbit.' using errcode = 'IM409';
  end if;

  update public.publications p set is_active = false where p.venue_id = v_pub.venue_id and p.is_active;
  update public.publications p set is_active = true where p.id = v_pub.id;

  perform app.log_event(
    v_pub.origin::text,
    'venue',
    v_pub.venue_id,
    jsonb_strip_nulls(jsonb_build_object(
      'version', v_pub.version,
      'source_version', v_pub.source_version,
      'venue', (select v.name from public.venues v where v.id = v_pub.venue_id)
    ))
  );
end
$$;

-- ---------------------------------------------------------------------
-- publish_abort: venue diambil dari pesanan publish
-- ---------------------------------------------------------------------
create or replace function public.publish_abort(p_publication_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not app.can_manage() then
    raise exception 'Hanya Admin dan Super Admin yang bisa menerbitkan peta.' using errcode = '42501';
  end if;
  if not app.can_access_venue(
    (select p.venue_id from public.publications p where p.id = p_publication_id)
  ) then
    raise exception 'Akses ke venue ini ditolak.' using errcode = '42501';
  end if;

  delete from public.publications p
  where p.id = p_publication_id
    and not p.is_active
    and p.version > coalesce(
      (select max(a.version) from public.publications a where a.venue_id = p.venue_id and a.is_active),
      0
    );
end
$$;

-- ---------------------------------------------------------------------
-- acquire_edit_lock: hanya lantai di venue yang boleh diakses pemanggil
-- (definer bypass RLS edit_locks dari 0039)
-- ---------------------------------------------------------------------
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
  if not app.can_access_floor(p_floor_id) then
    raise exception 'Akses ke venue ini ditolak.' using errcode = '42501';
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

-- ---------------------------------------------------------------------
-- take_over_edit_lock: pertahankan syarat Super Admin + tambah cek venue (defense-in-depth)
-- ---------------------------------------------------------------------
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
  if not app.can_access_floor(p_floor_id) then
    raise exception 'Akses ke venue ini ditolak.' using errcode = '42501';
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
