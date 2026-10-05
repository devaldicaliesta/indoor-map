-- Keadaan check-in milik instalasi (public.installation, 0029), bukan per lisensi; kolom lama
-- di licenses tidak pernah diisi dan bisa disalahbaca sebagai "belum pernah check-in".
-- Keputusan pemilik 2026-10-05 (pertanyaan terbuka T-403, opsi A).
alter table public.licenses
  drop column last_checkin_at,
  drop column last_seen_at;
