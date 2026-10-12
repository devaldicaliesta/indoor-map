-- Keputusan pemilik 2026-10-12: ruang kerja trial berisi salinan venue demo yang UTUH (sama dengan
-- peta di landing dan /v/demo), bukan cuplikan 2 lantai / 60 lokasi.
--
-- Venue demo terbesar (db:seed-demo): 3 gedung (kawasan industri), 6 lantai (perkantoran, industri),
-- 195 lokasi (mal), 3 titik asal (bandara), 2 Info Point (bandara), 147 fitur per lantai (konser).
-- Batas trial dinaikkan agar demo terbesar muat dan pemohon masih bisa menambah datanya sendiri:
--   gedung 1 → 4, lantai 3 → 8, lokasi 100 → 250, Info Point 2 → 3.
-- Batas lain tetap. Kapasitas Supabase Free (NFR-HT-04) tidak terancam: data peta per trial hanya
-- ratusan baris, dan berkas milik venue demo (logo, foto) tidak ikut disalin.
--
-- `trialSample` (packages/domain) memakai angka yang sama; keduanya harus diubah bersama.

create or replace function app.trial_quota() returns jsonb
language sql immutable
as $$
  select jsonb_build_object(
    'venues', 1, 'buildings', 4, 'floors', 8, 'features', 1000,
    'locations', 250, 'originPoints', 10, 'infoPoints', 3, 'users', 2,
    'storageMb', 50, 'maxUploadMb', 5, 'importRows', 100, 'publishPerDay', 10
  )
$$;
