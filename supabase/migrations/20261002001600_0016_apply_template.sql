-- =====================================================================
-- 0016_apply_template.sql — template industri untuk venue baru (T-302, FR-VEN-02)
-- Isi template ada di kode (packages/domain/src/templates) dan dikirim sebagai jsonb;
-- fungsi ini menyalinnya ke venue dalam satu transaksi. Template tidak disimpan di
-- database, jadi perubahan setelahnya hanya mengubah salinan milik venue itu.
-- =====================================================================

create or replace function public.apply_template(
  p_venue_id uuid,
  p_venue_type public.venue_type,
  p_template jsonb
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_type jsonb;
  v_type_id uuid;
  v_item jsonb;
  v_order integer;
  v_target uuid;
begin
  if not app.can_manage() then
    raise exception 'Hanya Admin dan Super Admin yang bisa menerapkan template.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.venues where id = p_venue_id) then
    raise exception 'Venue tidak ditemukan.' using errcode = 'IM404';
  end if;
  -- Template hanya untuk venue yang belum berisi lokasi: menimpa tipe yang sudah dipakai
  -- akan menghapus kategori dan field lokasi yang ada.
  if exists (select 1 from public.locations where venue_id = p_venue_id) then
    raise exception 'Template hanya bisa diterapkan ke venue yang belum punya lokasi.'
      using errcode = 'IM409';
  end if;

  -- Tipe bawaan "Lokasi" dari trigger venue diganti tipe template.
  delete from public.location_types where venue_id = p_venue_id;

  v_order := 0;
  for v_type in select value from jsonb_array_elements(p_template -> 'locationTypes') loop
    insert into public.location_types (venue_id, name, icon, color, sort_order)
    values (
      p_venue_id, v_type ->> 'name',
      case when v_type ->> 'icon' is null then null else 'builtin:' || (v_type ->> 'icon') end,
      v_type ->> 'color', v_order
    )
    returning id into v_type_id;
    v_order := v_order + 1;

    insert into public.field_definitions (
      location_type_id, key, label, field_type, options, is_required, is_visible,
      is_searchable, sort_order
    )
    select v_type_id, f.value ->> 'key', f.value ->> 'label',
      (f.value ->> 'type')::public.field_type, coalesce(f.value -> 'options', '[]'),
      (f.value ->> 'isRequired')::boolean, (f.value ->> 'isVisible')::boolean,
      (f.value ->> 'isSearchable')::boolean and (f.value ->> 'isVisible')::boolean,
      (f.ordinality - 1)::integer
    from jsonb_array_elements(v_type -> 'fields') with ordinality as f;

    insert into public.categories (location_type_id, name, icon, sort_order)
    select v_type_id, c.value ->> 'name',
      case when c.value ->> 'icon' is null then null else 'builtin:' || (c.value ->> 'icon') end,
      (c.ordinality - 1)::integer
    from jsonb_array_elements(v_type -> 'categories') with ordinality as c;
  end loop;

  insert into public.facility_types (venue_id, name, icon_path, is_safety, sort_order)
  select p_venue_id, t.value ->> 'name',
    case when t.value ->> 'icon' is null then null else 'builtin:' || (t.value ->> 'icon') end,
    (t.value ->> 'isSafety')::boolean, (t.ordinality - 1)::integer
  from jsonb_array_elements(p_template -> 'facilityTypes') with ordinality as t
  on conflict (venue_id, name) do nothing;

  for v_item in select value from jsonb_array_elements(p_template -> 'aliases') loop
    if v_item ->> 'kind' = 'facility_type' then
      select id into v_target from public.facility_types
      where venue_id = p_venue_id and name = v_item ->> 'name';
      if v_target is not null then
        insert into public.search_aliases (venue_id, facility_type_id, keyword)
        values (p_venue_id, v_target, v_item ->> 'keyword');
      end if;
    else
      select c.id into v_target
      from public.categories c join public.location_types t on t.id = c.location_type_id
      where t.venue_id = p_venue_id and t.name = v_item ->> 'locationType'
        and c.name = v_item ->> 'name';
      if v_target is not null then
        insert into public.search_aliases (venue_id, category_id, keyword)
        values (p_venue_id, v_target, v_item ->> 'keyword');
      end if;
    end if;
  end loop;

  update public.venues set venue_type = p_venue_type where id = p_venue_id;
end
$$;

revoke execute on function public.apply_template(uuid, public.venue_type, jsonb) from public, anon;
grant execute on function public.apply_template(uuid, public.venue_type, jsonb) to authenticated;
