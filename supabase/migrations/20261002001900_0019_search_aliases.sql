-- =====================================================================
-- 0019_search_aliases.sql — alias pencarian per sasaran (T-306, FR-LOC-09)
-- Mengganti seluruh alias satu lokasi, kategori, atau jenis fasilitas dalam satu
-- transaksi. Sasaran harus milik venue yang sama; aturan tulis mengikuti RLS
-- search_aliases (Editor ke atas, 0001).
-- =====================================================================

create or replace function public.set_search_aliases(
  p_venue_id uuid,
  p_target_kind text,
  p_target_id uuid,
  p_keywords text[]
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_target_kind = 'location' then
    if not exists (select 1 from public.locations where id = p_target_id and venue_id = p_venue_id) then
      raise exception 'Lokasi tidak ditemukan di venue ini.' using errcode = 'IM404';
    end if;
    delete from public.search_aliases where location_id = p_target_id;
  elsif p_target_kind = 'category' then
    if not exists (
      select 1 from public.categories c join public.location_types t on t.id = c.location_type_id
      where c.id = p_target_id and t.venue_id = p_venue_id
    ) then
      raise exception 'Kategori tidak ditemukan di venue ini.' using errcode = 'IM404';
    end if;
    delete from public.search_aliases where category_id = p_target_id;
  elsif p_target_kind = 'facility_type' then
    if not exists (select 1 from public.facility_types where id = p_target_id and venue_id = p_venue_id) then
      raise exception 'Jenis fasilitas tidak ditemukan di venue ini.' using errcode = 'IM404';
    end if;
    delete from public.search_aliases where facility_type_id = p_target_id;
  else
    raise exception 'Sasaran alias tidak dikenal.' using errcode = 'IM422';
  end if;
  if coalesce(array_length(p_keywords, 1), 0) > 20 then
    raise exception 'Maksimal 20 alias.' using errcode = 'IM422';
  end if;

  insert into public.search_aliases (venue_id, location_id, category_id, facility_type_id, keyword)
  select p_venue_id,
    case when p_target_kind = 'location' then p_target_id end,
    case when p_target_kind = 'category' then p_target_id end,
    case when p_target_kind = 'facility_type' then p_target_id end,
    left(trim(k), 60)
  from (select distinct trim(k) as k from unnest(coalesce(p_keywords, '{}')) as k) as keywords
  where k <> '';
end
$$;

revoke execute on function public.set_search_aliases(uuid, text, uuid, text[]) from public, anon;
grant execute on function public.set_search_aliases(uuid, text, uuid, text[]) to authenticated;
