-- =====================================================================
-- 0023_category_color.sql — warna kategori untuk mewarnai unit di Visitor (T-315)
-- Kosong = unit memakai warna tipe lokasi atau warna bawaan.
-- =====================================================================

alter table public.categories
  add column color text check (color is null or color ~ '^#[0-9a-fA-F]{6}$');
