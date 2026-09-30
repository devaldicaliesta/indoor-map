---
description: Tulis atau jalankan test Playwright untuk salah satu dari lima alur utama
argument-hint: "login | gambar-unit | publish | cari-rute | info-point-idle"
---

Test E2E untuk alur: $ARGUMENTS

1. Jalankan agent `e2e-runner`.
2. Pastikan alurnya termasuk lima alur di `docs/06-alur-kerja.md`; alur lain dibuktikan dengan test unit/integrasi atau pemeriksaan browser.
3. Siapkan Supabase lokal (`supabase start`, `pnpm db:reset`) dan aplikasi (`pnpm dev`).
4. Jalankan test, lalu laporkan hasil, durasi, dan trace untuk yang gagal. Test tidak stabil diperbaiki, bukan dilewati.
