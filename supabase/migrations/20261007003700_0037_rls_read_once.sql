-- T-503: kebijakan baca memeriksa role sekali per pernyataan, bukan sekali per baris.
-- `app.can_read()` dan `app.is_super_admin()` memanggil `app.user_role()` (security definer,
-- membaca profiles). Langsung di `using (...)` fungsi itu dievaluasi untuk setiap baris yang
-- dipindai: satu halaman tabel Lokasi berisi 2.000 baris beserta unit, lantai, dan gedungnya
-- memanggilnya puluhan ribu kali (±400 ms). Dibungkus `(select ...)`, Postgres menjadikannya
-- InitPlan yang dievaluasi sekali; hasilnya sama karena role tidak bergantung pada baris.
-- Kebijakan tulis tidak diubah: yang dipindai hanya baris yang diubah.
do $$
declare
  t text;
begin
  foreach t in array array[
    'buildings', 'categories', 'connector_stops', 'connectors', 'display_settings', 'edit_locks',
    'facility_types', 'features', 'field_definitions', 'floor_plans', 'floors', 'info_points',
    'instruction_templates', 'location_categories', 'location_types', 'location_units',
    'locations', 'nav_edges', 'nav_nodes', 'opening_hours', 'origin_points', 'search_aliases',
    'venues'
  ] loop
    execute format('alter policy %I on public.%I using ((select app.can_read()))', t || '_read', t);
  end loop;
  foreach t in array array['audit_events', 'installation', 'licenses', 'system_settings'] loop
    execute format(
      'alter policy %I on public.%I using ((select app.is_super_admin()))', t || '_read', t
    );
  end loop;
end $$;

alter policy closures_read_staff on public.closures using ((select app.can_read()));
alter policy publications_read_staff on public.publications using ((select app.can_read()));
alter policy profiles_read on public.profiles
  using (user_id = (select app.current_user_id()) or (select app.can_read()));
