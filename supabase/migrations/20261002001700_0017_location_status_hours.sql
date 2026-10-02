-- =====================================================================
-- 0017_location_status_hours.sql — status lokasi dan jam operasional (T-304,
-- FR-LOC-05, FR-LOC-06). save_location ikut menyimpan status, tanggal segera buka,
-- dan jam operasional (mingguan dan tanggal khusus) dalam transaksi yang sama.
-- Lokasi nonaktif permanen tetap menyimpan tautan unitnya, tetapi tidak lagi
-- menempatinya (aturan integritas 4) dan tidak ikut snapshot.
-- =====================================================================

drop function public.save_location(
  uuid, uuid, uuid, text, uuid[], uuid[], text[], text, text, text, uuid, jsonb
);

create or replace function public.save_location(
  p_id uuid,
  p_venue_id uuid,
  p_location_type_id uuid,
  p_name text,
  p_category_ids uuid[],
  p_unit_ids uuid[],
  p_photo_paths text[],
  p_code text default null,
  p_description text default null,
  p_logo_path text default null,
  p_primary_unit_id uuid default null,
  p_custom_fields jsonb default '{}',
  p_status public.location_status default 'active',
  p_opening_date date default null,
  p_hours jsonb default '[]'
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code text := upper(nullif(trim(p_code), ''));
  v_name text := nullif(trim(p_name), '');
  v_units uuid[] := coalesce(p_unit_ids, '{}');
  v_categories uuid[] := coalesce(p_category_ids, '{}');
  v_photos text[] := coalesce(p_photo_paths, '{}');
  v_logo text := nullif(trim(p_logo_path), '');
  v_primary uuid := coalesce(p_primary_unit_id, p_unit_ids[1]);
  v_prefix text := 'locations/' || p_venue_id || '/';
  v_venue uuid;
  v_owner text;
begin
  if p_id is null then
    raise exception 'Id lokasi wajib diisi.' using errcode = 'IM422';
  end if;
  if v_name is null then
    raise exception 'Nama lokasi wajib diisi.' using errcode = 'IM422';
  end if;
  if p_status = 'coming_soon' and p_opening_date is null then
    raise exception 'Tanggal buka wajib diisi untuk status segera buka.' using errcode = 'IM422';
  end if;
  if jsonb_typeof(coalesce(p_hours, '[]')) <> 'array' then
    raise exception 'Jam operasional harus berupa daftar.' using errcode = 'IM422';
  end if;
  if jsonb_typeof(coalesce(p_custom_fields, '{}')) <> 'object' then
    raise exception 'Field kustom harus berupa objek.' using errcode = 'IM422';
  end if;

  select venue_id into v_venue from public.locations where id = p_id;
  if v_venue is not null and v_venue <> p_venue_id then
    raise exception 'Lokasi ini milik venue lain.' using errcode = 'IM422';
  end if;

  if not exists (
    select 1 from public.location_types where id = p_location_type_id and venue_id = p_venue_id
  ) then
    raise exception 'Tipe lokasi tidak ditemukan di venue ini.' using errcode = 'IM422';
  end if;

  if (v_logo is not null and left(v_logo, length(v_prefix)) <> v_prefix)
    or exists (select 1 from unnest(v_photos) as p where left(p, length(v_prefix)) <> v_prefix)
  then
    raise exception 'Logo dan foto lokasi harus diunggah ke folder lokasi venue ini.'
      using errcode = 'IM422';
  end if;

  if v_primary is not null and not (v_primary = any(v_units)) then
    raise exception 'Unit utama harus salah satu unit yang ditautkan.' using errcode = 'IM422';
  end if;

  if v_code is not null then
    select name into v_owner
    from public.locations
    where venue_id = p_venue_id and lower(code) = lower(v_code) and id <> p_id
    limit 1;
    if v_owner is not null then
      raise exception 'Kode lokasi % sudah dipakai lokasi "%".', v_code, v_owner
        using errcode = 'IM409';
    end if;
  end if;

  insert into public.locations (
    id, venue_id, code, location_type_id, name, description, logo_path, photo_paths,
    custom_fields, status, opening_date
  ) values (
    p_id, p_venue_id, v_code, p_location_type_id, v_name, nullif(trim(p_description), ''),
    v_logo, v_photos, coalesce(p_custom_fields, '{}'), p_status,
    case when p_status = 'coming_soon' then p_opening_date end
  )
  on conflict (id) do update
    set code = excluded.code,
        location_type_id = excluded.location_type_id,
        name = excluded.name,
        description = excluded.description,
        logo_path = excluded.logo_path,
        photo_paths = excluded.photo_paths,
        custom_fields = excluded.custom_fields,
        status = excluded.status,
        opening_date = excluded.opening_date;

  delete from public.location_categories
  where location_id = p_id and category_id <> all(v_categories);
  insert into public.location_categories (location_id, category_id)
  select distinct p_id, c from unnest(v_categories) as c
  on conflict do nothing;

  delete from public.location_units
  where location_id = p_id and feature_id <> all(v_units);
  insert into public.location_units (location_id, feature_id, is_primary)
  select p_id, u, u = v_primary from (select distinct unnest(v_units) as u) as units
  on conflict (location_id, feature_id) do update set is_primary = excluded.is_primary;

  delete from public.opening_hours where location_id = p_id;
  insert into public.opening_hours (location_id, weekday, special_date, opens_at, closes_at, is_closed)
  select p_id, (h ->> 'weekday')::smallint, (h ->> 'special_date')::date,
    (h ->> 'opens_at')::time, (h ->> 'closes_at')::time, coalesce((h ->> 'is_closed')::boolean, false)
  from jsonb_array_elements(coalesce(p_hours, '[]')) as h;

  return p_id;
end
$$;

revoke execute on function public.save_location(
  uuid, uuid, uuid, text, uuid[], uuid[], text[], text, text, text, uuid, jsonb,
  public.location_status, date, jsonb
) from public, anon;
grant execute on function public.save_location(
  uuid, uuid, uuid, text, uuid[], uuid[], text[], text, text, text, uuid, jsonb,
  public.location_status, date, jsonb
) to authenticated;

-- Unit lokasi yang ditutup permanen menjadi kosong. Ini akibat status lokasi, bukan suntingan
-- peta, jadi tidak boleh gagal hanya karena lantainya sedang dikunci penyunting lain (0014).
alter function app.release_units_on_permanent_close() security definer;
alter function app.release_units_on_permanent_close() set search_path = public, pg_temp;
