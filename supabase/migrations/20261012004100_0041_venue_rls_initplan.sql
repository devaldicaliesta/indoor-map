-- T-611a (perbaikan performa): syarat venue di RLS dievaluasi sekali per pernyataan untuk
-- pengguna akses-semua, bukan sekali per baris.
--
-- Migrasi 0039 menulis `app.can_access_venue(venue_id)` langsung di kebijakan. Karena fungsi itu
-- menerima kolom baris, Postgres menjadikannya SubPlan yang dijalankan untuk SETIAP baris yang
-- dipindai, dan tiap panggilan membaca `profiles` + `venue_members`. Ini mengulang masalah yang
-- dihilangkan migrasi 0037 (satu halaman 100 baris dari tabel Lokasi 2.000 baris: ±430 ms →
-- ±80 ms): integrasi `server-tables` TC-TBL-03 (20 halaman) melewati batas 20 detik.
--
-- Perbaikan: bungkus dengan `case when (select app.all_venues_user()) then true else … end`.
-- `(select …)` tanpa acuan baris menjadi InitPlan yang dievaluasi sekali, dan `case` menjamin
-- cabang kedua tidak dievaluasi bila cabang pertama benar. Jadi:
--   • on-premise (`all_venues = true`): nol kerja per baris — kinerja sama seperti sebelum 0039.
--   • trial (`all_venues = false`): cek keanggotaan berbasis himpunan, dan data trial kecil
--     (batas 1 venue, 100 lokasi).
-- Hasil isolasi tidak berubah; pgTAP `venue_isolation` tetap menjadi buktinya.
--
-- `app.can_access_venue` dan penyelesai parent tetap ada: dipakai guard fungsi RPC (0040),
-- yang hanya dievaluasi sekali per panggilan.

-- ---------------------------------------------------------------------
-- 1. Penanda akses-semua (tanpa argumen → bisa menjadi InitPlan) dan himpunan venue anggota
-- ---------------------------------------------------------------------
create or replace function app.all_venues_user() returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.all_venues from public.profiles p
     where p.user_id = app.current_user_id() and p.is_active),
    false)
$$;

create or replace function app.accessible_venue_ids() returns setof uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select m.venue_id from public.venue_members m where m.user_id = app.current_user_id()
$$;

-- ---------------------------------------------------------------------
-- 2. Tulis ulang kebijakan 0039 dengan bentuk short-circuit
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  -- Predikat venue per cara penjangkauan.
  by_venue text := '(case when (select app.all_venues_user()) then true'
    || ' else venue_id in (select app.accessible_venue_ids()) end)';
  by_floor text := '(case when (select app.all_venues_user()) then true'
    || ' else app.can_access_floor(floor_id) end)';
  by_location text := '(case when (select app.all_venues_user()) then true'
    || ' else app.can_access_location(location_id) end)';
  by_type text := '(case when (select app.all_venues_user()) then true'
    || ' else app.can_access_location_type(location_type_id) end)';
begin
  -- (a) venue_id langsung, boleh diubah Editor
  foreach t in array array[
    'facility_types', 'connectors', 'location_types', 'locations',
    'search_aliases', 'origin_points', 'info_points'
  ] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and %s)', t || '_read', t, by_venue);
    execute format('alter policy %I on public.%I with check (app.can_edit() and %s)', t || '_insert', t, by_venue);
    execute format('alter policy %I on public.%I using (app.can_edit() and %s) with check (app.can_edit() and %s)', t || '_update', t, by_venue, by_venue);
    execute format('alter policy %I on public.%I using (app.can_edit() and %s)', t || '_delete', t, by_venue);
  end loop;

  -- (a2) venue_id langsung, Editor + lantai tidak dikunci orang lain (T-301)
  foreach t in array array['features', 'nav_nodes', 'nav_edges'] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and %s)', t || '_read', t, by_venue);
    execute format('alter policy %I on public.%I with check (app.can_edit() and app.floor_writable(floor_id) and %s)', t || '_insert', t, by_venue);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.floor_writable(floor_id) and %s) with check (app.can_edit() and app.floor_writable(floor_id) and %s)', t || '_update', t, by_venue, by_venue);
    execute format('alter policy %I on public.%I using (app.can_edit() and app.floor_writable(floor_id) and %s)', t || '_delete', t, by_venue);
  end loop;

  -- (b) venue_id langsung, struktur venue (Admin/Super Admin)
  foreach t in array array['buildings', 'floors', 'display_settings', 'instruction_templates'] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and %s)', t || '_read', t, by_venue);
    execute format('alter policy %I on public.%I with check (app.can_manage() and %s)', t || '_insert', t, by_venue);
    execute format('alter policy %I on public.%I using (app.can_manage() and %s) with check (app.can_manage() and %s)', t || '_update', t, by_venue, by_venue);
    execute format('alter policy %I on public.%I using (app.can_manage() and %s)', t || '_delete', t, by_venue);
  end loop;

  -- (c) lewat tipe lokasi (Editor)
  foreach t in array array['field_definitions', 'categories'] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and %s)', t || '_read', t, by_type);
    execute format('alter policy %I on public.%I with check (app.can_edit() and %s)', t || '_insert', t, by_type);
    execute format('alter policy %I on public.%I using (app.can_edit() and %s) with check (app.can_edit() and %s)', t || '_update', t, by_type, by_type);
    execute format('alter policy %I on public.%I using (app.can_edit() and %s)', t || '_delete', t, by_type);
  end loop;

  -- (d) lewat lokasi (Editor)
  foreach t in array array['location_categories', 'location_units', 'opening_hours'] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()) and %s)', t || '_read', t, by_location);
    execute format('alter policy %I on public.%I with check (app.can_edit() and %s)', t || '_insert', t, by_location);
    execute format('alter policy %I on public.%I using (app.can_edit() and %s) with check (app.can_edit() and %s)', t || '_update', t, by_location, by_location);
    execute format('alter policy %I on public.%I using (app.can_edit() and %s)', t || '_delete', t, by_location);
  end loop;

  -- (e) venues: id adalah venue-nya
  execute format('alter policy venues_read on public.venues using ((select app.can_read()) and %s)',
    '(case when (select app.all_venues_user()) then true else id in (select app.accessible_venue_ids()) end)');
  execute format('alter policy venues_insert on public.venues with check (app.can_manage() and %s)',
    '(case when (select app.all_venues_user()) then true else id in (select app.accessible_venue_ids()) end)');
  execute format('alter policy venues_update on public.venues using (app.can_manage() and %s) with check (app.can_manage() and %s)',
    '(case when (select app.all_venues_user()) then true else id in (select app.accessible_venue_ids()) end)',
    '(case when (select app.all_venues_user()) then true else id in (select app.accessible_venue_ids()) end)');
  execute format('alter policy venues_delete on public.venues using (app.can_manage() and %s)',
    '(case when (select app.all_venues_user()) then true else id in (select app.accessible_venue_ids()) end)');

  -- (f) floor_plans dan connector_stops: lewat lantai
  execute format('alter policy floor_plans_read on public.floor_plans using ((select app.can_read()) and %s)', by_floor);
  execute format('alter policy floor_plans_insert on public.floor_plans with check (app.can_manage() and %s)', by_floor);
  execute format('alter policy floor_plans_update on public.floor_plans using (app.can_manage() and %s) with check (app.can_manage() and %s)', by_floor, by_floor);
  execute format('alter policy floor_plans_delete on public.floor_plans using (app.can_manage() and %s)', by_floor);

  execute format('alter policy connector_stops_read on public.connector_stops using ((select app.can_read()) and %s)', by_floor);
  execute format('alter policy connector_stops_insert on public.connector_stops with check (app.can_edit() and %s)', by_floor);
  execute format('alter policy connector_stops_update on public.connector_stops using (app.can_edit() and %s) with check (app.can_edit() and %s)', by_floor, by_floor);
  execute format('alter policy connector_stops_delete on public.connector_stops using (app.can_edit() and %s)', by_floor);

  -- (g) edit_locks: lewat lantai
  execute format('alter policy edit_locks_read on public.edit_locks using ((select app.can_read()) and %s)', by_floor);
  execute format('alter policy edit_locks_insert on public.edit_locks with check (app.can_edit() and user_id = app.current_user_id() and %s)', by_floor);

  -- (h) closures: venue_id langsung (Operator/Admin)
  execute format('alter policy closures_read_staff on public.closures using ((select app.can_read()) and %s)', by_venue);
  execute format('alter policy closures_insert on public.closures with check (app.can_manage_closures() and %s)', by_venue);
  execute format('alter policy closures_update on public.closures using (app.can_manage_closures() and %s) with check (app.can_manage_closures() and %s)', by_venue, by_venue);
  execute format('alter policy closures_delete on public.closures using (app.can_manage_closures() and %s)', by_venue);

  -- (i) publications: baca staf per venue
  execute format('alter policy publications_read_staff on public.publications using ((select app.can_read()) and %s)', by_venue);

  -- (j) venue_members: baca per venue
  execute format('alter policy venue_members_read on public.venue_members using ((select app.can_read()) and %s)', by_venue);
end $$;

-- (k) profiles: pengguna akses-semua tidak membayar pemeriksaan per baris
alter policy profiles_read on public.profiles
  using (
    user_id = (select app.current_user_id())
    or (
      (select app.can_read())
      and (case when (select app.all_venues_user()) then true
                else app.shares_accessible_profile(user_id) end)
    )
  );
