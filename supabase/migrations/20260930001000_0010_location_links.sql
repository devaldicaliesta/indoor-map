-- =====================================================================
-- 0010_location_links.sql — lokasi dasar, kategori, tautan unit (T-116)
-- * save_location: simpan lokasi, kategori, dan unitnya dalam satu transaksi, dengan
--   pesan Bahasa Indonesia untuk kode ganda dan unit yang sudah dipakai (SQLSTATE IM409).
-- * Lokasi hanya ditautkan ke fitur jenis unit di venue yang sama; unit yang
--   diganti jenisnya di editor otomatis lepas dari lokasinya.
-- * Kategori lokasi harus milik tipe lokasinya.
-- * Storage: logo/foto lokasi (public-assets/locations/{venue_id}/…) dan ikon kategori
--   (public-assets/categories/{venue_id}/…), ditulis Editor ke atas seperti tabelnya.
-- =====================================================================

-- Pesan untuk pengguna menyebut kode unit dan nama lokasi pemiliknya, bukan UUID.
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
    select coalesce(unit_code, new.feature_id::text) into v_unit
    from public.features where id = new.feature_id;
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

-- Unit yang diganti jenisnya (misalnya menjadi koridor) bukan lagi tempat lokasi.
create or replace function app.unlink_locations_on_kind_change() returns trigger
language plpgsql
as $$
begin
  delete from public.location_units where feature_id = new.id;
  return new;
end
$$;

create trigger features_unlink_locations after update of kind on public.features
  for each row when (old.kind = 'unit' and new.kind <> 'unit')
  execute function app.unlink_locations_on_kind_change();

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

-- Menyimpan lokasi dan tautannya sekaligus. `security invoker`: RLS tetap berlaku
-- (Editor ke atas). Id dibuat klien agar logo/foto bisa diunggah sebelum baris ada.
-- Kategori dan unit yang tidak ada di daftar dilepas; unit utama default = unit pertama.
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
  p_primary_unit_id uuid default null
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
    id, venue_id, code, location_type_id, name, description, logo_path, photo_paths
  ) values (
    p_id, p_venue_id, v_code, p_location_type_id, v_name, nullif(trim(p_description), ''),
    v_logo, v_photos
  )
  on conflict (id) do update
    set code = excluded.code,
        location_type_id = excluded.location_type_id,
        name = excluded.name,
        description = excluded.description,
        logo_path = excluded.logo_path,
        photo_paths = excluded.photo_paths;

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

  return p_id;
end
$$;

revoke execute on function public.save_location(
  uuid, uuid, uuid, text, uuid[], uuid[], text[], text, text, text, uuid
) from public, anon;
grant execute on function public.save_location(
  uuid, uuid, uuid, text, uuid[], uuid[], text[], text, text, text, uuid
) to authenticated;

-- Logo/foto lokasi dan ikon kategori dibaca publik oleh Visitor; ditulis Editor ke atas
-- (tabel locations dan categories adalah konten Editor, 0001). Baca metadata: 0008.
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

create policy public_assets_categories_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'categories' and app.can_edit()
  );
create policy public_assets_categories_update on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'categories' and app.can_edit()
  )
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'categories' and app.can_edit()
  );
create policy public_assets_categories_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'categories' and app.can_edit()
  );
