-- T-503: tabel besar Admin (Lokasi, Penutupan, Riwayat publish) disaring dan dibagi halaman
-- di server. Pola sama dengan 0035: fungsi `search_*` security invoker sehingga RLS berlaku
-- untuk baris maupun total; halaman, urutan, dan relasi diatur PostgREST.

-- Nama lokasi diurutkan alami ("Kasir 2" sebelum "Kasir 10", tanpa beda huruf besar/kecil),
-- sama dengan urutan daftar Lokasi lama yang disusun di klien.
create collation if not exists public.natural (provider = icu, locale = 'und-u-kn-true');
alter table public.locations alter column name type text collate public.natural;

-- Lokasi per venue diurutkan menurut nama; halaman stabil dengan id.
create index if not exists locations_venue_name_idx on public.locations (venue_id, name, id);

-- Lokasi: kata kunci mencari nama, kode lokasi, dan kode unit.
-- Gedung `outdoor` = unit di lapisan Area Luar (lantai tanpa gedung).
create or replace function public.search_locations(
  p_venue_id uuid,
  p_query text default '',
  p_statuses public.location_status[] default null,
  p_category_id uuid default null,
  p_type_id uuid default null,
  p_building text default null,
  p_floor_id uuid default null,
  p_unlinked_only boolean default false
) returns setof public.locations
language sql stable security invoker
set search_path = public, pg_temp
as $$
  select l.*
  from public.locations l
  where l.venue_id = p_venue_id
    and (p_statuses is null or cardinality(p_statuses) = 0 or l.status = any (p_statuses))
    and (p_type_id is null or l.location_type_id = p_type_id)
    and (p_category_id is null or exists (
      select 1 from public.location_categories lc
      where lc.location_id = l.id and lc.category_id = p_category_id))
    and (not coalesce(p_unlinked_only, false) or not exists (
      select 1 from public.location_units lu where lu.location_id = l.id))
    and ((p_building is null and p_floor_id is null) or exists (
      select 1
      from public.location_units lu
      join public.features f on f.id = lu.feature_id
      join public.floors fl on fl.id = f.floor_id
      where lu.location_id = l.id
        and (p_floor_id is null or fl.id = p_floor_id)
        and (p_building is null
          or (p_building = 'outdoor' and fl.building_id is null)
          or fl.building_id::text = p_building)))
    and (
      app.search_text(p_query) = ''
      or app.search_text(concat_ws(' ', l.name, l.code, (
           select string_agg(f.unit_code, ' ')
           from public.location_units lu
           join public.features f on f.id = lu.feature_id
           where lu.location_id = l.id))) like app.contains_pattern(p_query)
    )
$$;

-- Penutupan: keadaan dihitung terhadap now() (aktif, terjadwal, selesai); rentang tanggal
-- memilih penutupan yang masa berlakunya beririsan dengan [dari, sampai] di zona waktu venue.
-- Kata kunci mencari alasan dan nama sasaran (fitur, kode unit, konektor, lantai, gedung).
create or replace function public.search_closures(
  p_venue_id uuid,
  p_query text default '',
  p_states text[] default null,
  p_from date default null,
  p_to date default null,
  p_time_zone text default 'Asia/Jakarta'
) returns setof public.closures
language sql stable security invoker
set search_path = public, pg_temp
as $$
  select c.*
  from public.closures c
  where c.venue_id = p_venue_id
    and (p_states is null or cardinality(p_states) = 0
      or ('active' = any (p_states) and c.starts_at <= now() and (c.ends_at is null or c.ends_at > now()))
      or ('scheduled' = any (p_states) and c.starts_at > now())
      or ('ended' = any (p_states) and c.ends_at is not null and c.ends_at <= now()))
    and (p_to is null or c.starts_at < app.day_start(p_to + 1, p_time_zone))
    and (p_from is null or c.ends_at is null or c.ends_at > app.day_start(p_from, p_time_zone))
    and (
      app.search_text(p_query) = ''
      or app.search_text(concat_ws(' ', c.reason,
           (select concat_ws(' ', f.name, f.unit_code, fl.name, b.name)
              from public.features f
              join public.floors fl on fl.id = f.floor_id
              left join public.buildings b on b.id = fl.building_id
              where f.id = c.feature_id),
           (select concat_ws(' ', fl.name, b.name)
              from public.nav_edges e
              join public.floors fl on fl.id = e.floor_id
              left join public.buildings b on b.id = fl.building_id
              where e.id = c.edge_id),
           (select k.name from public.connectors k where k.id = c.connector_id)
         )) like app.contains_pattern(p_query)
    )
$$;

-- Riwayat publish: hanya versi yang pernah terbit (aktif atau lebih lama dari versi aktif),
-- sama dengan publications.history(). Kata kunci mencari nomor versi, catatan, dan penerbit.
create or replace function public.search_publications(
  p_venue_id uuid,
  p_query text default '',
  p_from date default null,
  p_to date default null,
  p_time_zone text default 'Asia/Jakarta'
) returns setof public.publications
language sql stable security invoker
set search_path = public, pg_temp
as $$
  select p.*
  from public.publications p
  where p.venue_id = p_venue_id
    and (p.is_active or p.version < coalesce((
      select a.version from public.publications a
      where a.venue_id = p_venue_id and a.is_active), 0))
    and (p_from is null or p.published_at >= app.day_start(p_from, p_time_zone))
    and (p_to is null or p.published_at < app.day_start(p_to + 1, p_time_zone))
    and (
      app.search_text(p_query) = ''
      or app.search_text(concat_ws(' ', 'v' || p.version, p.notes,
           (select pr.full_name from public.profiles pr where pr.user_id = p.published_by)
         )) like app.contains_pattern(p_query)
    )
$$;

revoke execute on function public.search_locations(uuid, text, public.location_status[], uuid, uuid, text, uuid, boolean) from public, anon;
grant execute on function public.search_locations(uuid, text, public.location_status[], uuid, uuid, text, uuid, boolean) to authenticated;
revoke execute on function public.search_closures(uuid, text, text[], date, date, text) from public, anon;
grant execute on function public.search_closures(uuid, text, text[], date, date, text) to authenticated;
revoke execute on function public.search_publications(uuid, text, date, date, text) from public, anon;
grant execute on function public.search_publications(uuid, text, date, date, text) to authenticated;
