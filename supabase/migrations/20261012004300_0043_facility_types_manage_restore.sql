-- T-611a (perbaikan): jenis fasilitas kembali hanya untuk Admin dan Super Admin.
--
-- Migrasi 0039 menambahkan syarat venue dengan `do` loop per golongan peran, dan menaruh
-- `facility_types` di golongan "boleh diubah Editor" mengikuti 0001. Tetapi 0009 sudah
-- memindahkan tabel ini ke golongan Admin/Super Admin (`docs/spec/05-user-flow.md` menaruh
-- jenis fasilitas di menu Pengaturan), sehingga `alter policy` 0039 — dan 0041 yang mengikutinya
-- — menurunkan kembali hak tulisnya ke `app.can_edit()`. Akibatnya Editor bisa menambah,
-- mengubah, dan menghapus jenis fasilitas: naik hak yang tidak diinginkan.
--
-- Terdeteksi oleh `permissions_matrix` (262–264) dan `facility_types` uji 6. Kebijakan Storage
-- untuk ikonnya tidak terpengaruh: 0042 memakai `app.can_manage()` seperti 0009.
--
-- Pelajaran: `alter policy` dalam loop per golongan harus dicocokkan dengan kebijakan yang
-- BERLAKU, bukan dengan golongan di migrasi pembuatnya — pengecualian bisa datang dari
-- migrasi mana pun sesudahnya.

do $$
declare
  -- Predikat venue sama dengan 0041 (InitPlan sekali per pernyataan + short-circuit).
  by_venue text := '(case when (select app.all_venues_user()) then true'
    || ' else venue_id in (select app.accessible_venue_ids()) end)';
begin
  execute format(
    'alter policy facility_types_insert on public.facility_types with check (app.can_manage() and %s)',
    by_venue);
  execute format(
    'alter policy facility_types_update on public.facility_types using (app.can_manage() and %s) with check (app.can_manage() and %s)',
    by_venue, by_venue);
  execute format(
    'alter policy facility_types_delete on public.facility_types using (app.can_manage() and %s)',
    by_venue);
end $$;
