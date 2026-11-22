-- T-593: kunci API, API REST integrasi, dan webhook keluar.
--
-- Kunci API dikelola Super Admin dan hanya disimpan sebagai hash SHA-256. Edge Function `api`
-- memeriksa kunci lalu memanggil fungsi `api_*` di sini sebagai service role; fungsi itu
-- memeriksa ulang scope, venue kunci, dan lisensi karena RLS dilewati service role.
--
-- Webhook: perubahan lokasi, penutupan, dan publish dicatat ke `app.webhook_outbox` oleh
-- trigger. Perubahan lokasi digabung per transaksi (import/edit massal = satu peristiwa).
-- Trigger tertunda (saat commit) mengubah outbox menjadi baris `webhook_deliveries` lalu
-- membangunkan Edge Function `webhook-dispatch` lewat pg_net; fungsi itu menandatangani isi
-- (HMAC, Standard Webhooks), mengirim, dan mencatat hasilnya. Gagal dicoba ulang dengan jeda
-- 1 menit, 5 menit, 30 menit, 2 jam, 6 jam (pg_cron tiap menit), lalu ditandai gagal.

-- ---------------------------------------------------------------------
-- 1. Kunci API
-- ---------------------------------------------------------------------
create function app.api_scopes() returns text[]
language sql immutable
as $$ select array['locations:read', 'locations:write', 'closures:read', 'closures:write'] $$;

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  prefix text not null,
  key_hash bytea not null unique,
  scopes text[] not null check (cardinality(scopes) > 0 and scopes <@ app.api_scopes()),
  venue_ids uuid[] check (venue_ids is null or cardinality(venue_ids) > 0),
  created_by uuid references public.profiles (user_id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (user_id) on delete set null
);
alter table public.api_keys enable row level security;
revoke all on public.api_keys from anon, authenticated;
grant select (
  id, name, prefix, scopes, venue_ids, created_by, created_at, last_used_at, revoked_at, revoked_by
) on public.api_keys to authenticated;
create policy api_keys_read on public.api_keys for select to authenticated
  using (app.has_role(array['super_admin']::public.app_role[]));

create function app.is_super_admin_writer() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin']::public.app_role[]) and app.license_active() $$;

create function app.check_venue_list(p_venue_ids uuid[]) returns uuid[]
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if p_venue_ids is null then
    return null;
  end if;
  if cardinality(p_venue_ids) = 0
    or exists (
      select 1 from unnest(p_venue_ids) as v
      where not exists (select 1 from public.venues where id = v)
    )
  then
    raise exception 'Pilih venue yang ada, atau semua venue.' using errcode = 'IM422';
  end if;
  return (select array_agg(distinct v order by v) from unnest(p_venue_ids) as v);
end
$$;

create function public.create_api_key(p_name text, p_scopes text[], p_venue_ids uuid[] default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_key text := 'pa_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_name text := nullif(trim(p_name), '');
  v_scopes text[];
  v_venues uuid[];
  v_id uuid;
begin
  if not app.is_super_admin_writer() then
    raise exception 'Hanya Super Admin yang bisa membuat kunci API.' using errcode = '42501';
  end if;
  if v_name is null or length(v_name) > 80 then
    raise exception 'Nama kunci wajib diisi, paling panjang 80 karakter.' using errcode = 'IM422';
  end if;
  select array_agg(distinct s order by s) into v_scopes from unnest(p_scopes) as s;
  if v_scopes is null or not (v_scopes <@ app.api_scopes()) then
    raise exception 'Pilih minimal satu izin yang dikenal.' using errcode = 'IM422';
  end if;
  v_venues := app.check_venue_list(p_venue_ids);
  insert into public.api_keys (name, prefix, key_hash, scopes, venue_ids, created_by)
  values (v_name, left(v_key, 11), extensions.digest(v_key, 'sha256'), v_scopes, v_venues,
    app.current_user_id())
  returning id into v_id;
  perform app.log_event('api_key_created', 'api_key', v_id,
    jsonb_build_object('name', v_name, 'scopes', v_scopes, 'venue_ids', v_venues));
  return jsonb_build_object('id', v_id, 'key', v_key);
end
$$;
revoke execute on function public.create_api_key(text, text[], uuid[]) from public, anon;
grant execute on function public.create_api_key(text, text[], uuid[]) to authenticated;

-- Mencabut selalu boleh bagi Super Admin, juga saat lisensi tidak aktif: menutup akses lebih
-- penting daripada mode baca.
create function public.revoke_api_key(p_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if not app.has_role(array['super_admin']::public.app_role[]) then
    raise exception 'Hanya Super Admin yang bisa mencabut kunci API.' using errcode = '42501';
  end if;
  update public.api_keys
  set revoked_at = now(), revoked_by = app.current_user_id()
  where id = p_id and revoked_at is null
  returning name into v_name;
  if v_name is null then
    raise exception 'Kunci tidak ditemukan atau sudah dicabut.' using errcode = 'IM409';
  end if;
  perform app.log_event('api_key_revoked', 'api_key', p_id, jsonb_build_object('name', v_name));
end
$$;
revoke execute on function public.revoke_api_key(uuid) from public, anon;
grant execute on function public.revoke_api_key(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 2. Pemeriksaan kunci untuk Edge Function `api` (service role)
-- ---------------------------------------------------------------------
create function public.api_authenticate(p_key text) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v public.api_keys;
begin
  select * into v from public.api_keys
  where key_hash = extensions.digest(coalesce(p_key, ''), 'sha256') and revoked_at is null;
  if not found then
    return null;
  end if;
  if v.last_used_at is null or v.last_used_at < now() - interval '1 minute' then
    update public.api_keys set last_used_at = now() where id = v.id;
  end if;
  return jsonb_build_object('id', v.id, 'name', v.name, 'scopes', to_jsonb(v.scopes),
    'venue_ids', to_jsonb(v.venue_ids));
end
$$;

create function app.api_key_check(p_key_id uuid, p_venue_id uuid, p_scope text)
returns public.api_keys
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v public.api_keys;
begin
  select * into v from public.api_keys where id = p_key_id and revoked_at is null;
  if not found then
    raise exception 'Kunci API tidak berlaku.' using errcode = '28000';
  end if;
  if not (p_scope = any(v.scopes)) then
    raise exception 'Kunci API ini tidak punya izin %.', p_scope using errcode = '42501';
  end if;
  if p_venue_id is not null and (
    not exists (select 1 from public.venues where id = p_venue_id)
    or (v.venue_ids is not null and not (p_venue_id = any(v.venue_ids)))
  ) then
    raise exception 'Venue tidak ditemukan.' using errcode = 'IM404';
  end if;
  if p_scope like '%:write' then
    if not app.license_active() then
      raise exception 'Lisensi tidak aktif: perubahan lewat API ditolak.' using errcode = '42501';
    end if;
    if p_venue_id is not null and app.venue_locked(p_venue_id) then
      raise exception 'Venue ini terkunci.' using errcode = '42501';
    end if;
  end if;
  return v;
end
$$;

create function app.api_spans(p_location_id uuid, p_weekday smallint, p_date date) returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    to_char(h.opens_at, 'HH24:MI') || '-' || to_char(h.closes_at, 'HH24:MI')
    order by h.opens_at
  ) filter (where not h.is_closed), '[]'::jsonb)
  from public.opening_hours h
  where h.location_id = p_location_id
    and h.weekday is not distinct from p_weekday
    and h.special_date is not distinct from p_date
$$;

create function app.api_location_json(p_id uuid) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', l.id,
    'code', l.code,
    'name', l.name,
    'type', t.name,
    'status', l.status,
    'openingDate', l.opening_date,
    'categories', coalesce((
      select jsonb_agg(c.name order by c.name)
      from public.location_categories lc join public.categories c on c.id = lc.category_id
      where lc.location_id = l.id
    ), '[]'::jsonb),
    'units', coalesce((
      select jsonb_agg(f.unit_code order by lu.is_primary desc, f.unit_code)
      from public.location_units lu join public.features f on f.id = lu.feature_id
      where lu.location_id = l.id and f.unit_code is not null
    ), '[]'::jsonb),
    'hours', jsonb_build_object(
      'weekly', (
        select jsonb_object_agg(d.key, app.api_spans(l.id, d.n::smallint, null))
        from unnest(array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
          with ordinality as d(key, n)
      ),
      'special', coalesce((
        select jsonb_agg(jsonb_build_object('date', s.special_date,
          'spans', app.api_spans(l.id, null, s.special_date)) order by s.special_date)
        from (
          select distinct h.special_date from public.opening_hours h
          where h.location_id = l.id and h.special_date is not null
        ) as s
      ), '[]'::jsonb)
    ),
    'visitorPath', '/v/' || l.venue_id || '?loc=' || l.id,
    'updatedAt', l.updated_at
  )
  from public.locations l join public.location_types t on t.id = l.location_type_id
  where l.id = p_id
$$;

create function public.api_venues(p_key_id uuid) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v public.api_keys;
begin
  select * into v from public.api_keys where id = p_key_id and revoked_at is null;
  if not found then
    raise exception 'Kunci API tidak berlaku.' using errcode = '28000';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', ve.id, 'name', ve.name, 'timezone', ve.timezone)
      order by ve.name)
    from public.venues ve
    where v.venue_ids is null or ve.id = any(v.venue_ids)
  ), '[]'::jsonb);
end
$$;

create function public.api_locations(p_key_id uuid, p_venue_id uuid, p_code text default null)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.api_key_check(p_key_id, p_venue_id, 'locations:read');
  return coalesce((
    select jsonb_agg(app.api_location_json(l.id) order by l.code nulls last, l.name)
    from public.locations l
    where l.venue_id = p_venue_id
      and (p_code is null or lower(l.code) = lower(trim(p_code)))
  ), '[]'::jsonb);
end
$$;

create function public.api_categories(p_key_id uuid, p_venue_id uuid) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.api_key_check(p_key_id, p_venue_id, 'locations:read');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'type', t.name,
      'categories', coalesce((
        select jsonb_agg(c.name order by c.sort_order, c.name)
        from public.categories c where c.location_type_id = t.id
      ), '[]'::jsonb)
    ) order by t.name)
    from public.location_types t where t.venue_id = p_venue_id
  ), '[]'::jsonb);
end
$$;

-- Upsert massal berdasarkan kode lokasi. `p_rows` sudah diperiksa bentuknya di Edge Function
-- (`parseLocationUpsert`): {code, name?, type?, status?, opening_date?, categories?,
-- weekly_hours?, special_hours?}. Kolom yang tidak dikirim tidak diubah; jam mingguan dan
-- tanggal khusus masing-masing diganti bila dikirim. Semua baris diterapkan atau tidak sama
-- sekali.
create function public.api_upsert_locations(p_key_id uuid, p_venue_id uuid, p_rows jsonb)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_key public.api_keys := app.api_key_check(p_key_id, p_venue_id, 'locations:write');
  r jsonb;
  v_loc public.locations;
  v_code text;
  v_type uuid;
  v_status public.location_status;
  v_opening date;
  v_categories uuid[];
  v_wanted integer;
  v_before jsonb;
  v_after jsonb;
  v_action text;
  v_errors text[] := '{}';
  v_results jsonb := '[]'::jsonb;
  v_changed jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'Daftar lokasi kosong.' using errcode = 'IM422';
  end if;
  if jsonb_array_length(p_rows) > 1000 then
    raise exception 'Paling banyak 1000 lokasi per permintaan.' using errcode = 'IM422';
  end if;
  perform set_config('app.webhook_location_batch', 'on', true);

  for r in select value from jsonb_array_elements(p_rows) loop
    v_code := upper(trim(r ->> 'code'));
    select * into v_loc from public.locations
    where venue_id = p_venue_id and lower(code) = lower(v_code);

    v_type := v_loc.location_type_id;
    if r ? 'type' then
      select id into v_type from public.location_types
      where venue_id = p_venue_id and lower(name) = lower(trim(r ->> 'type'));
      if v_type is null then
        v_errors := v_errors || format('%s: tipe "%s" tidak ada di venue ini.', v_code, r ->> 'type');
        continue;
      end if;
    end if;
    if v_loc.id is null and (v_type is null or not r ? 'name') then
      v_errors := v_errors || format('%s: lokasi baru butuh name dan type.', v_code);
      continue;
    end if;

    v_status := coalesce((r ->> 'status')::public.location_status, v_loc.status, 'active');
    v_opening := case when r ? 'opening_date' then (r ->> 'opening_date')::date
      else v_loc.opening_date end;
    if v_status = 'coming_soon' and v_opening is null then
      v_errors := v_errors || format('%s: status coming_soon butuh openingDate.', v_code);
      continue;
    end if;

    v_categories := null;
    if r ? 'categories' then
      v_wanted := jsonb_array_length(r -> 'categories');
      select coalesce(array_agg(c.id), '{}') into v_categories
      from public.categories c
      where c.location_type_id = v_type
        and lower(c.name) in (select lower(x) from jsonb_array_elements_text(r -> 'categories') as x);
      if cardinality(v_categories) <> v_wanted then
        v_errors := v_errors || format('%s: ada kategori yang tidak dimiliki tipe lokasinya.', v_code);
        continue;
      end if;
    end if;

    if v_loc.id is null then
      insert into public.locations (venue_id, code, location_type_id, name, status, opening_date)
      values (p_venue_id, v_code, v_type, trim(r ->> 'name'), v_status,
        case when v_status = 'coming_soon' then v_opening end)
      returning * into v_loc;
      v_before := null;
    else
      v_before := app.api_location_json(v_loc.id);
      if v_type <> v_loc.location_type_id and v_categories is null then
        delete from public.location_categories lc
        using public.categories c
        where lc.location_id = v_loc.id and c.id = lc.category_id and c.location_type_id <> v_type;
      end if;
      update public.locations l
      set name = coalesce(nullif(trim(r ->> 'name'), ''), l.name),
          status = v_status,
          opening_date = case when v_status = 'coming_soon' then v_opening end,
          custom_fields = case when v_type = l.location_type_id then l.custom_fields else coalesce((
            select jsonb_object_agg(e.key, e.value)
            from jsonb_each(l.custom_fields) as e
            join public.field_definitions nf on nf.location_type_id = v_type and nf.key = e.key
            left join public.field_definitions old
              on old.location_type_id = l.location_type_id and old.key = e.key
            where old.id is null or old.field_type = nf.field_type
          ), '{}'::jsonb) end,
          location_type_id = v_type
      where l.id = v_loc.id;
    end if;

    if v_categories is not null then
      delete from public.location_categories
      where location_id = v_loc.id and category_id <> all(v_categories);
      insert into public.location_categories (location_id, category_id)
      select v_loc.id, c from unnest(v_categories) as c
      on conflict do nothing;
    end if;
    if r ? 'weekly_hours' then
      delete from public.opening_hours where location_id = v_loc.id and weekday is not null;
      insert into public.opening_hours (location_id, weekday, opens_at, closes_at, is_closed)
      select v_loc.id, (h ->> 'weekday')::smallint, (h ->> 'opens_at')::time,
        (h ->> 'closes_at')::time, false
      from jsonb_array_elements(r -> 'weekly_hours') as h;
    end if;
    if r ? 'special_hours' then
      delete from public.opening_hours where location_id = v_loc.id and special_date is not null;
      insert into public.opening_hours (location_id, special_date, opens_at, closes_at, is_closed)
      select v_loc.id, (h ->> 'special_date')::date, (h ->> 'opens_at')::time,
        (h ->> 'closes_at')::time, coalesce((h ->> 'is_closed')::boolean, false)
      from jsonb_array_elements(r -> 'special_hours') as h;
    end if;

    v_after := app.api_location_json(v_loc.id);
    v_action := case
      when v_before is null then 'created'
      when (v_before - 'updatedAt') = (v_after - 'updatedAt') then 'unchanged'
      else 'updated'
    end;
    v_results := v_results || jsonb_build_object('code', v_code, 'id', v_loc.id, 'action', v_action);
    if v_action <> 'unchanged' then
      v_changed := v_changed || jsonb_build_object('id', v_loc.id, 'code', v_code,
        'name', v_after ->> 'name', 'status', v_after ->> 'status',
        'action', case v_action when 'created' then 'insert' else 'update' end);
    end if;
  end loop;

  if cardinality(v_errors) > 0 then
    raise exception '%', array_to_string(v_errors[1:10], ' ')
      || case when cardinality(v_errors) > 10
        then format(' (dan %s kesalahan lain)', cardinality(v_errors) - 10) else '' end
      using errcode = 'IM422';
  end if;

  perform set_config('app.webhook_location_batch', 'off', true);
  if jsonb_array_length(v_changed) > 0 then
    perform app.webhook_emit(p_venue_id, 'location', 'location.changed',
      jsonb_build_object('source', 'api', 'locations', v_changed), null);
  end if;
  perform app.log_event('api_locations_upserted', 'venue', p_venue_id, jsonb_build_object(
    'api_key_id', v_key.id, 'api_key', v_key.name,
    'created', (select count(*) from jsonb_array_elements(v_results) x where x ->> 'action' = 'created'),
    'updated', (select count(*) from jsonb_array_elements(v_results) x where x ->> 'action' = 'updated'),
    'unchanged', (select count(*) from jsonb_array_elements(v_results) x where x ->> 'action' = 'unchanged')
  ));
  return jsonb_build_object('locations', v_results);
end
$$;

create function app.api_closure_json(p_id uuid) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', c.id,
    'reason', c.reason,
    'startsAt', c.starts_at,
    'endsAt', c.ends_at,
    'target', case when c.feature_id is not null then 'unit'
      when c.edge_id is not null then 'path' else 'connector' end,
    'unitCode', f.unit_code,
    'locationCodes', coalesce((
      select jsonb_agg(l.code order by l.code)
      from public.location_units lu join public.locations l on l.id = lu.location_id
      where lu.feature_id = c.feature_id and l.code is not null
    ), '[]'::jsonb)
  )
  from public.closures c left join public.features f on f.id = c.feature_id
  where c.id = p_id
$$;

create function public.api_closures(p_key_id uuid, p_venue_id uuid) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.api_key_check(p_key_id, p_venue_id, 'closures:read');
  return coalesce((
    select jsonb_agg(app.api_closure_json(c.id) order by c.starts_at, c.id)
    from public.closures c
    where c.venue_id = p_venue_id and (c.ends_at is null or c.ends_at > now())
  ), '[]'::jsonb);
end
$$;

-- Penutupan dari sistem klien: satu penutupan per unit; kode lokasi menutup semua unitnya.
create function public.api_create_closures(p_key_id uuid, p_venue_id uuid, p_input jsonb)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_key public.api_keys := app.api_key_check(p_key_id, p_venue_id, 'closures:write');
  v_units uuid[];
  v_reason text := nullif(trim(p_input ->> 'reason'), '');
  v_starts timestamptz := coalesce((p_input ->> 'starts_at')::timestamptz, now());
  v_ends timestamptz := (p_input ->> 'ends_at')::timestamptz;
  v_ids uuid[];
begin
  if v_reason is null then
    raise exception 'Alasan penutupan wajib diisi.' using errcode = 'IM422';
  end if;
  if v_ends is not null and v_ends <= v_starts then
    raise exception 'Waktu selesai harus setelah waktu mulai.' using errcode = 'IM422';
  end if;
  if p_input ->> 'location_code' is not null then
    select array_agg(lu.feature_id order by lu.is_primary desc) into v_units
    from public.locations l join public.location_units lu on lu.location_id = l.id
    where l.venue_id = p_venue_id and lower(l.code) = lower(p_input ->> 'location_code');
    if v_units is null then
      if not exists (
        select 1 from public.locations
        where venue_id = p_venue_id and lower(code) = lower(p_input ->> 'location_code')
      ) then
        raise exception 'Lokasi % tidak ditemukan.', p_input ->> 'location_code' using errcode = 'IM404';
      end if;
      raise exception 'Lokasi % belum ditautkan ke unit di peta.', p_input ->> 'location_code'
        using errcode = 'IM422';
    end if;
  else
    select array_agg(f.id) into v_units
    from public.features f
    where f.venue_id = p_venue_id and f.kind = 'unit'
      and upper(f.unit_code) = upper(p_input ->> 'unit_code');
    if v_units is null then
      raise exception 'Unit % tidak ditemukan.', p_input ->> 'unit_code' using errcode = 'IM404';
    end if;
  end if;

  with created as (
    insert into public.closures (venue_id, feature_id, reason, starts_at, ends_at)
    select p_venue_id, u, v_reason, v_starts, v_ends from unnest(v_units) as u
    returning id
  )
  select array_agg(id) into v_ids from created;
  perform app.log_event('api_closure_created', 'venue', p_venue_id, jsonb_build_object(
    'api_key_id', v_key.id, 'api_key', v_key.name, 'reason', v_reason, 'closure_ids', v_ids));
  return coalesce((
    select jsonb_agg(app.api_closure_json(i)) from unnest(v_ids) as i
  ), '[]'::jsonb);
end
$$;

-- Mengakhiri penutupan yang sedang berjalan sekarang; penutupan yang belum mulai (atau baru
-- dimulai pada saat yang sama) dihapus.
create function public.api_end_closure(p_key_id uuid, p_venue_id uuid, p_closure_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_key public.api_keys := app.api_key_check(p_key_id, p_venue_id, 'closures:write');
  v public.closures;
begin
  select * into v from public.closures where id = p_closure_id and venue_id = p_venue_id;
  if not found then
    raise exception 'Penutupan tidak ditemukan.' using errcode = 'IM404';
  end if;
  if v.ends_at is not null and v.ends_at <= now() then
    raise exception 'Penutupan ini sudah berakhir.' using errcode = 'IM409';
  end if;
  if v.starts_at >= now() then
    delete from public.closures where id = v.id;
  else
    update public.closures set ends_at = now() where id = v.id;
  end if;
  perform app.log_event('api_closure_ended', 'venue', p_venue_id, jsonb_build_object(
    'api_key_id', v_key.id, 'api_key', v_key.name, 'closure_id', v.id, 'reason', v.reason));
  return jsonb_build_object('id', v.id, 'ended', true);
end
$$;

-- ---------------------------------------------------------------------
-- 3. Webhook
-- ---------------------------------------------------------------------
create function app.webhook_events() returns text[]
language sql immutable
as $$ select array['publish', 'closure', 'location'] $$;

create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  url text not null check (length(url) <= 500 and url ~ '^https?://[^/@\s]+'),
  secret text not null,
  events text[] not null check (cardinality(events) > 0 and events <@ app.webhook_events()),
  venue_ids uuid[] check (venue_ids is null or cardinality(venue_ids) > 0),
  active boolean not null default true,
  created_by uuid references public.profiles (user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger webhooks_touch_updated_at before update on public.webhooks
  for each row execute function app.touch_updated_at();
alter table public.webhooks enable row level security;
revoke all on public.webhooks from anon, authenticated;
grant select (id, name, url, events, venue_ids, active, created_by, created_at, updated_at)
  on public.webhooks to authenticated;
create policy webhooks_read on public.webhooks for select to authenticated
  using (app.has_role(array['super_admin']::public.app_role[]));

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks (id) on delete cascade,
  event text not null,
  venue_id uuid references public.venues (id) on delete set null,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'delivered', 'retrying', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  response_status integer,
  response_ms integer,
  error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index webhook_deliveries_due_idx on public.webhook_deliveries (next_attempt_at)
  where status in ('pending', 'retrying');
create index webhook_deliveries_webhook_idx on public.webhook_deliveries (webhook_id, created_at desc);
create index webhook_deliveries_created_idx on public.webhook_deliveries (created_at desc);
alter table public.webhook_deliveries enable row level security;
revoke all on public.webhook_deliveries from anon, authenticated;
grant select on public.webhook_deliveries to authenticated;
create policy webhook_deliveries_read on public.webhook_deliveries for select to authenticated
  using (app.has_role(array['super_admin']::public.app_role[]));

create function app.webhook_retry_delays() returns integer[]
language sql immutable
as $$ select array[60, 300, 1800, 7200, 21600] $$;

create function app.webhook_new_secret() returns text
language sql volatile
as $$ select 'whsec_' || encode(extensions.gen_random_bytes(24), 'base64') $$;

create function app.check_webhook_input(p_name text, p_url text, p_events text[])
returns void
language plpgsql immutable
as $$
begin
  if nullif(trim(p_name), '') is null or length(trim(p_name)) > 80 then
    raise exception 'Nama webhook wajib diisi, paling panjang 80 karakter.' using errcode = 'IM422';
  end if;
  if p_url is null or length(trim(p_url)) > 500 or trim(p_url) !~ '^https?://[^/@\s]+' then
    raise exception 'Alamat penerima harus diawali https:// atau http://, tanpa nama pengguna.'
      using errcode = 'IM422';
  end if;
  if p_events is null or cardinality(p_events) = 0 or not (p_events <@ app.webhook_events()) then
    raise exception 'Pilih minimal satu peristiwa.' using errcode = 'IM422';
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 4. Membangunkan pengirim (Edge Function `webhook-dispatch`)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'webhook_dispatch_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'webhook_dispatch_secret',
      'Rahasia panggilan database ke Edge Function webhook-dispatch (T-593)'
    );
  end if;
end
$$;

create function public.webhook_dispatch_authorized(p_secret text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(p_secret, '') <> '' and exists (
    select 1 from vault.decrypted_secrets s
    where s.name = 'webhook_dispatch_secret'
      and extensions.digest(s.decrypted_secret, 'sha256') = extensions.digest(p_secret, 'sha256')
  )
$$;

create function app.webhook_kick() returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select value into v_url from app.server_settings where key = 'functions_url';
  select decrypted_secret into v_secret
  from vault.decrypted_secrets where name = 'webhook_dispatch_secret';
  if v_url is null or v_secret is null then
    return;
  end if;
  perform net.http_post(
    url := rtrim(v_url, '/') || '/webhook-dispatch',
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-webhook-dispatch-secret', v_secret),
    timeout_milliseconds := 60000
  );
end
$$;

-- pg_cron: pengiriman yang jatuh tempo (percobaan ulang), dan yang macet "sending" lebih dari
-- 5 menit (pengirim berhenti di tengah jalan) dikembalikan ke antrean.
create function app.webhook_tick() returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.webhook_deliveries
  set status = 'retrying', error = coalesce(error, 'Pengiriman terputus.'), next_attempt_at = now()
  where status = 'sending' and last_attempt_at < now() - interval '5 minutes';
  if exists (
    select 1 from public.webhook_deliveries d join public.webhooks w on w.id = d.webhook_id
    where d.status in ('pending', 'retrying') and d.next_attempt_at <= now() and w.active
  ) then
    perform app.webhook_kick();
  end if;
end
$$;

create function public.webhook_claim(p_limit integer default 20) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  with due as (
    select d.id from public.webhook_deliveries d
    join public.webhooks w on w.id = d.webhook_id
    where d.status in ('pending', 'retrying') and d.next_attempt_at <= now() and w.active
    order by d.next_attempt_at
    limit least(greatest(coalesce(p_limit, 20), 1), 100)
    for update of d skip locked
  ),
  claimed as (
    update public.webhook_deliveries d
    set status = 'sending', attempts = d.attempts + 1, last_attempt_at = now()
    from due where d.id = due.id
    returning d.id, d.webhook_id, d.event, d.payload, d.attempts
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'event', c.event, 'payload', c.payload,
    'attempt', c.attempts, 'url', w.url, 'secret', w.secret)), '[]'::jsonb)
  into v_rows
  from claimed c join public.webhooks w on w.id = c.webhook_id;
  return v_rows;
end
$$;

create function public.webhook_record(
  p_id uuid, p_status integer, p_error text, p_ms integer
) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_delays integer[] := app.webhook_retry_delays();
begin
  update public.webhook_deliveries d
  set response_status = p_status,
      response_ms = p_ms,
      error = case when p_status between 200 and 299 then null
        else left(coalesce(p_error, 'Penerima membalas ' || p_status), 500) end,
      status = case
        when p_status between 200 and 299 then 'delivered'
        when d.attempts > cardinality(v_delays) then 'failed'
        else 'retrying' end,
      delivered_at = case when p_status between 200 and 299 then now() end,
      next_attempt_at = case
        when p_status between 200 and 299 or d.attempts > cardinality(v_delays) then d.next_attempt_at
        else now() + make_interval(secs => v_delays[d.attempts]) end
  where d.id = p_id and d.status = 'sending';
end
$$;

-- ---------------------------------------------------------------------
-- 5. Peristiwa: outbox per transaksi, diubah menjadi pengiriman saat commit
-- ---------------------------------------------------------------------
create table app.webhook_outbox (
  id bigint generated always as identity primary key,
  tx bigint not null default txid_current(),
  venue_id uuid not null,
  kind text not null,
  event text not null,
  data jsonb not null,
  merge_key text
);
create unique index webhook_outbox_merge_idx on app.webhook_outbox (tx, venue_id, merge_key)
  where merge_key is not null;

create function app.webhook_wanted(p_kind text, p_venue_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.webhooks w
    where w.active and p_kind = any(w.events)
      and (w.venue_ids is null or p_venue_id = any(w.venue_ids))
  )
$$;

create function app.webhook_emit(
  p_venue_id uuid, p_kind text, p_event text, p_data jsonb, p_merge_key text
) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_venue_id is null or not app.webhook_wanted(p_kind, p_venue_id) then
    return;
  end if;
  if p_merge_key is null then
    insert into app.webhook_outbox (venue_id, kind, event, data)
    values (p_venue_id, p_kind, p_event, p_data);
  else
    insert into app.webhook_outbox (venue_id, kind, event, data, merge_key)
    values (p_venue_id, p_kind, p_event, p_data, p_merge_key)
    on conflict (tx, venue_id, merge_key) where merge_key is not null
    do update set data = jsonb_set(app.webhook_outbox.data, '{locations}',
      (app.webhook_outbox.data -> 'locations') || (excluded.data -> 'locations'));
  end if;
end
$$;

create function app.webhook_flush() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v app.webhook_outbox;
  v_data jsonb;
  v_count integer;
begin
  delete from app.webhook_outbox where id = new.id returning * into v;
  if not found then
    return null;
  end if;
  v_data := v.data;
  if v.kind = 'location' then
    select count(*), coalesce(jsonb_agg(item order by item ->> 'code' nulls last, item ->> 'id'), '[]')
    into v_count, v_data
    from (
      select jsonb_build_object(
        'id', x ->> 'id',
        'code', (array_agg(x ->> 'code' order by n desc))[1],
        'name', (array_agg(x ->> 'name' order by n desc))[1],
        'status', (array_agg(x ->> 'status' order by n desc))[1],
        'action', case
          when bool_or(x ->> 'action' = 'delete') then 'delete'
          when bool_or(x ->> 'action' = 'insert') then 'insert'
          else 'update' end
      ) as item
      from jsonb_array_elements(v.data -> 'locations') with ordinality as e(x, n)
      group by x ->> 'id'
    ) as merged;
    v_data := jsonb_build_object('source', coalesce(v.data ->> 'source', 'admin'),
      'count', v_count,
      'locations', (select coalesce(jsonb_agg(value), '[]') from (
        select value from jsonb_array_elements(v_data) with ordinality as e(value, n)
        where n <= 1000) as capped),
      'truncated', v_count > 1000);
  end if;

  insert into public.webhook_deliveries (id, webhook_id, event, venue_id, payload)
  select d.id, w.id, v.event, v.venue_id,
    jsonb_build_object('id', d.id, 'type', v.event, 'createdAt', now(), 'venueId', v.venue_id,
      'data', v_data)
  from public.webhooks w
  cross join lateral (select gen_random_uuid() as id where w.id is not null) as d
  where w.active and v.kind = any(w.events)
    and (w.venue_ids is null or v.venue_id = any(w.venue_ids));
  if found then
    perform app.webhook_kick();
  end if;
  return null;
end
$$;

create constraint trigger webhook_outbox_flush
  after insert on app.webhook_outbox
  deferrable initially deferred
  for each row execute function app.webhook_flush();

create function app.webhook_location_touched(p_location_id uuid, p_action text) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v public.locations;
begin
  if current_setting('app.webhook_location_batch', true) = 'on' then
    return;
  end if;
  select * into v from public.locations where id = p_location_id;
  if not found then
    return;
  end if;
  perform app.webhook_emit(v.venue_id, 'location', 'location.changed',
    jsonb_build_object('locations', jsonb_build_array(jsonb_build_object(
      'id', v.id, 'code', v.code, 'name', v.name, 'status', v.status, 'action', p_action))),
    'location');
end
$$;

create function app.webhook_on_location() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if current_setting('app.webhook_location_batch', true) = 'on' then
    return null;
  end if;
  if tg_op = 'DELETE' then
    perform app.webhook_emit(old.venue_id, 'location', 'location.changed',
      jsonb_build_object('locations', jsonb_build_array(jsonb_build_object(
        'id', old.id, 'code', old.code, 'name', old.name, 'status', old.status,
        'action', 'delete'))),
      'location');
  else
    perform app.webhook_location_touched(new.id, lower(tg_op));
  end if;
  return null;
end
$$;

create trigger locations_webhook after insert or update or delete on public.locations
  for each row execute function app.webhook_on_location();

create function app.webhook_on_location_child() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform app.webhook_location_touched(new.location_id, 'update');
  end if;
  if tg_op in ('DELETE', 'UPDATE') then
    perform app.webhook_location_touched(old.location_id, 'update');
  end if;
  return null;
end
$$;

create trigger opening_hours_webhook after insert or update or delete on public.opening_hours
  for each row execute function app.webhook_on_location_child();
create trigger location_categories_webhook
  after insert or update or delete on public.location_categories
  for each row execute function app.webhook_on_location_child();
create trigger location_units_webhook after insert or update or delete on public.location_units
  for each row execute function app.webhook_on_location_child();

create function app.webhook_on_closure() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v public.closures := case when tg_op = 'DELETE' then old else new end;
  v_closure jsonb;
begin
  if not app.webhook_wanted('closure', v.venue_id) then
    return null;
  end if;
  v_closure := case when tg_op = 'DELETE' then jsonb_build_object(
      'id', old.id, 'reason', old.reason, 'startsAt', old.starts_at, 'endsAt', old.ends_at)
    else app.api_closure_json(new.id) end;
  perform app.webhook_emit(v.venue_id, 'closure', case tg_op
      when 'INSERT' then 'closure.created' when 'UPDATE' then 'closure.updated'
      else 'closure.deleted' end,
    jsonb_build_object('closure', v_closure), null);
  return null;
end
$$;

create trigger closures_webhook after insert or update or delete on public.closures
  for each row execute function app.webhook_on_closure();

create function app.webhook_on_publication() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform app.webhook_emit(new.venue_id, 'publish',
    case when new.origin = 'rollback' then 'publish.rollback' else 'publish.completed' end,
    jsonb_build_object('version', new.version, 'origin', new.origin,
      'sourceVersion', new.source_version, 'publishedAt', new.published_at, 'notes', new.notes),
    null);
  return null;
end
$$;

create trigger publications_webhook after insert on public.publications
  for each row execute function app.webhook_on_publication();

-- ---------------------------------------------------------------------
-- 6. Kelola webhook (Super Admin)
-- ---------------------------------------------------------------------
create function public.create_webhook(
  p_name text, p_url text, p_events text[], p_venue_ids uuid[] default null
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_secret text := app.webhook_new_secret();
  v_events text[];
  v_venues uuid[];
  v_id uuid;
begin
  if not app.is_super_admin_writer() then
    raise exception 'Hanya Super Admin yang bisa mengelola webhook.' using errcode = '42501';
  end if;
  perform app.check_webhook_input(p_name, p_url, p_events);
  select array_agg(distinct e order by e) into v_events from unnest(p_events) as e;
  v_venues := app.check_venue_list(p_venue_ids);
  insert into public.webhooks (name, url, secret, events, venue_ids, created_by)
  values (trim(p_name), trim(p_url), v_secret, v_events, v_venues, app.current_user_id())
  returning id into v_id;
  perform app.log_event('webhook_created', 'webhook', v_id, jsonb_build_object(
    'name', trim(p_name), 'url', trim(p_url), 'events', v_events, 'venue_ids', v_venues));
  return jsonb_build_object('id', v_id, 'secret', v_secret);
end
$$;

create function public.update_webhook(
  p_id uuid, p_name text, p_url text, p_events text[], p_venue_ids uuid[], p_active boolean
) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_events text[];
  v_venues uuid[];
begin
  if not app.is_super_admin_writer() then
    raise exception 'Hanya Super Admin yang bisa mengelola webhook.' using errcode = '42501';
  end if;
  perform app.check_webhook_input(p_name, p_url, p_events);
  select array_agg(distinct e order by e) into v_events from unnest(p_events) as e;
  v_venues := app.check_venue_list(p_venue_ids);
  update public.webhooks
  set name = trim(p_name), url = trim(p_url), events = v_events, venue_ids = v_venues,
      active = coalesce(p_active, active)
  where id = p_id;
  if not found then
    raise exception 'Webhook tidak ditemukan.' using errcode = 'IM404';
  end if;
  perform app.log_event('webhook_updated', 'webhook', p_id, jsonb_build_object(
    'name', trim(p_name), 'url', trim(p_url), 'events', v_events, 'venue_ids', v_venues,
    'active', p_active));
end
$$;

create function public.delete_webhook(p_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if not app.has_role(array['super_admin']::public.app_role[]) then
    raise exception 'Hanya Super Admin yang bisa mengelola webhook.' using errcode = '42501';
  end if;
  delete from public.webhooks where id = p_id returning name into v_name;
  if v_name is null then
    raise exception 'Webhook tidak ditemukan.' using errcode = 'IM404';
  end if;
  perform app.log_event('webhook_deleted', 'webhook', p_id, jsonb_build_object('name', v_name));
end
$$;

create function public.rotate_webhook_secret(p_id uuid) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_secret text := app.webhook_new_secret();
  v_name text;
begin
  if not app.is_super_admin_writer() then
    raise exception 'Hanya Super Admin yang bisa mengelola webhook.' using errcode = '42501';
  end if;
  update public.webhooks set secret = v_secret where id = p_id returning name into v_name;
  if v_name is null then
    raise exception 'Webhook tidak ditemukan.' using errcode = 'IM404';
  end if;
  perform app.log_event('webhook_secret_rotated', 'webhook', p_id,
    jsonb_build_object('name', v_name));
  return v_secret;
end
$$;

create function public.ping_webhook(p_id uuid) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  if not app.is_super_admin_writer() then
    raise exception 'Hanya Super Admin yang bisa mengelola webhook.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.webhooks where id = p_id and active) then
    raise exception 'Webhook tidak ditemukan atau nonaktif.' using errcode = 'IM404';
  end if;
  insert into public.webhook_deliveries (id, webhook_id, event, payload)
  values (v_id, p_id, 'ping', jsonb_build_object('id', v_id, 'type', 'ping',
    'createdAt', now(), 'venueId', null, 'data', jsonb_build_object(
      'message', 'Uji webhook dari PanduArah.')));
  perform app.webhook_kick();
  return v_id;
end
$$;

create function public.redeliver_webhook(p_delivery_id uuid) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not app.is_super_admin_writer() then
    raise exception 'Hanya Super Admin yang bisa mengelola webhook.' using errcode = '42501';
  end if;
  update public.webhook_deliveries
  set status = 'pending', attempts = 0, next_attempt_at = now(), error = null
  where id = p_delivery_id and status in ('failed', 'delivered', 'retrying');
  if not found then
    raise exception 'Pengiriman tidak ditemukan atau sedang dikirim.' using errcode = 'IM409';
  end if;
  perform app.webhook_kick();
end
$$;

-- ---------------------------------------------------------------------
-- 7. Hak eksekusi
-- ---------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.api_authenticate(text)',
    'public.api_venues(uuid)',
    'public.api_locations(uuid, uuid, text)',
    'public.api_categories(uuid, uuid)',
    'public.api_upsert_locations(uuid, uuid, jsonb)',
    'public.api_closures(uuid, uuid)',
    'public.api_create_closures(uuid, uuid, jsonb)',
    'public.api_end_closure(uuid, uuid, uuid)',
    'public.webhook_dispatch_authorized(text)',
    'public.webhook_claim(integer)',
    'public.webhook_record(uuid, integer, text, integer)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
  foreach f in array array[
    'public.create_webhook(text, text, text[], uuid[])',
    'public.update_webhook(uuid, text, text, text[], uuid[], boolean)',
    'public.delete_webhook(uuid)',
    'public.rotate_webhook_secret(uuid)',
    'public.ping_webhook(uuid)',
    'public.redeliver_webhook(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  foreach f in array array[
    'app.api_key_check(uuid, uuid, text)',
    'app.webhook_kick()',
    'app.webhook_tick()',
    'app.webhook_emit(uuid, text, text, jsonb, text)',
    'app.webhook_location_touched(uuid, text)',
    'app.webhook_wanted(text, uuid)',
    'app.check_venue_list(uuid[])'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end
$$;

create function public.webhook_tick() returns void
language sql security definer
set search_path = ''
as $$ select app.webhook_tick() $$;
revoke execute on function public.webhook_tick() from public, anon, authenticated;
grant execute on function public.webhook_tick() to service_role;

select cron.schedule('webhook-retry', '* * * * *', 'select app.webhook_tick()');
select cron.schedule('webhook-retention', '53 3 * * *', $$
  delete from public.webhook_deliveries
  where (status = 'delivered' and created_at < now() - interval '30 days')
     or (status = 'failed' and created_at < now() - interval '90 days')
$$);
