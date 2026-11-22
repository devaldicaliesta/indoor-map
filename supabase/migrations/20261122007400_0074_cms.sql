-- =====================================================================
-- 0074_cms.sql — penguatan CMS (T-573)
-- 1. Pustaka media per venue: `media_assets` mendaftar berkas venue (logo, foto, ikon, gambar
--    event, denah) beserta pemakaiannya. Berkas yang masih dipakai ditolak dihapus oleh policy
--    Storage (`app.asset_in_use`), bukan hanya disembunyikan tombolnya.
-- 2. Edit massal lokasi: `bulk_edit_locations` mengubah status, tipe, kategori, atau jam mingguan
--    banyak lokasi dalam satu transaksi, menyimpan nilai sebelumnya, dan mencatat audit.
--    `undo_location_bulk_edit` memulihkan edit massal terakhir venue itu.
-- 3. Dasbor venue: `venue_dashboard` menghitung ringkasan langsung dari tabel draft.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Pustaka media
-- ---------------------------------------------------------------------

-- Semua rujukan berkas di data draft venue. Path Storage disimpan apa adanya di kolom, jadi
-- pemakaian = kesamaan teks path. Ikon bawaan (`builtin:`) dan nama ikon bukan berkas.
create or replace function app.asset_refs(p_venue_id uuid)
returns table (bucket text, path text, kind text, ref_id uuid, ref_name text, role text)
language sql stable security definer
set search_path = ''
as $$
  select 'public-assets', v.logo_path, 'venue', v.id, v.name, 'logo'
  from public.venues v
  where v.id = p_venue_id and v.logo_path is not null
  union all
  select 'public-assets', l.logo_path, 'location', l.id, l.name, 'logo'
  from public.locations l
  where l.venue_id = p_venue_id and l.logo_path is not null
  union all
  select 'public-assets', p.path, 'location', l.id, l.name, 'photo'
  from public.locations l cross join lateral unnest(l.photo_paths) as p(path)
  where l.venue_id = p_venue_id
  union all
  select 'public-assets', f.value #>> '{}', 'location', l.id, l.name, 'field'
  from public.locations l cross join lateral jsonb_each(l.custom_fields) as f
  where l.venue_id = p_venue_id and jsonb_typeof(f.value) = 'string'
    and starts_with(f.value #>> '{}', 'locations/' || p_venue_id || '/')
  union all
  select 'public-assets', c.icon, 'category', c.id, c.name, 'icon'
  from public.categories c join public.location_types t on t.id = c.location_type_id
  where t.venue_id = p_venue_id and starts_with(c.icon, 'categories/')
  union all
  select 'public-assets', ft.icon_path, 'facility_type', ft.id, ft.name, 'icon'
  from public.facility_types ft
  where ft.venue_id = p_venue_id and starts_with(ft.icon_path, 'facility-types/')
  union all
  select 'public-assets', e.image_path, 'event', e.id, e.title_id, 'image'
  from public.events e
  where e.venue_id = p_venue_id and e.image_path is not null
  union all
  select 'floor-plans', p.path, 'floor', fl.id,
    case when b.name is null then fl.name else b.name || ' · ' || fl.name end,
    case when fp.is_active then 'plan' else 'plan_history' end
  from public.floor_plans fp
  join public.floors fl on fl.id = fp.floor_id
  left join public.buildings b on b.id = fl.building_id
  cross join lateral (
    select fp.source_path
    union
    select fp.raster_path where fp.raster_path is not null
  ) as p(path)
  where fl.venue_id = p_venue_id
$$;

revoke execute on function app.asset_refs(uuid) from public, anon, authenticated;

create or replace function app.asset_in_use(p_bucket text, p_name text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from app.asset_refs(app.storage_venue(p_bucket, p_name)) r
    where r.bucket = p_bucket and r.path = p_name
  )
$$;

grant execute on function app.asset_in_use(text, text) to authenticated;

-- Folder Storage per venue yang masuk pustaka media. Model 3D (`models/`) tidak termasuk:
-- dikelola di pustaka objek Editor Peta.
create or replace function public.media_assets(p_venue_id uuid)
returns table (
  bucket text,
  path text,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz,
  usages jsonb
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not (app.can_read() and app.can_access_venue(p_venue_id)) then
    raise exception 'Anda tidak berhak membuka pustaka media venue ini.' using errcode = '42501';
  end if;

  return query
  with objects as (
    select o.bucket_id::text as bucket, o.name, o.metadata, o.created_at
    from storage.objects o
    where o.bucket_id = 'public-assets'
      and (storage.foldername(o.name))[1] in ('venues', 'locations', 'categories', 'facility-types', 'events')
      and (storage.foldername(o.name))[2] = p_venue_id::text
    union all
    select o.bucket_id::text, o.name, o.metadata, o.created_at
    from storage.objects o
    where o.bucket_id = 'floor-plans' and (storage.foldername(o.name))[1] = p_venue_id::text
  ),
  refs as (
    select r.bucket, r.path,
      jsonb_agg(
        jsonb_build_object('kind', r.kind, 'id', r.ref_id, 'name', r.ref_name, 'role', r.role)
        order by r.kind, r.ref_name, r.role
      ) as usages
    from app.asset_refs(p_venue_id) r
    group by r.bucket, r.path
  )
  select o.bucket, o.name, coalesce((o.metadata ->> 'size')::bigint, 0),
    coalesce(o.metadata ->> 'mimetype', ''), o.created_at, coalesce(r.usages, '[]'::jsonb)
  from objects o
  left join refs r on r.bucket = o.bucket and r.path = o.name
  order by o.created_at desc, o.name;
end
$$;

revoke execute on function public.media_assets(uuid) from public, anon;
grant execute on function public.media_assets(uuid) to authenticated;

-- Policy hapus: syarat lama tetap, ditambah berkas tidak dipakai data mana pun. Alur yang sudah
-- ada (ganti logo, hapus lokasi, hapus venue) melepas rujukan dulu baru menghapus berkasnya.
do $$
declare
  r record;
  v2 text := '(case when (select app.all_venues_user()) then true'
    || ' else (storage.foldername(name))[2] in (select app.writable_venue_keys()) end)';
begin
  for r in
    select *
    from (values
      ('categories', 'categories', 'app.can_edit()'),
      ('facility_types', 'facility-types', 'app.can_manage()'),
      ('locations', 'locations', 'app.can_edit()'),
      ('venues', 'venues', 'app.can_manage()'),
      ('events', 'events', 'app.can_edit()')
    ) as t(policy_suffix, folder, role_check)
  loop
    execute format(
      'alter policy %I on storage.objects using (bucket_id = %L and (storage.foldername(name))[1] = %L and %s and %s and not app.asset_in_use(bucket_id, name))',
      'public_assets_' || r.policy_suffix || '_delete', 'public-assets', r.folder, r.role_check, v2);
  end loop;

  execute format(
    'alter policy floor_plans_delete on storage.objects using (bucket_id = %L and app.can_manage() and %s and not app.asset_in_use(bucket_id, name))',
    'floor-plans',
    '(case when (select app.all_venues_user()) then true'
      || ' else (storage.foldername(name))[1] in (select app.writable_venue_keys()) end)');
end $$;

-- ---------------------------------------------------------------------
-- 2. Edit massal lokasi
-- ---------------------------------------------------------------------

create table public.location_bulk_edits (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  venue_id uuid not null references public.venues (id) on delete cascade,
  change jsonb not null,
  location_count integer not null check (location_count > 0),
  -- Nilai sebelum perubahan per lokasi, untuk undo. Hanya dibaca fungsi undo.
  previous jsonb not null,
  created_by uuid references public.profiles (user_id) on delete set null,
  created_at timestamptz not null default now(),
  undone_at timestamptz,
  undone_by uuid references public.profiles (user_id) on delete set null
);
create index location_bulk_edits_venue_idx on public.location_bulk_edits (venue_id, seq desc);

alter table public.location_bulk_edits enable row level security;

create policy location_bulk_edits_read on public.location_bulk_edits for select to authenticated
  using (
    (select app.can_read())
    and (case when (select app.all_venues_user()) then true
         else venue_id in (select app.accessible_venue_ids()) end)
  );

-- Ditulis hanya lewat fungsi di bawah; kolom `previous` tidak dibuka ke klien. Hak bawaan
-- Supabase untuk tabel baru (semua hak ke anon/authenticated) dicabut dulu.
revoke all on public.location_bulk_edits from anon, authenticated;
grant select (id, seq, venue_id, change, location_count, created_by, created_at, undone_at, undone_by)
  on public.location_bulk_edits to authenticated;

create or replace function app.can_edit_venue(p_venue_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select app.can_edit()
    and (app.all_venues_user() or p_venue_id in (select app.writable_venue_ids()))
$$;

-- Batas satu edit massal: cukup untuk "semua hasil filter" venue besar, tetap satu transaksi.
create or replace function app.bulk_edit_max() returns integer
language sql immutable as $$ select 1000 $$;

-- Mengubah banyak lokasi sekaligus. `p_change`:
--   {"kind":"status","status":"coming_soon","opening_date":"2026-12-01"}
--   {"kind":"type","type_id":"…"}          kategori dan field kustom yang tidak ada di tipe baru dilepas
--   {"kind":"category_add","category_id":"…"} / {"kind":"category_remove","category_id":"…"}
--   {"kind":"hours","hours":[{"weekday":1,"opens_at":"08:00","closes_at":"16:00"}]}
--                                            jam mingguan diganti; tanggal khusus tetap
create or replace function public.bulk_edit_locations(
  p_venue_id uuid,
  p_location_ids uuid[],
  p_change jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_count integer;
  v_kind text := p_change ->> 'kind';
  v_status public.location_status;
  v_date date;
  v_type uuid;
  v_category uuid;
  v_category_type uuid;
  v_category_name text;
  v_hours jsonb;
  v_previous jsonb;
  v_batch uuid;
  v_change jsonb;
begin
  if not app.can_edit_venue(p_venue_id) then
    raise exception 'Anda tidak berhak mengubah lokasi venue ini.' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct x), '{}') into v_ids
  from unnest(coalesce(p_location_ids, '{}')) as x
  where x is not null;
  v_count := cardinality(v_ids);
  if v_count = 0 then
    raise exception 'Pilih minimal satu lokasi.' using errcode = 'IM422';
  end if;
  if v_count > app.bulk_edit_max() then
    raise exception 'Edit massal paling banyak % lokasi sekaligus.', app.bulk_edit_max()
      using errcode = 'IM422';
  end if;
  if (select count(*) from public.locations l where l.id = any(v_ids) and l.venue_id = p_venue_id)
    <> v_count
  then
    raise exception 'Sebagian lokasi tidak ditemukan di venue ini. Muat ulang tabel lalu coba lagi.'
      using errcode = 'IM422';
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', l.id,
    'status', l.status,
    'opening_date', l.opening_date,
    'location_type_id', l.location_type_id,
    'custom_fields', l.custom_fields,
    'category_ids', coalesce(
      (select jsonb_agg(lc.category_id) from public.location_categories lc where lc.location_id = l.id),
      '[]'::jsonb),
    'weekly_hours', coalesce(
      (select jsonb_agg(jsonb_build_object(
         'weekday', h.weekday, 'opens_at', h.opens_at, 'closes_at', h.closes_at, 'is_closed', h.is_closed))
       from public.opening_hours h where h.location_id = l.id and h.weekday is not null),
      '[]'::jsonb),
    'unit_statuses', coalesce(
      (select jsonb_agg(jsonb_build_object('id', f.id, 'unit_status', f.unit_status))
       from public.location_units lu join public.features f on f.id = lu.feature_id
       where lu.location_id = l.id),
      '[]'::jsonb)
  )) into v_previous
  from public.locations l
  where l.id = any(v_ids);

  case v_kind
  when 'status' then
    if not coalesce(
      (p_change ->> 'status') = any(enum_range(null::public.location_status)::text[]), false)
    then
      raise exception 'Status lokasi tidak dikenal.' using errcode = 'IM422';
    end if;
    v_status := (p_change ->> 'status')::public.location_status;
    begin
      v_date := nullif(p_change ->> 'opening_date', '')::date;
    exception when others then
      raise exception 'Tanggal buka tidak valid.' using errcode = 'IM422';
    end;
    if v_status = 'coming_soon' and v_date is null then
      raise exception 'Tanggal buka wajib diisi untuk status segera buka.' using errcode = 'IM422';
    end if;
    update public.locations l
    set status = v_status,
        opening_date = case when v_status = 'coming_soon' then v_date end
    where l.id = any(v_ids);
    v_change := jsonb_build_object('kind', v_kind, 'status', v_status,
      'opening_date', case when v_status = 'coming_soon' then v_date end);

  when 'type' then
    begin
      v_type := (p_change ->> 'type_id')::uuid;
    exception when others then
      v_type := null;
    end;
    if v_type is null or not exists (
      select 1 from public.location_types t where t.id = v_type and t.venue_id = p_venue_id
    ) then
      raise exception 'Tipe lokasi tidak ditemukan di venue ini.' using errcode = 'IM422';
    end if;
    delete from public.location_categories lc
    using public.categories c
    where lc.location_id = any(v_ids) and c.id = lc.category_id and c.location_type_id <> v_type;
    -- Nilai field dipertahankan bila kunci yang sama ada di tipe baru dengan jenis yang sama
    -- (sama dengan `keepFieldsOf` di formulir lokasi).
    update public.locations l
    set custom_fields = coalesce((
          select jsonb_object_agg(e.key, e.value)
          from jsonb_each(l.custom_fields) as e
          join public.field_definitions nf on nf.location_type_id = v_type and nf.key = e.key
          left join public.field_definitions old
            on old.location_type_id = l.location_type_id and old.key = e.key
          where old.id is null or old.field_type = nf.field_type
        ), '{}'::jsonb),
        location_type_id = v_type
    where l.id = any(v_ids) and l.location_type_id <> v_type;
    v_change := jsonb_build_object('kind', v_kind, 'type_id', v_type);

  when 'category_add', 'category_remove' then
    begin
      v_category := (p_change ->> 'category_id')::uuid;
    exception when others then
      v_category := null;
    end;
    select c.location_type_id, c.name into v_category_type, v_category_name
    from public.categories c join public.location_types t on t.id = c.location_type_id
    where c.id = v_category and t.venue_id = p_venue_id;
    if v_category_type is null then
      raise exception 'Kategori tidak ditemukan di venue ini.' using errcode = 'IM422';
    end if;
    if v_kind = 'category_add' then
      if exists (
        select 1 from public.locations l where l.id = any(v_ids) and l.location_type_id <> v_category_type
      ) then
        raise exception 'Kategori "%" hanya untuk lokasi bertipe sama. Saring tabel per tipe lalu pilih ulang.',
          v_category_name using errcode = 'IM422';
      end if;
      insert into public.location_categories (location_id, category_id)
      select x, v_category from unnest(v_ids) as x
      on conflict do nothing;
    else
      delete from public.location_categories lc
      where lc.location_id = any(v_ids) and lc.category_id = v_category;
    end if;
    v_change := jsonb_build_object('kind', v_kind, 'category_id', v_category);

  when 'hours' then
    v_hours := coalesce(p_change -> 'hours', '[]'::jsonb);
    if jsonb_typeof(v_hours) <> 'array' or exists (
      select 1 from jsonb_array_elements(v_hours) as h
      where jsonb_typeof(h) <> 'object'
        or coalesce((h ->> 'weekday') !~ '^[1-7]$', true)
        or coalesce((h ->> 'opens_at') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$', true)
        or coalesce((h ->> 'closes_at') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$', true)
    ) then
      raise exception 'Jam operasional tidak valid. Gunakan hari Senin–Minggu dan jam JJ:MM.'
        using errcode = 'IM422';
    end if;
    delete from public.opening_hours h where h.location_id = any(v_ids) and h.weekday is not null;
    insert into public.opening_hours (location_id, weekday, opens_at, closes_at, is_closed)
    select x, (h ->> 'weekday')::smallint, (h ->> 'opens_at')::time, (h ->> 'closes_at')::time, false
    from unnest(v_ids) as x cross join jsonb_array_elements(v_hours) as h;
    v_change := jsonb_build_object('kind', v_kind, 'hours', v_hours);

  else
    raise exception 'Jenis perubahan tidak dikenal.' using errcode = 'IM422';
  end case;

  insert into public.location_bulk_edits (venue_id, change, location_count, previous, created_by)
  values (p_venue_id, v_change, v_count, v_previous, app.current_user_id())
  returning id into v_batch;

  perform app.log_event('location_bulk_edit', 'location_bulk_edit', v_batch,
    jsonb_build_object('venue_id', p_venue_id, 'count', v_count, 'change', v_change));
  return v_batch;
end
$$;

revoke execute on function public.bulk_edit_locations(uuid, uuid[], jsonb) from public, anon;
grant execute on function public.bulk_edit_locations(uuid, uuid[], jsonb) to authenticated;

-- Memulihkan nilai sebelum edit massal, hanya untuk edit massal terakhir venue yang belum
-- diurungkan (edit massal yang lebih baru bisa bergantung pada hasilnya). Yang dipulihkan hanya
-- kolom yang diubah edit itu; lokasi yang sudah dihapus dilewati. Mengembalikan jumlah lokasi.
create or replace function public.undo_location_bulk_edit(p_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.location_bulk_edits;
  v_kind text;
  v_restored integer := 0;
  v_item jsonb;
  v_location uuid;
begin
  select * into v_batch from public.location_bulk_edits b where b.id = p_id for update;
  if v_batch.id is null or not app.can_edit_venue(v_batch.venue_id) then
    raise exception 'Edit massal tidak ditemukan atau Anda tidak berhak mengurungkannya.'
      using errcode = '42501';
  end if;
  if v_batch.undone_at is not null then
    raise exception 'Edit massal ini sudah diurungkan.' using errcode = 'IM409';
  end if;
  if exists (
    select 1 from public.location_bulk_edits b
    where b.venue_id = v_batch.venue_id and b.undone_at is null and b.seq > v_batch.seq
  ) then
    raise exception 'Hanya edit massal terakhir yang bisa diurungkan.' using errcode = 'IM409';
  end if;

  v_kind := v_batch.change ->> 'kind';
  for v_item in select * from jsonb_array_elements(v_batch.previous)
  loop
    v_location := (v_item ->> 'id')::uuid;
    continue when not exists (
      select 1 from public.locations l where l.id = v_location and l.venue_id = v_batch.venue_id
    );
    v_restored := v_restored + 1;

    if v_kind = 'status' then
      update public.locations l
      set status = (v_item ->> 'status')::public.location_status,
          opening_date = (v_item ->> 'opening_date')::date
      where l.id = v_location;
      -- Penutupan permanen mengosongkan unit (0001); status unit lama dikembalikan bila unit
      -- itu belum dipakai lokasi lain.
      update public.features f
      set unit_status = (u ->> 'unit_status')::public.unit_status
      from jsonb_array_elements(v_item -> 'unit_statuses') as u
      where f.id = (u ->> 'id')::uuid
        and not exists (
          select 1 from public.location_units lu join public.locations l on l.id = lu.location_id
          where lu.feature_id = f.id and l.id <> v_location and l.status <> 'inactive_permanent'
        );
    elsif v_kind = 'type' then
      if exists (
        select 1 from public.location_types t
        where t.id = (v_item ->> 'location_type_id')::uuid and t.venue_id = v_batch.venue_id
      ) then
        update public.locations l
        set location_type_id = (v_item ->> 'location_type_id')::uuid,
            custom_fields = v_item -> 'custom_fields'
        where l.id = v_location;
      end if;
    end if;

    if v_kind in ('type', 'category_add', 'category_remove') then
      delete from public.location_categories lc where lc.location_id = v_location;
      insert into public.location_categories (location_id, category_id)
      select v_location, c.id
      from jsonb_array_elements_text(v_item -> 'category_ids') as prev(id)
      join public.categories c on c.id = prev.id::uuid
      join public.locations l on l.id = v_location and l.location_type_id = c.location_type_id
      on conflict do nothing;
    end if;

    if v_kind = 'hours' then
      delete from public.opening_hours h where h.location_id = v_location and h.weekday is not null;
      insert into public.opening_hours (location_id, weekday, opens_at, closes_at, is_closed)
      select v_location, (h ->> 'weekday')::smallint, (h ->> 'opens_at')::time,
        (h ->> 'closes_at')::time, coalesce((h ->> 'is_closed')::boolean, false)
      from jsonb_array_elements(v_item -> 'weekly_hours') as h;
    end if;
  end loop;

  update public.location_bulk_edits b
  set undone_at = now(), undone_by = app.current_user_id()
  where b.id = p_id;

  perform app.log_event('location_bulk_undo', 'location_bulk_edit', p_id,
    jsonb_build_object('venue_id', v_batch.venue_id, 'count', v_restored, 'change', v_batch.change));
  return v_restored;
end
$$;

revoke execute on function public.undo_location_bulk_edit(uuid) from public, anon;
grant execute on function public.undo_location_bulk_edit(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Dasbor venue
-- ---------------------------------------------------------------------

-- Angka dihitung dari data draft saat diminta. "Lokasi tanpa unit" sama dengan filter
-- "Belum tertaut" di tabel Lokasi; "unit tanpa lokasi" = unit yang tidak dipakai lokasi mana pun
-- yang menempati unit (bukan nonaktif permanen).
create or replace function public.venue_dashboard(p_venue_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not (app.can_read() and app.can_access_venue(p_venue_id)) then
    raise exception 'Anda tidak berhak membuka dasbor venue ini.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'location_statuses', (
      select jsonb_object_agg(s.status, coalesce(c.n, 0))
      from unnest(enum_range(null::public.location_status)) as s(status)
      left join (
        select l.status, count(*) as n from public.locations l
        where l.venue_id = p_venue_id group by l.status
      ) c on c.status = s.status
    ),
    'locations_without_unit', (
      select count(*) from public.locations l
      where l.venue_id = p_venue_id
        and not exists (select 1 from public.location_units lu where lu.location_id = l.id)
    ),
    'units_total', (
      select count(*) from public.features f where f.venue_id = p_venue_id and f.kind = 'unit'
    ),
    'units_without_location', (
      select count(*) from public.features f
      where f.venue_id = p_venue_id and f.kind = 'unit'
        and not exists (
          select 1 from public.location_units lu join public.locations l on l.id = lu.location_id
          where lu.feature_id = f.id and l.status <> 'inactive_permanent'
        )
    ),
    'closures_active', (
      select count(*) from public.closures c
      where c.venue_id = p_venue_id and c.starts_at <= now() and (c.ends_at is null or c.ends_at > now())
    ),
    'closures_scheduled', (
      select count(*) from public.closures c where c.venue_id = p_venue_id and c.starts_at > now()
    ),
    'info_points', (
      select count(*) from public.info_points i where i.venue_id = p_venue_id
    ),
    'publication', (
      select jsonb_build_object(
        'version', p.version, 'published_at', p.published_at, 'origin', p.origin,
        'source_version', p.source_version, 'published_by', pr.full_name)
      from public.publications p
      left join public.profiles pr on pr.user_id = p.published_by
      where p.venue_id = p_venue_id and p.is_active
    ),
    'draft_updated_at', (
      select max(t) from (
        select max(l.updated_at) as t from public.locations l where l.venue_id = p_venue_id
        union all
        select max(f.updated_at) from public.features f where f.venue_id = p_venue_id
      ) as times
    )
  ) into v_result;
  return v_result;
end
$$;

revoke execute on function public.venue_dashboard(uuid) from public, anon;
grant execute on function public.venue_dashboard(uuid) to authenticated;
