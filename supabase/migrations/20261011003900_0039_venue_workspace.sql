-- T-611a: Ruang kerja per venue — isolasi data lewat RLS.
--
-- Menambah dimensi venue pada otorisasi TANPA mengubah perilaku on-premise:
-- `profiles.all_venues` default true, sehingga `app.can_access_venue` selalu benar untuk
-- pengguna lama dan semua test yang ada tetap hijau. Pengguna trial (`all_venues = false`)
-- hanya bisa membaca/menulis venue tempat ia terdaftar di `venue_members`.
--
-- Lingkup T-611a: kebijakan RLS tabel ber-venue + profil. Jalur bypass RLS, yaitu fungsi
-- RPC `security definer` (publish, save_location, kunci edit, template, impor, alias, konektor,
-- kuota), dijaga terpisah di T-611c; Edge Function `admin-users` dan menu Admin di T-611b.

-- ---------------------------------------------------------------------
-- 1. Keanggotaan venue dan penanda akses global
-- ---------------------------------------------------------------------
alter table public.profiles
  add column all_venues boolean not null default true;

comment on column public.profiles.all_venues is
  'true: akses semua venue (on-premise, default). false: hanya venue di venue_members (pengguna trial).';

create table public.venue_members (
  venue_id uuid not null references public.venues (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (venue_id, user_id)
);
create index venue_members_user_idx on public.venue_members (user_id);

-- ---------------------------------------------------------------------
-- 2. Fungsi akses venue (security definer: baca profiles/parent tanpa terhalang RLS,
--    sekaligus mencegah rekursi kebijakan)
-- ---------------------------------------------------------------------
create or replace function app.can_access_venue(p_venue_id uuid) returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select coalesce(
      (select all_venues from public.profiles
       where user_id = app.current_user_id() and is_active),
      false)
    or exists (
      select 1 from public.venue_members m
      where m.venue_id = p_venue_id and m.user_id = app.current_user_id());
$$;

create or replace function app.can_access_floor(p_floor_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select app.can_access_venue((select venue_id from public.floors where id = p_floor_id)) $$;

create or replace function app.can_access_location(p_location_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select app.can_access_venue((select venue_id from public.locations where id = p_location_id)) $$;

create or replace function app.can_access_location_type(p_type_id uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$ select app.can_access_venue((select venue_id from public.location_types where id = p_type_id)) $$;

-- Apakah target profil berbagi venue dengan pengguna ini (atau pengguna ini akses-semua).
create or replace function app.shares_accessible_profile(p_user uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce(
      (select all_venues from public.profiles
       where user_id = app.current_user_id() and is_active),
      false)
    or exists (
      select 1 from public.venue_members a
      join public.venue_members b on a.venue_id = b.venue_id
      where a.user_id = app.current_user_id() and b.user_id = p_user);
$$;

-- ---------------------------------------------------------------------
-- 3. RLS keanggotaan venue: dibaca staf yang boleh melihat venue itu; ditulis hanya lewat
--    fungsi/service role (provisioning trial T-614, pengelolaan anggota T-611b).
-- ---------------------------------------------------------------------
alter table public.venue_members enable row level security;
create policy venue_members_read on public.venue_members for select to authenticated
  using ((select app.can_read()) and app.can_access_venue(venue_id));

-- ---------------------------------------------------------------------
-- 4. Tambah syarat venue ke kebijakan RLS tabel ber-venue.
--    Read: InitPlan `(select app.can_read())` dipertahankan (0037); cek venue per baris.
--    Write: role + (floor_writable bila ada) + cek venue.
-- ---------------------------------------------------------------------

-- (a) venue_id langsung, boleh diubah Editor (tanpa kunci lantai)
do $$ declare t text; begin
  foreach t in array array[
    'facility_types', 'connectors', 'location_types', 'locations',
    'search_aliases', 'origin_points', 'info_points'
  ] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and app.can_access_venue(venue_id))', t || '_read', t);
    execute format('alter policy %I on public.%I with check (app.can_edit() and app.can_access_venue(venue_id))', t || '_insert', t);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.can_access_venue(venue_id)) with check (app.can_edit() and app.can_access_venue(venue_id))', t || '_update', t);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.can_access_venue(venue_id))', t || '_delete', t);
  end loop;
end $$;

-- (a2) venue_id langsung, Editor + lantai tidak dikunci orang lain (T-301)
do $$ declare t text; begin
  foreach t in array array['features', 'nav_nodes', 'nav_edges'] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and app.can_access_venue(venue_id))', t || '_read', t);
    execute format('alter policy %I on public.%I with check (app.can_edit() and app.floor_writable(floor_id) and app.can_access_venue(venue_id))', t || '_insert', t);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.floor_writable(floor_id) and app.can_access_venue(venue_id)) with check (app.can_edit() and app.floor_writable(floor_id) and app.can_access_venue(venue_id))', t || '_update', t);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.floor_writable(floor_id) and app.can_access_venue(venue_id))', t || '_delete', t);
  end loop;
end $$;

-- (b) venue_id langsung, struktur venue (Admin/Super Admin)
do $$ declare t text; begin
  foreach t in array array['buildings', 'floors', 'display_settings', 'instruction_templates'] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and app.can_access_venue(venue_id))', t || '_read', t);
    execute format('alter policy %I on public.%I with check (app.can_manage() and app.can_access_venue(venue_id))', t || '_insert', t);
    execute format('alter policy %I on public.%I using (app.can_manage() and app.can_access_venue(venue_id)) with check (app.can_manage() and app.can_access_venue(venue_id))', t || '_update', t);
    execute format('alter policy %I on public.%I using (app.can_manage() and app.can_access_venue(venue_id))', t || '_delete', t);
  end loop;
end $$;

-- (b2) venues: id adalah venue-nya. Insert hanya untuk pengguna akses-semua (trial tak bisa
--      membuat venue baru, karena can_access_venue(id) pada id baru selalu false bila bukan anggota).
alter policy venues_read on public.venues
  using ((select app.can_read()) and app.can_access_venue(id));
alter policy venues_insert on public.venues
  with check (app.can_manage() and app.can_access_venue(id));
alter policy venues_update on public.venues
  using (app.can_manage() and app.can_access_venue(id)) with check (app.can_manage() and app.can_access_venue(id));
alter policy venues_delete on public.venues
  using (app.can_manage() and app.can_access_venue(id));

-- (b3) floor_plans: lewat lantai
alter policy floor_plans_read on public.floor_plans
  using ((select app.can_read()) and app.can_access_floor(floor_id));
alter policy floor_plans_insert on public.floor_plans
  with check (app.can_manage() and app.can_access_floor(floor_id));
alter policy floor_plans_update on public.floor_plans
  using (app.can_manage() and app.can_access_floor(floor_id)) with check (app.can_manage() and app.can_access_floor(floor_id));
alter policy floor_plans_delete on public.floor_plans
  using (app.can_manage() and app.can_access_floor(floor_id));

-- (c) lewat tipe lokasi (Editor)
do $$ declare t text; begin
  foreach t in array array['field_definitions', 'categories'] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and app.can_access_location_type(location_type_id))', t || '_read', t);
    execute format('alter policy %I on public.%I with check (app.can_edit() and app.can_access_location_type(location_type_id))', t || '_insert', t);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.can_access_location_type(location_type_id)) with check (app.can_edit() and app.can_access_location_type(location_type_id))', t || '_update', t);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.can_access_location_type(location_type_id))', t || '_delete', t);
  end loop;
end $$;

-- (d) lewat lokasi (Editor)
do $$ declare t text; begin
  foreach t in array array['location_categories', 'location_units', 'opening_hours'] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and app.can_access_location(location_id))', t || '_read', t);
    execute format('alter policy %I on public.%I with check (app.can_edit() and app.can_access_location(location_id))', t || '_insert', t);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.can_access_location(location_id)) with check (app.can_edit() and app.can_access_location(location_id))', t || '_update', t);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.can_access_location(location_id))', t || '_delete', t);
  end loop;
end $$;

-- (e) connector_stops: lewat lantai (Editor)
alter policy connector_stops_read on public.connector_stops
  using ((select app.can_read()) and app.can_access_floor(floor_id));
alter policy connector_stops_insert on public.connector_stops
  with check (app.can_edit() and app.can_access_floor(floor_id));
alter policy connector_stops_update on public.connector_stops
  using (app.can_edit() and app.can_access_floor(floor_id)) with check (app.can_edit() and app.can_access_floor(floor_id));
alter policy connector_stops_delete on public.connector_stops
  using (app.can_edit() and app.can_access_floor(floor_id));

-- (f) edit_locks: lewat lantai. Baca + ambil kunci dibatasi venue; lepas kunci tetap aturan
--     diri sendiri / Super Admin (0014) karena kunci hanya milik lantai yang ia akses.
alter policy edit_locks_read on public.edit_locks
  using ((select app.can_read()) and app.can_access_floor(floor_id));
alter policy edit_locks_insert on public.edit_locks
  with check (app.can_edit() and user_id = app.current_user_id() and app.can_access_floor(floor_id));

-- (g) closures: venue_id langsung (Operator/Admin). Baca publik (anon) tak diubah.
alter policy closures_read_staff on public.closures
  using ((select app.can_read()) and app.can_access_venue(venue_id));
alter policy closures_insert on public.closures
  with check (app.can_manage_closures() and app.can_access_venue(venue_id));
alter policy closures_update on public.closures
  using (app.can_manage_closures() and app.can_access_venue(venue_id)) with check (app.can_manage_closures() and app.can_access_venue(venue_id));
alter policy closures_delete on public.closures
  using (app.can_manage_closures() and app.can_access_venue(venue_id));

-- (h) publications: baca staf per venue. Baca publik (anon, is_active) tak diubah;
--     tulis tetap hanya service role (publish).
alter policy publications_read_staff on public.publications
  using ((select app.can_read()) and app.can_access_venue(venue_id));

-- (i) profiles: pengguna trial hanya melihat dirinya dan anggota venue yang sama.
alter policy profiles_read on public.profiles
  using (
    user_id = (select app.current_user_id())
    or ((select app.can_read()) and app.shares_accessible_profile(user_id))
  );
