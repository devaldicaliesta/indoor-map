---
description: Kerjakan satu task dari playbook docs/ sampai siap review
argument-hint: T-xxx
---

Kerjakan task **$ARGUMENTS** dari playbook proyek ini.

1. Baca `docs/PROGRESS.md`. Pastikan $ARGUMENTS berstatus `siap` dan semua dependensinya `selesai`. Jika tidak, berhenti dan jelaskan apa yang kurang.
2. Temukan $ARGUMENTS di file rilisnya (`docs/10-R0-fondasi.md` s.d. `docs/14-R4-komersial.md`) dan baca seluruh isi task itu.
3. Untuk setiap ID FR di baris **Untuk**, cari baris FR dan kriteria penerimaannya di `docs/spec/` (`01-kebutuhan-fungsional.md` / `02-visitor-info-point.md` dan `06-kriteria-penerimaan.md`). Baca hanya dokumen dan file yang dirujuk task tersebut, ditambah `docs/06-alur-kerja.md` bagian "Definisi selesai". Untuk task UI, baca juga `docs/05-desain-ui.md`.
4. Bekerja di branch fitur task itu atau `develop` (lihat `docs/07-aturan-branch.md`). Ubah status task di `docs/PROGRESS.md` menjadi `dikerjakan`.
5. Kerjakan langkah-langkahnya. Tulis test untuk logika di `packages/domain` dan `packages/routing`. Commit kecil dengan format `$ARGUMENTS: ...`.
6. Jalankan `pnpm check` sampai hijau. Jika butuh Docker/Supabase dan tidak tersedia di lingkungan ini, jelaskan langkah yang harus dijalankan manusia.
7. Periksa setiap butir "Selesai jika" dan tuliskan buktinya.
8. Perbarui `docs/PROGRESS.md`: status `review`, catatan singkat, keputusan baru di "Catatan keputusan", pertanyaan di "Pertanyaan terbuka". Tandai task berikutnya yang menjadi `siap`.
9. Push ke branch itu; buka PR hanya bila diminta.

Aturan:
- Jangan mengubah file di luar lingkup task tanpa menjelaskan alasannya di PR.
- Jika task terlalu besar untuk satu sesi, pecah menjadi $ARGUMENTS-a dan $ARGUMENTS-b di file rilis dan `PROGRESS.md`, lalu kerjakan bagian pertama saja.
- Jika menemukan keputusan besar (arsitektur, skema, perilaku produk), tulis opsi dan rekomendasi di "Pertanyaan terbuka", lalu berhenti.
