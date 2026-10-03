-- =====================================================================
-- 0026_publish_history.sql — catatan rilis dan rollback (T-310)
-- `publish_begin` menerima catatan rilis dan, untuk rollback, versi sumber. Rollback
-- membuat versi baru berisi salinan snapshot lama (disalin Edge Function), sehingga
-- riwayat tetap urut dan draft tidak berubah. `publish_commit` mencatat peristiwa
-- `publish` atau `rollback` sesuai asal versi.
-- =====================================================================

drop function public.publish_begin(uuid);

create function public.publish_begin(
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

revoke execute on function public.publish_begin(uuid, text, integer) from public, anon;
grant execute on function public.publish_begin(uuid, text, integer) to authenticated;
