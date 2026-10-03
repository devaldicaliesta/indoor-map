-- =====================================================================
-- 0030_license_quota.sql — kuota paket ditegakkan di server (T-404)
-- Menambah venue, gedung, lantai (Area Luar tidak dihitung), atau Info Point melebihi kuota
-- lisensi berlaku ditolak trigger, apa pun jalurnya (Admin, API langsung, template venue).
-- Tanpa lisensi berlaku penulisan sudah ditolak RLS (0027), jadi trigger tidak menambah aturan.
-- =====================================================================

-- Jenis kuota memakai nama kunci di berkas lisensi (`quota.venues`, …, `quota.infoPoints`).
create function app.quota_used(p_kind text) returns integer
language sql stable security definer
set search_path = ''
as $$
  select case p_kind
    when 'venues' then (select count(*) from public.venues)
    when 'buildings' then (select count(*) from public.buildings)
    when 'floors' then (select count(*) from public.floors where not is_outdoor)
    when 'infoPoints' then (select count(*) from public.info_points)
  end::integer
$$;
revoke execute on function app.quota_used(text) from public;

create function app.quota_limit(p_kind text) returns integer
language sql stable security definer
set search_path = ''
as $$
  select (l.payload->'quota'->>p_kind)::integer from public.licenses l where l.is_current
$$;
revoke execute on function app.quota_limit(text) from public;

create function app.enforce_quota() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_kind text := tg_argv[0];
  v_limit integer;
  v_used integer;
begin
  -- Bersarang: kolom is_outdoor hanya ada di floors.
  if v_kind = 'floors' then
    if new.is_outdoor then
      return new;
    end if;
  end if;
  v_limit := app.quota_limit(v_kind);
  if v_limit is null then
    return new;
  end if;
  -- Dua penambahan bersamaan tidak boleh sama-sama lolos di batas kuota.
  perform pg_advisory_xact_lock(hashtext('quota:' || v_kind));
  v_used := app.quota_used(v_kind);
  if v_used >= v_limit then
    raise exception 'Kuota paket tercapai: % %/%. Hapus yang tidak dipakai atau tingkatkan paket.',
      case v_kind
        when 'venues' then 'venue'
        when 'buildings' then 'gedung'
        when 'floors' then 'lantai'
        else 'Info Point'
      end,
      v_used, v_limit
      using errcode = 'IM422';
  end if;
  return new;
end
$$;
revoke execute on function app.enforce_quota() from public;

create trigger venues_quota before insert on public.venues
  for each row execute function app.enforce_quota('venues');
create trigger buildings_quota before insert on public.buildings
  for each row execute function app.enforce_quota('buildings');
create trigger floors_quota before insert on public.floors
  for each row execute function app.enforce_quota('floors');
create trigger info_points_quota before insert on public.info_points
  for each row execute function app.enforce_quota('infoPoints');

-- Pemakaian per jenis untuk halaman Lisensi dan tombol tambah di Admin (semua role aktif).
create function public.license_usage()
returns table (kind text, used integer, quota integer)
language sql stable security definer
set search_path = ''
as $$
  select k, app.quota_used(k), app.quota_limit(k)
  from unnest(array['venues', 'buildings', 'floors', 'infoPoints']) k
  where app.can_read()
$$;
revoke execute on function public.license_usage() from public, anon;
grant execute on function public.license_usage() to authenticated;
