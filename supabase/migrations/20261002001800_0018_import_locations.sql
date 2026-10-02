-- =====================================================================
-- 0018_import_locations.sql — import lokasi dari CSV/XLSX (T-305, FR-LOC-08)
-- Berkas diparse dan divalidasi di browser; fungsi ini menulis satu batch (≤ 200
-- baris) dalam satu transaksi. Baris yang memperbarui hanya mengubah kolom yang
-- diisi (null = dipertahankan), jadi logo, foto, dan jam operasional tidak tersentuh.
-- Aturan unit (satu lokasi aktif per unit) tetap dijaga trigger 0001.
-- =====================================================================

create or replace function public.import_locations(
  p_venue_id uuid,
  p_location_type_id uuid,
  p_rows jsonb
) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row jsonb;
  v_id uuid;
  v_count integer := 0;
  v_units uuid[];
  v_categories uuid[];
begin
  if not app.can_edit() then
    raise exception 'Hanya Editor, Admin, dan Super Admin yang bisa mengimpor lokasi.'
      using errcode = '42501';
  end if;
  if jsonb_array_length(p_rows) > 200 then
    raise exception 'Satu batch maksimal 200 baris.' using errcode = 'IM422';
  end if;
  if not exists (
    select 1 from public.location_types where id = p_location_type_id and venue_id = p_venue_id
  ) then
    raise exception 'Tipe lokasi tidak ditemukan di venue ini.' using errcode = 'IM422';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    v_id := (v_row ->> 'id')::uuid;
    if v_id is null then
      insert into public.locations (
        venue_id, location_type_id, code, name, description, status, opening_date, custom_fields
      ) values (
        p_venue_id, p_location_type_id, upper(nullif(trim(v_row ->> 'code'), '')),
        trim(v_row ->> 'name'), nullif(trim(v_row ->> 'description'), ''),
        coalesce((v_row ->> 'status')::public.location_status, 'active'),
        (v_row ->> 'openingDate')::date, coalesce(v_row -> 'customFields', '{}')
      )
      returning id into v_id;
    else
      update public.locations l
      set code = coalesce(upper(nullif(trim(v_row ->> 'code'), '')), l.code),
          name = trim(v_row ->> 'name'),
          description = case
            when v_row ->> 'description' is null then l.description
            else nullif(trim(v_row ->> 'description'), '') end,
          status = coalesce((v_row ->> 'status')::public.location_status, l.status),
          opening_date = case
            when coalesce((v_row ->> 'status')::public.location_status, l.status) = 'coming_soon'
              then coalesce((v_row ->> 'openingDate')::date, l.opening_date)
            else null end,
          custom_fields = l.custom_fields || coalesce(v_row -> 'customFields', '{}')
      where l.id = v_id and l.venue_id = p_venue_id and l.location_type_id = p_location_type_id;
      if not found then
        raise exception 'Lokasi % tidak ditemukan untuk diperbarui.', v_id using errcode = 'IM404';
      end if;
    end if;

    if jsonb_typeof(v_row -> 'categoryIds') = 'array' then
      select coalesce(array_agg(value::uuid), '{}') into v_categories
      from jsonb_array_elements_text(v_row -> 'categoryIds');
      delete from public.location_categories where location_id = v_id and category_id <> all(v_categories);
      insert into public.location_categories (location_id, category_id)
      select v_id, c from unnest(v_categories) as c
      where c in (select id from public.categories where location_type_id = p_location_type_id)
      on conflict do nothing;
    end if;

    if jsonb_typeof(v_row -> 'unitIds') = 'array' then
      select coalesce(array_agg(value::uuid), '{}') into v_units
      from jsonb_array_elements_text(v_row -> 'unitIds');
      delete from public.location_units where location_id = v_id and feature_id <> all(v_units);
      insert into public.location_units (location_id, feature_id, is_primary)
      select v_id, u, u = v_units[1] from unnest(v_units) as u
      where u in (select id from public.features where venue_id = p_venue_id and kind = 'unit')
      on conflict (location_id, feature_id) do update set is_primary = excluded.is_primary;
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end
$$;

revoke execute on function public.import_locations(uuid, uuid, jsonb) from public, anon;
grant execute on function public.import_locations(uuid, uuid, jsonb) to authenticated;
