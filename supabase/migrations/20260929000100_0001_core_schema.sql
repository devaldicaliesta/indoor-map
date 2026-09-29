-- =====================================================================
-- 0001_core_schema.sql
-- Indoor Map & Navigation — skema inti MVP
-- =====================================================================

-- Ekstensi di skema `extensions`, bukan public: tabel spatial_ref_sys milik PostGIS
-- tidak bisa diberi RLS, jadi tidak boleh terbuka lewat REST API di skema public.
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists app;

-- ---------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------
create type public.app_role as enum ('super_admin', 'admin', 'editor', 'operator', 'viewer');
create type public.venue_type as enum ('hospital', 'campus', 'office', 'airport_station', 'factory_warehouse', 'shopping_center', 'custom');
create type public.feature_kind as enum (
  'unit', 'corridor', 'wall', 'door', 'elevator', 'escalator', 'stairs',
  'exit', 'non_walkable', 'outdoor_area', 'facility', 'landmark'
);
create type public.unit_status as enum ('occupied', 'vacant', 'renovation');
create type public.floor_plan_format as enum ('png', 'jpg', 'pdf', 'dwg', 'dxf');
create type public.node_role as enum ('path', 'entrance', 'origin', 'info_point', 'connector');
create type public.connector_kind as enum ('elevator', 'escalator', 'stairs', 'building_door');
create type public.escalator_direction as enum ('up', 'down', 'both');
create type public.instruction_action as enum (
  'start', 'straight', 'turn_left', 'turn_right', 'slight_left', 'slight_right',
  'elevator_up', 'elevator_down', 'escalator_up', 'escalator_down', 'stairs_up', 'stairs_down',
  'exit_building', 'enter_building', 'arrive'
);
create type public.location_status as enum ('active', 'coming_soon', 'inactive_temporary', 'inactive_permanent');
create type public.field_type as enum ('text', 'number', 'select', 'opening_hours', 'image', 'link');
create type public.display_mode as enum ('2d', '3d');
create type public.language_code as enum ('id', 'en');
create type public.publication_origin as enum ('publish', 'rollback');
create type public.license_status as enum ('active', 'grace', 'expired', 'revoked');
create type public.license_source as enum ('online', 'manual');

-- ---------------------------------------------------------------------
-- Pengguna dan fungsi otorisasi
-- ---------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.app_role not null default 'viewer',
  is_active boolean not null default true,
  failed_login_count integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function app.current_user_id() returns uuid
language sql stable
as $$ select auth.uid() $$;

create or replace function app.user_role() returns public.app_role
language sql stable security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles
  where user_id = app.current_user_id() and is_active
$$;

create or replace function app.has_role(allowed public.app_role[]) returns boolean
language sql stable
as $$ select coalesce(app.user_role() = any (allowed), false) $$;

create or replace function app.can_read() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin', 'admin', 'editor', 'operator', 'viewer']::public.app_role[]) $$;

create or replace function app.can_edit() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin', 'admin', 'editor']::public.app_role[]) $$;

create or replace function app.can_manage() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin', 'admin']::public.app_role[]) $$;

create or replace function app.can_manage_closures() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin', 'admin', 'operator']::public.app_role[]) $$;

create or replace function app.is_super_admin() returns boolean
language sql stable
as $$ select app.has_role(array['super_admin']::public.app_role[]) $$;

create or replace function app.touch_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- ---------------------------------------------------------------------
-- Instalasi, pengaturan sistem, lisensi, audit
-- ---------------------------------------------------------------------
create table public.installation (
  id boolean primary key default true check (id),
  instance_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
insert into public.installation (id) values (true);

create table public.system_settings (
  id boolean primary key default true check (id),
  public_visitor_url text,
  smtp_host text,
  smtp_port integer check (smtp_port between 1 and 65535),
  smtp_username text,
  smtp_from text,
  default_timezone text not null default 'Asia/Jakarta',
  default_language public.language_code not null default 'id',
  updated_at timestamptz not null default now()
);
insert into public.system_settings (id) values (true);

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  license_id text not null,
  payload jsonb not null,
  signature text not null,
  status public.license_status not null,
  source public.license_source not null,
  is_current boolean not null default true,
  activated_at timestamptz not null default now(),
  last_checkin_at timestamptz,
  last_seen_at timestamptz
);
create unique index licenses_one_current on public.licenses ((true)) where is_current;

create table public.audit_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  user_id uuid,
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb not null default '{}'
);
create index audit_events_occurred_idx on public.audit_events (occurred_at desc);

create or replace function app.log_event(p_action text, p_entity text, p_entity_id uuid, p_details jsonb default '{}')
returns void
language sql security definer
set search_path = public, pg_temp
as $$
  insert into public.audit_events (user_id, action, entity, entity_id, details)
  values (app.current_user_id(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'))
$$;

-- ---------------------------------------------------------------------
-- Struktur venue
-- ---------------------------------------------------------------------
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  address text,
  center geometry(Point, 4326),
  logo_path text,
  timezone text not null default 'Asia/Jakarta',
  venue_type public.venue_type not null default 'custom',
  default_building_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name text not null,
  code text not null,
  footprint geometry(Polygon, 4326),
  default_floor_id uuid,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, code),
  unique (id, venue_id)
);

alter table public.venues
  add constraint venues_default_building_fk
  foreign key (default_building_id) references public.buildings (id) on delete set null;

create table public.floors (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  building_id uuid,
  is_outdoor boolean not null default false,
  name text not null,
  level integer not null default 0,
  height_m numeric(6, 2) not null default 4 check (height_m > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint floors_outdoor_has_no_building check (is_outdoor = (building_id is null)),
  constraint floors_building_same_venue
    foreign key (building_id, venue_id) references public.buildings (id, venue_id) on delete cascade
);
create unique index floors_one_outdoor_per_venue on public.floors (venue_id) where is_outdoor;
create index floors_building_idx on public.floors (building_id);

alter table public.buildings
  add constraint buildings_default_floor_fk
  foreign key (default_floor_id) references public.floors (id) on delete set null;

create table public.floor_plans (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.floors (id) on delete cascade,
  source_path text not null,
  source_format public.floor_plan_format not null,
  raster_path text,
  pdf_page integer check (pdf_page is null or pdf_page > 0),
  cad_layers text[] not null default '{}',
  corners jsonb,
  opacity numeric(3, 2) not null default 0.6 check (opacity between 0 and 1),
  is_active boolean not null default true,
  uploaded_by uuid references public.profiles (user_id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index floor_plans_one_active on public.floor_plans (floor_id) where is_active;

-- ---------------------------------------------------------------------
-- Peta
-- ---------------------------------------------------------------------
create table public.facility_types (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name text not null,
  icon_path text,
  is_safety boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, name)
);

create table public.features (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  floor_id uuid not null references public.floors (id) on delete cascade,
  kind public.feature_kind not null,
  geom geometry(Geometry, 4326) not null,
  name text,
  height_m numeric(6, 2) check (height_m is null or height_m >= 0),
  color text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  unit_code text,
  area_m2 numeric(10, 2) check (area_m2 is null or area_m2 >= 0),
  unit_status public.unit_status,
  facility_type_id uuid references public.facility_types (id) on delete restrict,
  props jsonb not null default '{}',
  created_by uuid references public.profiles (user_id) on delete set null,
  updated_by uuid references public.profiles (user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint features_unit_fields check ((kind = 'unit') = (unit_code is not null)),
  constraint features_facility_type check ((kind = 'facility') = (facility_type_id is not null))
);
create unique index features_unit_code_unique on public.features (venue_id, lower(unit_code)) where unit_code is not null;
create index features_floor_idx on public.features (floor_id);
create index features_geom_idx on public.features using gist (geom);

create table public.display_settings (
  venue_id uuid primary key references public.venues (id) on delete cascade,
  default_mode public.display_mode not null default '2d',
  heights jsonb not null default '{"unit": 4, "wall": 5, "corridor": 0, "outdoor_area": 0}',
  colors jsonb not null default '{}',
  camera jsonb,
  branding jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Navigasi
-- ---------------------------------------------------------------------
create table public.nav_nodes (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  floor_id uuid not null references public.floors (id) on delete cascade,
  geom geometry(Point, 4326) not null,
  role public.node_role not null default 'path',
  feature_id uuid references public.features (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index nav_nodes_floor_idx on public.nav_nodes (floor_id);
create index nav_nodes_geom_idx on public.nav_nodes using gist (geom);

create table public.nav_edges (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  floor_id uuid not null references public.floors (id) on delete cascade,
  from_node_id uuid not null references public.nav_nodes (id) on delete cascade,
  to_node_id uuid not null references public.nav_nodes (id) on delete cascade,
  length_m numeric(10, 2) not null check (length_m >= 0),
  is_accessible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nav_edges_not_loop check (from_node_id <> to_node_id)
);
create unique index nav_edges_unique_pair
  on public.nav_edges (least(from_node_id, to_node_id), greatest(from_node_id, to_node_id));
create index nav_edges_floor_idx on public.nav_edges (floor_id);

create or replace function app.check_edge_same_floor() returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.nav_nodes n
    where n.id in (new.from_node_id, new.to_node_id) and n.floor_id <> new.floor_id
  ) then
    raise exception 'edge % menghubungkan node di lantai berbeda; gunakan konektor', new.id
      using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create table public.connectors (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  kind public.connector_kind not null,
  name text not null,
  direction public.escalator_direction,
  is_accessible boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connectors_direction_only_escalator check ((kind = 'escalator') = (direction is not null))
);

create table public.connector_stops (
  connector_id uuid not null references public.connectors (id) on delete cascade,
  floor_id uuid not null references public.floors (id) on delete cascade,
  node_id uuid not null references public.nav_nodes (id) on delete cascade,
  primary key (connector_id, floor_id)
);

create table public.closures (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  feature_id uuid references public.features (id) on delete cascade,
  edge_id uuid references public.nav_edges (id) on delete cascade,
  connector_id uuid references public.connectors (id) on delete cascade,
  reason text not null check (length(trim(reason)) > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles (user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint closures_one_target check (num_nonnulls(feature_id, edge_id, connector_id) = 1),
  constraint closures_valid_period check (ends_at is null or ends_at > starts_at)
);
create index closures_venue_period_idx on public.closures (venue_id, starts_at, ends_at);

create table public.instruction_templates (
  venue_id uuid not null references public.venues (id) on delete cascade,
  action public.instruction_action not null,
  text_id text not null,
  text_en text not null default '',
  primary key (venue_id, action)
);

-- ---------------------------------------------------------------------
-- Lokasi
-- ---------------------------------------------------------------------
create table public.location_types (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name text not null,
  icon text,
  color text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, name)
);

create table public.field_definitions (
  id uuid primary key default gen_random_uuid(),
  location_type_id uuid not null references public.location_types (id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_]*$'),
  label text not null,
  field_type public.field_type not null,
  options jsonb not null default '[]',
  is_required boolean not null default false,
  is_visible boolean not null default true,
  is_searchable boolean not null default false,
  sort_order integer not null default 0,
  unique (location_type_id, key)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  location_type_id uuid not null references public.location_types (id) on delete cascade,
  name text not null,
  icon text,
  sort_order integer not null default 0,
  unique (location_type_id, name)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  code text,
  location_type_id uuid not null references public.location_types (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  description text,
  logo_path text,
  photo_paths text[] not null default '{}',
  status public.location_status not null default 'active',
  opening_date date,
  custom_fields jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_coming_soon_has_date check (status <> 'coming_soon' or opening_date is not null)
);
create unique index locations_code_unique on public.locations (venue_id, lower(code)) where code is not null;

create table public.location_categories (
  location_id uuid not null references public.locations (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (location_id, category_id)
);

create table public.location_units (
  location_id uuid not null references public.locations (id) on delete cascade,
  feature_id uuid not null references public.features (id) on delete cascade,
  is_primary boolean not null default false,
  primary key (location_id, feature_id)
);

create or replace function app.check_unit_single_location() returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.location_units lu
    join public.locations l on l.id = lu.location_id
    where lu.feature_id = new.feature_id
      and lu.location_id <> new.location_id
      and l.status <> 'inactive_permanent'
  ) then
    raise exception 'unit % sudah dipakai lokasi lain yang masih aktif', new.feature_id
      using errcode = 'unique_violation';
  end if;
  return new;
end
$$;

create or replace function app.release_units_on_permanent_close() returns trigger
language plpgsql
as $$
begin
  if new.status = 'inactive_permanent' and old.status <> 'inactive_permanent' then
    update public.features f
    set unit_status = 'vacant'
    from public.location_units lu
    where lu.location_id = new.id and f.id = lu.feature_id;
  end if;
  return new;
end
$$;

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  weekday smallint check (weekday between 1 and 7),
  special_date date,
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  constraint opening_hours_day_or_date check (num_nonnulls(weekday, special_date) = 1),
  constraint opening_hours_times check (is_closed or (opens_at is not null and closes_at is not null))
);
create index opening_hours_location_idx on public.opening_hours (location_id);

create table public.search_aliases (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  location_id uuid references public.locations (id) on delete cascade,
  category_id uuid references public.categories (id) on delete cascade,
  facility_type_id uuid references public.facility_types (id) on delete cascade,
  keyword text not null check (length(trim(keyword)) > 0),
  constraint search_aliases_one_target check (num_nonnulls(location_id, category_id, facility_type_id) = 1)
);

-- ---------------------------------------------------------------------
-- Titik asal, publish, kunci edit
-- ---------------------------------------------------------------------
create table public.origin_points (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  floor_id uuid not null references public.floors (id) on delete cascade,
  name text not null,
  geom geometry(Point, 4326) not null,
  heading_deg numeric(5, 1) not null default 0 check (heading_deg >= 0 and heading_deg < 360),
  node_id uuid references public.nav_nodes (id) on delete set null,
  public_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.info_points (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  floor_id uuid not null references public.floors (id) on delete cascade,
  code text not null,
  name text not null,
  geom geometry(Point, 4326) not null,
  heading_deg numeric(5, 1) not null default 0 check (heading_deg >= 0 and heading_deg < 360),
  default_mode public.display_mode not null default '2d',
  force_2d boolean not null default false,
  default_language public.language_code not null default 'id',
  idle_seconds integer not null default 60 check (idle_seconds between 15 and 600),
  node_id uuid references public.nav_nodes (id) on delete set null,
  last_heartbeat_at timestamptz,
  loaded_version integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, code)
);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  version integer not null check (version > 0),
  snapshot_path text not null,
  notes text,
  origin public.publication_origin not null default 'publish',
  source_version integer,
  is_active boolean not null default false,
  published_by uuid references public.profiles (user_id) on delete set null,
  published_at timestamptz not null default now(),
  unique (venue_id, version)
);
create unique index publications_one_active on public.publications (venue_id) where is_active;

create table public.edit_locks (
  floor_id uuid primary key references public.floors (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Venue baru: Area Luar, pengaturan tampilan, tipe lokasi bawaan, instruksi bawaan
-- ---------------------------------------------------------------------
create or replace function app.on_venue_created() returns trigger
language plpgsql
as $$
begin
  insert into public.floors (venue_id, is_outdoor, name, level)
  values (new.id, true, 'Area Luar', 0);

  insert into public.display_settings (venue_id) values (new.id);

  insert into public.location_types (venue_id, name, icon) values (new.id, 'Lokasi', 'map-pin');

  insert into public.instruction_templates (venue_id, action, text_id, text_en) values
    (new.id, 'start',          'Mulai dari {origin}',            'Start at {origin}'),
    (new.id, 'straight',       'Jalan lurus {distance} m',       'Go straight for {distance} m'),
    (new.id, 'turn_left',      'Belok kiri',                     'Turn left'),
    (new.id, 'turn_right',     'Belok kanan',                    'Turn right'),
    (new.id, 'slight_left',    'Agak ke kiri',                   'Bear left'),
    (new.id, 'slight_right',   'Agak ke kanan',                  'Bear right'),
    (new.id, 'elevator_up',    'Naik lift ke {floor}',           'Take the elevator up to {floor}'),
    (new.id, 'elevator_down',  'Turun lift ke {floor}',          'Take the elevator down to {floor}'),
    (new.id, 'escalator_up',   'Naik eskalator ke {floor}',      'Take the escalator up to {floor}'),
    (new.id, 'escalator_down', 'Turun eskalator ke {floor}',     'Take the escalator down to {floor}'),
    (new.id, 'stairs_up',      'Naik tangga ke {floor}',         'Take the stairs up to {floor}'),
    (new.id, 'stairs_down',    'Turun tangga ke {floor}',        'Take the stairs down to {floor}'),
    (new.id, 'exit_building',  'Keluar dari {building}',         'Exit {building}'),
    (new.id, 'enter_building', 'Masuk ke {building}',            'Enter {building}'),
    (new.id, 'arrive',         'Tiba di {destination}',          'Arrive at {destination}');

  return new;
end
$$;

-- ---------------------------------------------------------------------
-- Trigger
-- ---------------------------------------------------------------------
create trigger venues_on_created after insert on public.venues
  for each row execute function app.on_venue_created();

create trigger nav_edges_same_floor before insert or update on public.nav_edges
  for each row execute function app.check_edge_same_floor();

create trigger location_units_single_location before insert or update on public.location_units
  for each row execute function app.check_unit_single_location();

create trigger locations_release_units after update of status on public.locations
  for each row execute function app.release_units_on_permanent_close();

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'venues', 'buildings', 'floors', 'facility_types', 'features',
    'nav_nodes', 'nav_edges', 'connectors', 'closures', 'location_types',
    'locations', 'origin_points', 'info_points'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function app.touch_updated_at()',
      t || '_touch_updated_at', t
    );
  end loop;
end
$$;

create trigger system_settings_touch_updated_at before update on public.system_settings
  for each row execute function app.touch_updated_at();
create trigger display_settings_touch_updated_at before update on public.display_settings
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
-- Kebijakan RLS memanggil fungsi di skema app, jadi role klien butuh akses ke skema itu.
-- Fungsi bisa dieksekusi PUBLIC secara default; pencatatan audit dibatasi ke pengguna login dan service role.
grant usage on schema app to anon, authenticated, service_role;
revoke execute on function app.log_event(text, text, uuid, jsonb) from public;
grant execute on function app.log_event(text, text, uuid, jsonb) to authenticated, service_role;

do $$
declare
  t text;
begin
  -- Aktifkan RLS di semua tabel publik
  foreach t in array array[
    'profiles', 'installation', 'system_settings', 'licenses', 'audit_events',
    'venues', 'buildings', 'floors', 'floor_plans', 'facility_types', 'features',
    'display_settings', 'nav_nodes', 'nav_edges', 'connectors', 'connector_stops',
    'closures', 'instruction_templates', 'location_types', 'field_definitions',
    'categories', 'locations', 'location_categories', 'location_units',
    'opening_hours', 'search_aliases', 'origin_points', 'info_points',
    'publications', 'edit_locks'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- Konten yang boleh diubah Editor
  foreach t in array array[
    'facility_types', 'features', 'nav_nodes', 'nav_edges', 'connectors', 'connector_stops',
    'location_types', 'field_definitions', 'categories', 'locations', 'location_categories',
    'location_units', 'opening_hours', 'search_aliases', 'origin_points', 'info_points'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (app.can_read())', t || '_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (app.can_edit())', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (app.can_edit()) with check (app.can_edit())', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (app.can_edit())', t || '_delete', t);
  end loop;

  -- Struktur dan pengaturan venue: Admin dan Super Admin
  foreach t in array array['venues', 'buildings', 'floors', 'floor_plans', 'display_settings', 'instruction_templates'] loop
    execute format('create policy %I on public.%I for select to authenticated using (app.can_read())', t || '_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (app.can_manage())', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (app.can_manage()) with check (app.can_manage())', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (app.can_manage())', t || '_delete', t);
  end loop;
end
$$;

-- Penutupan: Operator, Admin, Super Admin menulis; pengunjung membaca yang sedang berlaku
create policy closures_read_staff on public.closures for select to authenticated using (app.can_read());
create policy closures_read_public on public.closures for select to anon
  using (starts_at <= now() and (ends_at is null or ends_at > now()));
create policy closures_insert on public.closures for insert to authenticated with check (app.can_manage_closures());
create policy closures_update on public.closures for update to authenticated
  using (app.can_manage_closures()) with check (app.can_manage_closures());
create policy closures_delete on public.closures for delete to authenticated using (app.can_manage_closures());

-- Publikasi: dibaca staf; versi aktif dibaca pengunjung; ditulis hanya oleh Edge Function (service role)
create policy publications_read_staff on public.publications for select to authenticated using (app.can_read());
create policy publications_read_public on public.publications for select to anon using (is_active);

-- Kunci edit
create policy edit_locks_read on public.edit_locks for select to authenticated using (app.can_read());
create policy edit_locks_insert on public.edit_locks for insert to authenticated
  with check (app.can_edit() and user_id = app.current_user_id());
create policy edit_locks_update on public.edit_locks for update to authenticated
  using (user_id = app.current_user_id()) with check (user_id = app.current_user_id());
create policy edit_locks_delete on public.edit_locks for delete to authenticated
  using (user_id = app.current_user_id() or app.is_super_admin());

-- Profil pengguna
create policy profiles_read on public.profiles for select to authenticated
  using (user_id = app.current_user_id() or app.can_read());
create policy profiles_insert on public.profiles for insert to authenticated with check (app.is_super_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (app.is_super_admin()) with check (app.is_super_admin());
create policy profiles_delete on public.profiles for delete to authenticated using (app.is_super_admin());

-- Sistem, lisensi, audit: Super Admin (lisensi dan audit hanya dibaca; ditulis lewat fungsi/service role)
create policy system_settings_read on public.system_settings for select to authenticated using (app.can_read());
create policy system_settings_update on public.system_settings for update to authenticated
  using (app.is_super_admin()) with check (app.is_super_admin());
create policy installation_read on public.installation for select to authenticated using (app.is_super_admin());
create policy licenses_read on public.licenses for select to authenticated using (app.is_super_admin());
create policy audit_events_read on public.audit_events for select to authenticated using (app.is_super_admin());
