-- Peta dasar masuk snapshot publik: URL dan atribusi diperiksa di database (T-319).
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

select lives_ok(
  $$update public.system_settings set basemap_tile_url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    basemap_attribution = '© OpenStreetMap contributors'$$,
  'URL https dengan {z}/{x}/{y} dan atribusi teks diterima'
);
select lives_ok(
  $$update public.system_settings set basemap_tile_url = 'http://localhost:8080/{z}/{x}/{y}.png'$$,
  'http ke localhost diterima untuk server tile lokal'
);
select throws_ok(
  $$update public.system_settings set basemap_tile_url = 'http://tile.contoh.id/{z}/{x}/{y}.png'$$,
  '23514', null, 'http ke host lain ditolak'
);
select throws_ok(
  $$update public.system_settings set basemap_tile_url = 'https://tile.contoh.id/{z}/{x}.png'$$,
  '23514', null, 'URL tanpa {y} ditolak'
);
select throws_ok(
  $$update public.system_settings set basemap_attribution = '<img src=x onerror=alert(1)>'$$,
  '23514', null, 'atribusi bermarkup ditolak'
);

select * from finish();
rollback;
