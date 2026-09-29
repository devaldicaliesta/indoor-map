-- =====================================================================
-- 0005_public_assets_storage.sql — bucket Storage aset publik (T-101)
-- Logo venue (dan nanti logo/foto lokasi, ikon fasilitas) dibaca publik oleh
-- Visitor. NFR-SEC-04: tipe file diperiksa dan maksimal 5 MB per gambar. SVG tidak
-- diizinkan karena bisa membawa skrip. Bucket denah (floor-plans) dibuat di T-105.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-assets', 'public-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Logo venue: public-assets/venues/{venue_id}/…, hanya Admin dan Super Admin.
create policy public_assets_venues_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'venues' and app.can_manage());
create policy public_assets_venues_update on storage.objects for update to authenticated
  using (bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'venues' and app.can_manage())
  with check (bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'venues' and app.can_manage());
create policy public_assets_venues_delete on storage.objects for delete to authenticated
  using (bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'venues' and app.can_manage());
