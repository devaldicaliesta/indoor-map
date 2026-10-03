# Kunci lisensi DEV

Pasangan kunci ini **hanya untuk pengembangan dan test** (keputusan pemilik T-402). Kunci
publiknya dipakai `packages/domain/src/license.publicKey.ts` di repo, dan lisensi dev di
`supabase/seed.sql` serta `tools/vendor-stub` ditandatangani dengan kunci privat ini.

Kunci privat ini sengaja publik, sehingga siapa pun bisa menerbitkan lisensi yang lolos
verifikasi pada build dev. Build rilis wajib memakai kunci publik vendor dari
`license-cli keygen` (disimpan di luar repo), dan paket instalasi (T-411) menolak build yang
masih memakai `LICENSE_DEV_PUBLIC_KEY`.
