-- =====================================================================
-- 0024_basemap_settings.sql — peta dasar opsional (T-319)
-- URL tile XYZ dan atribusinya untuk seluruh instalasi; kosong = tanpa peta dasar (offline).
-- Masuk snapshot saat publish, jadi berlaku di Visitor setelah publish berikutnya.
-- =====================================================================

alter table public.system_settings
  add column basemap_tile_url text check (basemap_tile_url is null or length(basemap_tile_url) <= 500),
  add column basemap_attribution text check (basemap_attribution is null or length(basemap_attribution) <= 200);
