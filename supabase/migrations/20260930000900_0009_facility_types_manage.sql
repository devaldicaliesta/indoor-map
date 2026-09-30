-- =====================================================================
-- 0009_facility_types_manage.sql — jenis fasilitas hanya diubah Admin dan
-- Super Admin (T-112, keputusan pertanyaan terbuka 2026-09-30).
-- docs/spec/05-user-flow.md menaruh jenis fasilitas di menu Pengaturan untuk
-- Admin dan Super Admin; 0001 memasukkannya ke konten Editor (app.can_edit).
-- Editor tetap bisa membaca jenis dan menaruh fasilitas di Editor Peta.
-- =====================================================================

drop policy facility_types_insert on public.facility_types;
drop policy facility_types_update on public.facility_types;
drop policy facility_types_delete on public.facility_types;

create policy facility_types_insert on public.facility_types for insert to authenticated
  with check (app.can_manage());
create policy facility_types_update on public.facility_types for update to authenticated
  using (app.can_manage()) with check (app.can_manage());
create policy facility_types_delete on public.facility_types for delete to authenticated
  using (app.can_manage());

-- Ikon unggahan mengikuti hak tabelnya (0008 memakai app.can_edit()).
drop policy public_assets_facility_types_insert on storage.objects;
drop policy public_assets_facility_types_update on storage.objects;
drop policy public_assets_facility_types_delete on storage.objects;

create policy public_assets_facility_types_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'facility-types' and app.can_manage()
  );
create policy public_assets_facility_types_update on storage.objects for update to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'facility-types' and app.can_manage()
  )
  with check (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'facility-types' and app.can_manage()
  );
create policy public_assets_facility_types_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'public-assets' and (storage.foldername(name))[1] = 'facility-types' and app.can_manage()
  );
