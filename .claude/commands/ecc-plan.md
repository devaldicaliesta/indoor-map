---
description: Buat rencana implementasi (kebutuhan, risiko, langkah) lalu TUNGGU persetujuan sebelum menulis kode
argument-hint: T-xxx atau deskripsi fitur
---

Rencanakan: $ARGUMENTS

1. Jalankan agent `planner` dengan permintaan di atas. Bila argumennya nomor task, agent membaca task itu di file rilisnya beserta FR dan kriteria penerimaannya.
2. Tampilkan rencananya: kebutuhan yang dinyatakan ulang, perubahan per lapisan (migrasi, domain, data, map-core/ui, apps), langkah berurutan, strategi test, risiko, dan pertanyaan terbuka.
3. Bila ada keputusan arsitektur atau skema, mintakan pendapat agent `architect` dan sertakan rekomendasinya.
4. **Berhenti dan tunggu persetujuan.** Jangan mengubah file sampai pengguna menjawab "ya", "lanjut", atau memberi perubahan.

Setelah disetujui, lanjutkan dengan `/kerjakan-task` (untuk task playbook) atau `/ecc-tdd`.
