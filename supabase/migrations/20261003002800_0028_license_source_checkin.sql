-- =====================================================================
-- 0028_license_source_checkin.sql — sumber lisensi "check-in" (T-403)
-- Dipisah dari 0029 yang memakainya: nilai enum baru tidak boleh dipakai dalam transaksi
-- yang sama dengan penambahannya.
-- =====================================================================

alter type public.license_source add value if not exists 'checkin';
