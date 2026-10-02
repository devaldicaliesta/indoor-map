-- Denah DXF (T-313): berkas asli DXF disimpan di bucket floor-plans di samping raster PNG
-- hasil konversi; lebar gambar sebenarnya dari satuan berkas menjadi skala awal georeferensi.
update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'application/pdf', 'image/vnd.dxf']
where id = 'floor-plans';

alter table public.floor_plans
  add column natural_width_m numeric(10, 3)
    check (natural_width_m is null or natural_width_m > 0);

comment on column public.floor_plans.natural_width_m is
  'Lebar gambar sebenarnya (m) menurut satuan berkas CAD; null untuk gambar dan PDF.';
