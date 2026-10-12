-- T-614b: membuat ruang kerja trial dalam SATU transaksi (arch §3.5 `provision_trial`, FR-HT-02,
-- FR-HT-06).
--
-- Edge Function `trial-verify` menyiapkan datanya: venue demo sesuai jenis gedung dibaca seperti
-- publish (`readSource`), dipangkas ke batas trial (`trialSample`), diberi id baru (`withNewIds`),
-- lalu dijadikan baris tabel (`venueRows`) — semuanya fungsi domain yang diuji. Fungsi ini
-- menyisipkan semuanya beserta profil, keanggotaan, dan baris `trials`, atau tidak sama sekali.
--
-- Urutan penting: baris `trials` ditulis SEBELUM data contoh dan anggota, sehingga trigger kuota
-- sudah membaca batas trial (0044) — data contoh yang melebihi batas membatalkan provisioning,
-- bukan menghasilkan trial yang publish-nya terblokir.

-- Menyisipkan baris JSON ke satu tabel `public` dengan kolom dari kunci baris pertama; kolom lain
-- memakai nilai bawaan. Hanya dipanggil `hosting_provision_trial` dengan nama tabel tetap.
create function hosting.insert_rows(p_table text, p_rows jsonb) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_columns text;
begin
  if p_rows is null or jsonb_array_length(p_rows) = 0 then
    return;
  end if;
  select string_agg(quote_ident(k), ', ') into v_columns from jsonb_object_keys(p_rows -> 0) k;
  execute format(
    'insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1)',
    p_table, v_columns, v_columns, p_table)
  using p_rows;
end
$$;
revoke execute on function hosting.insert_rows(text, jsonb) from public;

create function public.hosting_provision_trial(
  p_request_id uuid,
  p_user_id uuid,
  p_venue jsonb,
  p_rows jsonb,
  p_outdoor_placeholder uuid
) returns table (venue_id uuid, slug text, ends_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_request hosting.trial_requests;
  v_venue_id uuid := (p_venue ->> 'id')::uuid;
  v_base text := p_venue ->> 'slug';
  v_slug text;
  v_suffix integer := 1;
  v_outdoor uuid;
  v_rows jsonb;
  v_ends timestamptz := now() + interval '17 days';  -- §1: trial 17 hari, tetap
  v_table text;
begin
  if not app.hosting_mode() then
    raise exception 'Provisioning trial hanya di project ter-hosting (hosting_mode).'
      using errcode = '42501';
  end if;
  select * into v_request from hosting.trial_requests r where r.id = p_request_id for update;
  if not found or v_request.status <> 'active'
     or exists (select 1 from hosting.trials t where t.request_id = p_request_id) then
    raise exception 'Permintaan trial ini tidak menunggu ruang kerja.' using errcode = '22023';
  end if;

  -- Slug unik: nama instansi, lalu -2, -3, … bila sudah dipakai.
  v_slug := v_base;
  while exists (select 1 from public.venues v where v.slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := left(v_base, 50) || '-' || v_suffix;
  end loop;

  insert into public.venues (id, name, slug, venue_type, timezone, center)
  values (
    v_venue_id, p_venue ->> 'name', v_slug, (p_venue ->> 'venueType')::public.venue_type,
    coalesce(p_venue ->> 'timezone', 'Asia/Jakarta'),
    case when p_venue -> 'center' is null or jsonb_typeof(p_venue -> 'center') = 'null' then null
         else extensions.st_geomfromgeojson((p_venue -> 'center')::text) end);

  -- Area Luar dibuat trigger `venues_on_created`; rujukan data contoh ke Area Luar venue demo
  -- sudah diganti penanda oleh Edge Function, di sini diganti id sebenarnya.
  select f.id into v_outdoor from public.floors f where f.venue_id = v_venue_id and f.is_outdoor;
  v_rows := replace(p_rows::text, p_outdoor_placeholder::text, v_outdoor::text)::jsonb;
  -- Tipe lokasi bawaan venue baru ("Lokasi", trigger yang sama) diganti tipe dari data contoh,
  -- yang juga memuat "Lokasi" milik venue demo; venue baru belum punya lokasi.
  delete from public.location_types t where t.venue_id = v_venue_id;

  insert into public.profiles (user_id, full_name, email, role, all_venues)
  values (p_user_id, v_request.name, v_request.email, 'admin', false);
  insert into hosting.trials (venue_id, user_id, request_id, ends_at)
  values (v_venue_id, p_user_id, p_request_id, v_ends);
  insert into public.venue_members (venue_id, user_id) values (v_venue_id, p_user_id);

  foreach v_table in array array[
    'buildings', 'floors', 'facility_types', 'features', 'location_types', 'field_definitions',
    'categories', 'locations', 'location_categories', 'location_units', 'opening_hours',
    'search_aliases', 'nav_nodes', 'nav_edges', 'connectors', 'connector_stops',
    'origin_points', 'info_points'
  ] loop
    perform hosting.insert_rows(v_table, v_rows -> 'tables' -> v_table);
  end loop;

  update public.buildings b set default_floor_id = (d ->> 'default_floor_id')::uuid
  from jsonb_array_elements(v_rows -> 'buildingDefaults') d
  where b.id = (d ->> 'id')::uuid;
  update public.venues v set default_building_id = (v_rows ->> 'defaultBuildingId')::uuid
  where v.id = v_venue_id;
  if jsonb_typeof(v_rows -> 'display') = 'object' then
    update public.display_settings s set
      default_mode = coalesce((v_rows -> 'display' ->> 'default_mode')::public.display_mode,
        s.default_mode),
      heights = coalesce(v_rows -> 'display' -> 'heights', s.heights),
      colors = coalesce(v_rows -> 'display' -> 'colors', s.colors),
      camera = v_rows -> 'display' -> 'camera',
      branding = coalesce(v_rows -> 'display' -> 'branding', s.branding)
    where s.venue_id = v_venue_id;
  end if;

  return query select v_venue_id, v_slug, v_ends;
end
$$;
revoke execute on function public.hosting_provision_trial(uuid, uuid, jsonb, jsonb, uuid)
  from public, anon, authenticated;
grant execute on function public.hosting_provision_trial(uuid, uuid, jsonb, jsonb, uuid)
  to service_role;
