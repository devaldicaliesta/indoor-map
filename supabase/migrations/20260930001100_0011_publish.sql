-- =====================================================================
-- 0011_publish.sql — publish minimal (T-117)
-- Edge Function `publish` memesan nomor versi, mengunggah snapshot ke Storage, lalu
-- mengaktifkan versi itu. Ketiga fungsi dipanggil dengan JWT pemanggil, jadi izin
-- Admin/Super Admin ditegakkan di database; baris `publications` tetap tidak bisa
-- ditulis langsung oleh klien karena tidak ada policy insert/update.
-- Satu venue hanya punya satu publish yang berjalan: pesanan yang belum aktif dan berumur
-- kurang dari 5 menit menolak pesanan baru (klik ganda, dua Admin bersamaan). Pesanan dari
-- proses yang mati di tengah jalan tertinggal tidak aktif; riwayat versi (T-310) menanganinya.
-- Snapshot tetap hanya ditulis service role, tetapi Admin boleh mendaftar dan menghapusnya
-- agar snapshot publik ikut hilang saat venue dihapus.
-- =====================================================================

create or replace function public.publish_begin(p_venue_id uuid)
returns table (publication_id uuid, version integer, published_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_active integer;
  v_row public.publications;
begin
  if not app.can_manage() then
    raise exception 'Hanya Admin dan Super Admin yang bisa menerbitkan peta.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.venues v where v.id = p_venue_id) then
    raise exception 'Venue tidak ditemukan.' using errcode = 'P0002';
  end if;

  -- Pesanan diproses berurutan per venue agar nomor versi tidak bentrok.
  perform pg_advisory_xact_lock(hashtextextended('publish:' || p_venue_id::text, 0));

  select coalesce(max(p.version), 0) into v_active
  from public.publications p
  where p.venue_id = p_venue_id and p.is_active;

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

  insert into public.publications (venue_id, version, snapshot_path, published_by)
  select p_venue_id, n, format('%s/v%s.json', p_venue_id, n), app.current_user_id()
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
    'publish',
    'venue',
    v_pub.venue_id,
    jsonb_build_object(
      'version', v_pub.version,
      'venue', (select v.name from public.venues v where v.id = v_pub.venue_id)
    )
  );
end
$$;

-- Hanya pesanan yang belum pernah aktif (lebih baru dari versi aktif) yang bisa dibatalkan.
create or replace function public.publish_abort(p_publication_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not app.can_manage() then
    raise exception 'Hanya Admin dan Super Admin yang bisa menerbitkan peta.' using errcode = '42501';
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

revoke execute on function public.publish_begin(uuid) from public, anon;
revoke execute on function public.publish_commit(uuid) from public, anon;
revoke execute on function public.publish_abort(uuid) from public, anon;
grant execute on function public.publish_begin(uuid) to authenticated;
grant execute on function public.publish_commit(uuid) to authenticated;
grant execute on function public.publish_abort(uuid) to authenticated;

create policy snapshots_list on storage.objects for select to authenticated
  using (bucket_id = 'snapshots' and app.can_manage());
create policy snapshots_delete on storage.objects for delete to authenticated
  using (bucket_id = 'snapshots' and app.can_manage());
