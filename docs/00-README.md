# 00 · Panduan Playbook

Playbook ini membawa proyek dari repo kosong sampai produk siap dijual, dalam urutan yang bisa diikuti agen AI satu task demi satu task. Setiap file berdiri sendiri; agen cukup membaca file yang relevan dengan task-nya.

## Isi

| File | Isi | Dibaca saat |
| --- | --- | --- |
| `CLAUDE.md` (root) | Aturan kerja, stack, perintah | Setiap sesi (otomatis) |
| `00-README.md` | Peta playbook ini | Pertama kali |
| `01-produk.md` | Apa yang dibangun, untuk siapa, istilah, role | Sebelum task pertama; saat ragu soal istilah |
| `02-kebutuhan.md` | Indeks semua kebutuhan (FR/NFR) → rilis → task | Saat task menyebut ID FR |
| `03-arsitektur.md` | Struktur paket, aliran data, snapshot, routing, portabilitas | Task yang menyentuh lebih dari satu paket |
| `04-model-data.md` | Entitas, aturan integritas, skema SQL lengkap | Task database atau `packages/data` |
| `05-desain-ui.md` | Arah visual, token, tata letak, larangan | Task yang membuat UI |
| `06-alur-kerja.md` | Siklus task, PR, test, definisi selesai (aturan branch: lihat `07`) | Pertama kali; saat membuka PR |
| `07-aturan-branch.md` | Branch `production`, `main`, `develop`, `feature/<nama>` | Setiap sesi, sebelum commit |
| `10-R0-fondasi.md` | Task T-001 s.d. T-012 | Rilis 0 |
| `11-R1-inti-peta.md` | Task T-101 s.d. T-120 | Rilis 1 |
| `12-R2-navigasi.md` | Task T-201 s.d. T-217 | Rilis 2 |
| ~~`13-R3-operasional.md`~~ | Dihapus; status task R3 tetap di `PROGRESS.md`, spesifikasi T-307 s.d. T-313 ada di riwayat git | Rilis 3 |
| `14-R4-komersial.md` | Task T-401 s.d. T-412 | Rilis 4 |
| `20-F2-fase-2.md` | Daftar fase 2 dan backlog (keputusan pemilik) | Saat merencanakan F2 |
| `21-F2-task.md` | Task T-501 s.d. T-607 dan roadmap rilis F2.1–F2.5 (fase 2) | Fase 2 |
| `23-trial-hosting.md` | PRD, arsitektur, dan task T-611 s.d. T-618 trial ter-hosting (F2-K) | Task F2-K |
| `22-F2-verifikasi-e2e.md` | Alur verifikasi E2E dan uji beban Fase 2, gerbang rilis F2 | Setiap task F2 |
| `16-test-case.md` | Katalog test case QA: fungsi, CRUD, UI/UX, keamanan, NFR; §15 untuk F2 | Sebelum dan selama T-307a; setiap task F2 |
| `15-verifikasi-e2e.md` | T-307a: verifikasi E2E CRUD & UI/UX semua task `review` | Sebelum T-307 |
| `spec/` | Spesifikasi lengkap (FR, user flow, proses bisnis, kriteria penerimaan) — sumber kebenaran perilaku | Saat task menyebut ID FR dan butuh detail |
| `PROGRESS.md` | Status setiap task, pertanyaan terbuka, catatan keputusan | Awal dan akhir setiap sesi |
| `templates/task.md` | Format task baru | Saat menambah task |

## Urutan rilis

| Rilis | Hasil | Gerbang selesai |
| --- | --- | --- |
| R0 Fondasi | Monorepo, tooling, skema database, auth, layout dasar | Login jalan, `pnpm check` hijau di CI |
| R1 Inti peta | Admin menggambar peta multi-gedung; Visitor menjelajah, mencari, melihat detail | Venue contoh bisa digambar dan dijelajah |
| R2 Navigasi | Graf rute, konektor, rute aksesibel, penutupan, QR titik asal, rute di Visitor | Semua skenario uji rute wajib lolos |
| R3 Operasional | Template industri, field kustom, import, validasi, publish berversi, rollback | Siap untuk klien pertama |
| R4 Komersial | Lisensi, kuota, Info Point, branding, paket instalasi | Siap dijual |

Task di rilis berikutnya tidak dimulai sebelum gerbang rilis sebelumnya lolos, kecuali task itu ditandai "boleh paralel".

## Cara memakai dengan agen (Claude Code)

Satu sesi = satu task, di branch fitur task itu atau `develop` (lihat `07-aturan-branch.md`). Task berikutnya T-307a:

```
/kerjakan-task T-307a
```

Perintah itu (didefinisikan di `.claude/commands/kerjakan-task.md`) membuat agen membaca `PROGRESS.md`, task yang diminta, dan dokumen yang dirujuk task, lalu mengerjakan dan menutupnya sesuai `06-alur-kerja.md`.

Tanpa slash command, gunakan:

```
Kerjakan T-307a dari docs/15-verifikasi-e2e.md. Ikuti CLAUDE.md dan docs/07-aturan-branch.md.
Baca hanya dokumen yang dirujuk task. Selesai jika semua kriteria tercentang dan pnpm check hijau.
```

## Pekerjaan manusia vs agen

| Dikerjakan Anda | Dikerjakan agen |
| --- | --- |
| Membuat repo, menyambungkan ke Claude | Menulis kode, migrasi, test |
| `supabase start`, `pnpm install`, `npx shadcn add` bila agen tidak bisa menjalankan Docker | Menjalankan `pnpm check` |
| Memeriksa screenshot di `e2e/evidence/` | Uji E2E Playwright + screenshot, memperbaiki berdasarkan laporan error Anda |
| Review PR `develop` → `main`, rilis `main` → `production` | Memperbarui `PROGRESS.md` |
| Keputusan produk (menjawab "Pertanyaan terbuka") | Mengusulkan opsi beserta dampaknya |

Lingkungan cloud sering tidak bisa menjalankan Docker atau mengakses internet bebas. Jika `supabase start` gagal di sana, agen menulis migrasi dan test untuk paket murni, lalu Anda menjalankan database dan aplikasi di laptop.
