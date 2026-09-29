# 06 · Alur Kerja

Aturan kerja untuk agen dan manusia. Tujuannya: setiap sesi menghasilkan satu perubahan kecil yang teruji, bisa direview dalam 10 menit, dan tidak merusak yang sudah ada.

## Siklus satu task

```
1. Pilih      Ambil task berstatus "siap" teratas di PROGRESS.md (semua dependensinya "selesai").
2. Siapkan    git checkout main && git pull
              git checkout -b task/T-xxx-slug
              Ubah status task di PROGRESS.md menjadi "dikerjakan".
3. Pahami     Baca task. Baca hanya dokumen/berkas yang dirujuk task.
4. Kerjakan   Implementasi + test. Commit kecil-kecil: "T-xxx: ...".
5. Periksa    pnpm check  (typecheck + lint + test) harus hijau.
              Centang setiap kriteria "Selesai jika" beserta buktinya.
6. Tutup      PROGRESS.md: status "review", catatan singkat, keputusan baru (jika ada).
              Push branch, buka PR memakai template.
7. Review     Manusia menjalankan di lokal, mencoba kriteria, merge atau minta perbaikan.
              Setelah merge: status "selesai".
```

Satu sesi agen = satu task. Baris **Untuk** menyebut kebutuhan yang dimiliki task; baris **Mendukung** menyebut kebutuhan yang hanya disiapkan fondasinya (kriteria penerimaannya ada di task pemilik). Jika task ternyata terlalu besar, **pecah** menjadi T-xxxa, T-xxxb di file rilis dan `PROGRESS.md`, kerjakan bagian pertama saja.

## Status task

| Status | Arti |
| --- | --- |
| `siap` | Semua dependensi selesai; boleh dikerjakan |
| `menunggu` | Ada dependensi yang belum selesai |
| `dikerjakan` | Sedang dikerjakan di branch |
| `review` | PR terbuka |
| `selesai` | Sudah di-merge ke `main` |
| `diblokir` | Butuh keputusan; lihat "Pertanyaan terbuka" |

## Definisi selesai

Sebuah task selesai jika **semua** benar:

- [ ] Semua butir "Selesai jika" di task terpenuhi dan bisa ditunjukkan
- [ ] `pnpm check` hijau di CI
- [ ] Logika baru di `packages/domain` atau `packages/routing` punya test
- [ ] Tidak ada `any`, `console.log`, kode mati, atau TODO tanpa nomor task
- [ ] Migrasi baru (jika ada) bisa diterapkan dari nol dengan `supabase db reset`
- [ ] UI mengikuti `05-desain-ui.md`; screenshot dilampirkan di PR
- [ ] Teks UI Visitor lewat i18next (ID dan EN terisi)
- [ ] `PROGRESS.md` diperbarui

## Strategi test

| Lapisan | Alat | Wajib untuk |
| --- | --- | --- |
| Unit | Vitest | Semua fungsi di `domain` dan `routing`; hook data yang punya logika pemetaan |
| Komponen | Vitest + Testing Library | Komponen dengan logika kondisional (form dinamis, filter) |
| Database | SQL test di `supabase/tests/` (pgTAP) | Kebijakan RLS per role dan trigger integritas |
| End-to-end | Playwright | Lima alur saja: login, gambar unit, publish, cari + rute di Visitor, Info Point idle |

Fixture venue contoh (2 gedung, 3 lantai, lift, eskalator naik/turun, tangga, 20 unit) disimpan di `packages/domain/test/fixtures/venue-sample.json` dan dipakai ulang oleh test routing, validasi, dan snapshot.

## Branch, commit, PR

- Branch: `task/T-xxx-slug-singkat`.
- Commit: `T-xxx: kalimat perintah singkat` (Bahasa Indonesia atau Inggris, konsisten per PR).
- PR kecil: target < 400 baris perubahan di luar file generate dan lockfile.
- Satu PR = satu task. Jangan mencampur refactor tak terkait.
- PR memakai `.github/pull_request_template.md`:

```
## Task
T-xxx — judul (FR-...)

## Yang berubah
- …

## Bukti kriteria
- [x] kriteria 1 — cara membuktikan / screenshot
- [x] kriteria 2 — nama test

## Catatan
Dependency baru, keputusan, atau hal yang perlu diperhatikan reviewer.
```

## CI (GitHub Actions)

Dijalankan di setiap PR dan push ke `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm check` (Turborepo: `typecheck`, `lint`, `test` di semua paket yang terdampak)
3. `pnpm build`
4. Mulai R1: job terpisah menjalankan `supabase start` + `supabase db reset` + test pgTAP

## Prompt pembuka sesi

Jika tidak memakai slash command:

```
Kerjakan T-xxx dari docs/1x-Rx-*.md.
Ikuti CLAUDE.md dan docs/06-alur-kerja.md.
Baca hanya dokumen yang dirujuk task.
Jangan mengubah file di luar yang disebut task tanpa menjelaskan alasannya.
Selesai jika semua kriteria tercentang, pnpm check hijau, dan PROGRESS.md diperbarui.
```

Untuk melaporkan bug ke agen:

```
T-xxx gagal di kriteria "<kutip kriteria>".
Langkah: 1) … 2) … 3) …
Hasil: <apa yang terlihat, pesan error lengkap>
Harapan: <apa yang seharusnya>
```

## Efisiensi sesi agen

- Mulai sesi baru untuk setiap task; sesi panjang membuat konteks mahal dan agen kehilangan fokus.
- Arahkan agen ke file dan dokumen spesifik; hindari "pelajari seluruh repo".
- Scaffold dengan CLI (`pnpm create vite`, `npx shadcn add`, `supabase init`, `supabase gen types`), bukan ditulis tangan oleh agen.
- Model besar untuk desain algoritma (routing, editor, validasi publish) dan bug sulit; model menengah untuk sisanya.
- Jika agen dua kali gagal di hal yang sama, hentikan, perjelas task, dan mulai sesi baru.

## Keputusan dan pertanyaan

- Keputusan kecil yang dibuat agen selama task dicatat di `PROGRESS.md` → "Catatan keputusan" (tanggal, task, keputusan, alasan).
- Keputusan besar (mengubah arsitektur, skema, atau perilaku produk) **tidak diputuskan agen**: tulis di "Pertanyaan terbuka" dengan 2–3 opsi dan rekomendasi, lalu hentikan task.
- Saat rilis ditutup, keputusan penting dipindah ke tabel ADR di `03-arsitektur.md`.

## Menutup rilis

1. Semua task rilis berstatus `selesai`.
2. Jalankan skenario gerbang rilis (ada di bagian atas setiap file rilis) secara manual di lokal.
3. Tag git: `r0`, `r1`, … dan catat ringkasan di `PROGRESS.md`.
4. Pindahkan keputusan penting ke ADR.
