-- DRAF T-116, BELUM DITERAPKAN DAN BELUM DIUJI. Pindahkan ke supabase/migrations/ dengan
-- timestamp baru setelah diuji (supabase db reset + pgTAP) saat T-116 dikerjakan.
-- =====================================================================
-- 0010_location_links.sql — lokasi dasar, kategori, tautan unit (T-116)
-- * save_location: simpan lokasi + kategori + unit dalam satu transaksi, dengan pesan
--   Bahasa Indonesia untuk kode ganda dan unit yang sudah dipakai (SQLSTATE IM409).
-- * Tautan lokasi hanya ke fitur jenis unit di venue yang sama (FR-LOC-04).
-- * Pesan unit yang sudah dipakai lokasi aktif lain menyebut kode unit dan lokasinya.
-- * Storage logo/foto lokasi: public-assets/locations/{venue_id}/…, hak Editor ke atas.
-- =====================================================================

-- Pesan untuk pengguna: kode unit dan nama lokasi pemiliknya, bukan UUID.
create or replace function app.check_unit_single_location() returns trigger
language plpgsql
as $$
declare
  v_unit text;
  v_owner text;
begin
  select l.name into v_owner
  from public.location_units lu
  join public.locations l on l.id = lu.location_id
  where lu.feature_id = new.feature_id
    and lu.location_id <> new.location_id
    and l.status <> 'inactive_permanent'
  limit 1;
  if v_owner is not null then
    select unit_code into v_unit from public.features where id = new.feature_id;
    raise exception 'Unit % sudah dipakai lokasi "%" yang masih aktif.', v_unit, v_owner
      using errcode = 'IM409';
  end if;
  return new;
end
$$;

create or replace function app.check_location_unit_kind() returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.features f
    join public.locations l on l.id = new.location_id
    where f.id = new.feature_id and f.kind = 'unit' and f.venue_id = l.venue_id
  ) then
    raise exception 'Lokasi hanya bisa ditautkan ke unit di venue yang sama.'
      using errcode = 'IM422';
  end if;
  return new;
end
$$;

create trigger location_units_unit_kind before insert or update on public.location_units
  for each row execute function app.check_location_unit_kind();

-- Kategori lokasi harus milik tipe lokasinya.
create or replace function app.check_location_category_type() returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.categories c
    join public.locations l on l.id = new.location_id
    where c.id = new.category_id and c.location_type_id = l.location_type_id
  ) then
    raise exception 'Kategori tidak sesuai dengan tipe lokasi.' using errcode = 'IM422';
  end if;
  return new;
end
$$;

create trigger location_categories_same_type before insert or update on public.location_categories
  for each row execute function app.check_location_category_type();

/**
 * Menyimpan lokasi dan tautannya sekaligus. `security invoker`: RLS tetap berlaku
 * (Editor ke atas). Mengembalikan id lokasi.
 */
create or replace function public.save_location(
  p_venue_id uuid,
  p_location_id uuid,
  p_code text,
  p_name text,
  p_location_type_id uuid,
  p_description text,
  p_category_ids uuid[],
  p_unit_ids uuid[],
  p_primary_unit_id uuid
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := coalesce(p_location_id, gen_random_uuid());
  v_code text := nullif(trim(p_code), '');
  v_owner text;
begin
  if nullif(trim(p_name), '') is null then
    raise exception 'Nama lokasi wajib diisi.' using errcode = 'IM422';
  end if;

  if v_code is not null then
    select name into v_owner
    from public.locations
    where venue_id = p_venue_id and lower(code) = lower(v_code) and id <> v_id
    limit 1;
    if v_owner is not null then
      raise exception 'Kode lokasi % sudah dipakai lokasi "%".', v_code, v_owner
        using errcode = 'IM409';
    end if;
  end if;

  insert into public.locations (id, venue_id, code, location_type_id, name, description)
  values (v_id, p_venue_id, v_code, p_location_type_id, trim(p_name), nullif(trim(p_description), ''))
  on conflict (id) do update
    set code = excluded.code,
        location_type_id = excluded.location_type_id,
        name = excluded.name,
        description = excluded.description;

  if not found then
    raise exception 'Anda tidak memiliki izin untuk menyimpan lokasi ini.' using errcode = '42501';
  end if;

  delete from public.location_categories where location_id = v_id;
  insert into public.location_categories (location_id, category_id)
  select v_id, c from unnest(coalesce(p_category_ids, '{}')) as c;

  delete from public.location_units where location_id = v_id;
  insert into public.location_units (location_id, feature_id, is_primary)
  select v_id, u, u = coalesce(p_primary_unit_id, p_unit_ids[1])
  from unnest(coalesce(p_unit_ids, '{}')) as u;

  return v_id;
end
$$;

revoke execute on function public.save_location(uuid, uuid, text, text, uuid, text, uuid[], uuid[], uuid) from public, anon;
grant execute on function public.save_location(uuid, uuid, text, text, uuid, text, uuid[], uuid[], uuid) to authenticated;

-- Logo dan foto lokasi dibaca publik oleh Visitor; ditulis Editor ke atas (tabel locations).
create policy public_assets_locations_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'locations' and app.can_edit()
  );
create policy public_assets_locations_update on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'locations' and app.can_edit()
  )
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'locations' and app.can_edit()
  );
create policy public_assets_locations_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'locations' and app.can_edit()
  );
