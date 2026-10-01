-- =====================================================================
-- 0008_facility_icon_storage.sql — ikon unggahan jenis fasilitas (T-112)
-- Path: public-assets/facility-types/{venue_id}/{nama berkas}.png, dibaca publik
-- (Visitor memakainya untuk sprite peta). Ikon SVG dirasterisasi ke PNG di Admin
-- sebelum diunggah, sehingga bucket tetap tanpa SVG (lihat 0005).
-- Hak tulis mengikuti tabel facility_types (konten yang boleh diubah Editor, 0001).
--
-- Storage hanya menghapus/mendaftar objek yang juga lolos policy SELECT; tanpa itu
-- remove() berhasil tanpa menghapus apa pun, sehingga ikon dan logo lama tertinggal.
-- Isi bucket ini memang publik, jadi pengguna Admin boleh membaca metadatanya.
-- =====================================================================

create policy public_assets_read on storage.objects for select to authenticated
  using (bucket_id = 'public-assets' and app.can_read());

create policy public_assets_facility_types_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'facility-types' and app.can_edit()
  );
create policy public_assets_facility_types_update on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'facility-types' and app.can_edit()
  )
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'facility-types' and app.can_edit()
  );
create policy public_assets_facility_types_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'facility-types' and app.can_edit()
  );
