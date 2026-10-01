---
description: Tulis atau jalankan test Playwright untuk salah satu dari lima alur utama
argument-hint: "login | gambar-unit | publish | cari-rute | info-point-idle"
---

Test E2E untuk alur: $ARGUMENTS

1. Jalankan agent `e2e-runner` dan ikuti panduannya (`.claude/agents/e2e-runner.md`).
2. Pastikan alurnya termasuk lima alur di `docs/06-alur-kerja.md`; alur lain dibuktikan dengan test unit/integrasi atau pemeriksaan browser.
3. Siapkan Supabase lokal (`supabase start`, `pnpm db:reset`). Server Admin dijalankan otomatis oleh Playwright.
4. Tulis test di `e2e/tests/<aplikasi>/` dengan page object di `e2e/pages/` dan data uji dari fixture.
5. Jalankan `pnpm test:e2e`, lalu cek stabilitas dengan `--repeat-each=5 --retries=0`.
6. Laporkan dengan format laporan di agent: hasil per test, durasi, dan artefak (screenshot, video, trace) untuk yang gagal. Test tidak stabil diperbaiki, bukan dilewati.
