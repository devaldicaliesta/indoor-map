---
description: Perbaiki pnpm check atau pnpm build yang merah dengan perubahan minimal, satu penyebab per langkah
argument-hint: "[paket atau pesan error]"
---

Perbaiki kegagalan: $ARGUMENTS

1. Jalankan agent `build-error-resolver`.
2. Kumpulkan semua error (`pnpm check`, `pnpm build`), kelompokkan per paket, dan perbaiki penyebab paling hulu lebih dulu.
3. Satu perbaikan per langkah, lalu jalankan ulang pemeriksaan.
4. Tanpa `any`, `@ts-ignore`, melonggarkan konfigurasi, atau melewati test.
5. Berhenti dan laporkan bila error yang sama bertahan setelah tiga percobaan.
