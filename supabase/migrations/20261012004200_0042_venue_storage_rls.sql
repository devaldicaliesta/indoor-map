-- T-611a (lanjutan): isolasi venue untuk Storage (NFR-HT-02 jalur Storage, arch §3.2 dan §3.7).
--
-- Migrasi 0039 hanya menjangkau tabel `public`. Kebijakan `storage.objects` masih memeriksa peran
-- saja (`app.can_read/can_edit/can_manage`), sedangkan pengguna trial berperan `admin` sehingga
-- ketiganya benar. Akibatnya pengguna trial bisa membaca, menulis, dan MENGHAPUS berkas venue
-- lain: denah (`floor-plans`), logo/foto/ikon (`public-assets`), dan snapshot peta terbitan
-- (`snapshots`). Penghapusan snapshot venue lain merusak layanan Visitor venue itu.
--
-- Letak id venue pada path (dibangun di `packages/data`):
--   floor-plans   {venue_id}/{floor_id}/…            → foldername[1]
--   snapshots     {venue_id}/v{n}.json               → foldername[1]
--   public-assets {jenis}/{venue_id}/…               → foldername[2]
--     (`categories`, `facility-types`, `locations`, `venues`)
--
-- Perbandingan dilakukan sebagai teks lewat `app.accessible_venue_keys()`, bukan cast ke uuid,
-- agar path tak terduga menolak dengan aman alih-alih menggagalkan pernyataan. Bentuk
-- `case when (select app.all_venues_user()) …` sama dengan 0041: InitPlan sekali per pernyataan.
--
-- Catatan: bucket `snapshots` dan `public-assets` dibaca publik lewat URL, jadi kebijakan SELECT
-- di sini membatasi pendaftaran/enumerasi oleh staf, bukan kerahasiaan isi berkas (penguncian
-- layanan trial memakai penghapusan `latest.json`, T-615). Yang paling penting di sini adalah
-- kebijakan tulis dan hapus.

create or replace function app.accessible_venue_keys() returns setof text
language sql stable security definer
set search_path = public, pg_temp
as $$
  select m.venue_id::text from public.venue_members m where m.user_id = app.current_user_id()
$$;

do $$
declare
  r record;
  -- Venue pada segmen pertama path (floor-plans, snapshots).
  v1 text := '(case when (select app.all_venues_user()) then true'
    || ' else (storage.foldername(name))[1] in (select app.accessible_venue_keys()) end)';
  -- Venue pada segmen kedua path (public-assets/<jenis>/<venue_id>/…).
  v2 text := '(case when (select app.all_venues_user()) then true'
    || ' else (storage.foldername(name))[2] in (select app.accessible_venue_keys()) end)';
begin
  -- floor-plans: denah per lantai
  execute format(
    'alter policy floor_plans_read on storage.objects using (bucket_id = %L and app.can_read() and %s)',
    'floor-plans', v1);
  execute format(
    'alter policy floor_plans_insert on storage.objects with check (bucket_id = %L and app.can_manage() and %s)',
    'floor-plans', v1);
  execute format(
    'alter policy floor_plans_delete on storage.objects using (bucket_id = %L and app.can_manage() and %s)',
    'floor-plans', v1);

  -- snapshots: hasil publish per venue
  execute format(
    'alter policy snapshots_list on storage.objects using (bucket_id = %L and app.can_manage() and %s)',
    'snapshots', v1);
  execute format(
    'alter policy snapshots_delete on storage.objects using (bucket_id = %L and app.can_manage() and %s)',
    'snapshots', v1);

  -- public-assets: baca staf untuk seluruh bucket
  execute format(
    'alter policy public_assets_read on storage.objects using (bucket_id = %L and app.can_read() and %s)',
    'public-assets', v2);

  -- public-assets: tulis per jenis folder. Nama policy memakai garis bawah, nama folder tanda hubung.
  for r in
    select *
    from (values
      ('categories', 'categories', 'app.can_edit()'),
      ('facility_types', 'facility-types', 'app.can_manage()'),
      ('locations', 'locations', 'app.can_edit()'),
      ('venues', 'venues', 'app.can_manage()')
    ) as t(policy_suffix, folder, role_check)
  loop
    execute format(
      'alter policy %I on storage.objects with check (bucket_id = %L and (storage.foldername(name))[1] = %L and %s and %s)',
      'public_assets_' || r.policy_suffix || '_insert', 'public-assets', r.folder, r.role_check, v2);
    execute format(
      'alter policy %I on storage.objects using (bucket_id = %L and (storage.foldername(name))[1] = %L and %s and %s) with check (bucket_id = %L and (storage.foldername(name))[1] = %L and %s and %s)',
      'public_assets_' || r.policy_suffix || '_update', 'public-assets', r.folder, r.role_check, v2,
      'public-assets', r.folder, r.role_check, v2);
    execute format(
      'alter policy %I on storage.objects using (bucket_id = %L and (storage.foldername(name))[1] = %L and %s and %s)',
      'public_assets_' || r.policy_suffix || '_delete', 'public-assets', r.folder, r.role_check, v2);
  end loop;
end $$;
