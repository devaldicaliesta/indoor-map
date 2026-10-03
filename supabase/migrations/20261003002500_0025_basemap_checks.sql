-- =====================================================================
-- 0025_basemap_checks.sql — pemeriksaan server untuk peta dasar (temuan review T-319)
-- Isian ini masuk snapshot publik: URL tile wajib https (http hanya localhost) dengan
-- {z}/{x}/{y}, dan atribusi tanpa karakter markup. Edge Function `publish` juga memeriksa ulang.
-- =====================================================================

alter table public.system_settings
  add constraint system_settings_basemap_tile_url_format check (
    basemap_tile_url is null or (
      basemap_tile_url ~ '^(https://|http://(localhost|127\.0\.0\.1)[:/])'
      and strpos(basemap_tile_url, '{z}') > 0
      and strpos(basemap_tile_url, '{x}') > 0
      and strpos(basemap_tile_url, '{y}') > 0
    )
  ),
  add constraint system_settings_basemap_attribution_text check (
    basemap_attribution is null or basemap_attribution !~ '[<>]'
  );
