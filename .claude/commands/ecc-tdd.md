---
description: Kerjakan logika dengan test lebih dulu (merah → hijau → rapikan) memakai Vitest, pgTAP, atau test integrasi
argument-hint: perilaku atau fungsi yang dibuat/diperbaiki
---

Kerjakan dengan TDD: $ARGUMENTS

1. Jalankan agent `tdd-guide`.
2. Tentukan lapisan yang tepat: logika bisnis di `packages/domain` atau `packages/routing` (Vitest), aturan hak akses dan trigger di `supabase/tests/` (pgTAP), repository lewat RLS sungguhan di `packages/data/test/integration/`.
3. Tulis test yang gagal lebih dulu dan tunjukkan kegagalannya.
4. Implementasi minimal sampai hijau, lalu rapikan.
5. Tutup dengan `pnpm check`. Untuk pgTAP dan integrasi, jalankan juga `pnpm exec supabase test db` dan `pnpm test:integration` bila Supabase lokal berjalan; bila tidak, sebutkan langkah yang harus dijalankan manusia.
