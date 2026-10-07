# T-502 · Komponen tabel: cari, filter, pagination — bukti E2E

Spec: `e2e/tests/admin/f2/T-502-data-table.spec.ts` (project `admin`, 1440 × 900, galeri `/_ui` →
"Tabel data", 137 ruang contoh dev-only). Hasil: **4 lulus** (Supabase lokal, 2026-10-07).
Test case: TC-TBL-04, 05, 06 (E); TC-TBL-03, 05, 08, 09 juga dibuktikan di lapisan U/D/I.

| Gambar | Langkah | Test case |
| --- | --- | --- |
| [01](01-tabel-berisi.png) | DataTable berisi 137 baris: kolom cari, filter Status (banyak pilihan), Lantai (satu pilihan), Diperbarui (rentang tanggal), "1–25 dari 137", nomor halaman | – |
| [02](02-filter-banyak-pilihan.png) | Menu centang tetap terbuka: Aktif + Segera buka dicentang, tombol menjadi "Status: Aktif +1" | TC-TBL-04 |
| [03](03-cari-filter-halaman-2.png) | Cari "ruang" + status + rentang 1–30 Sep, 10 baris per halaman, halaman 2: "11–20 dari 26", filter aktif sebagai chip | TC-TBL-04 |
| [04](04-setelah-muat-ulang.png) | Muat ulang: kata kunci, filter, ukuran 10, dan halaman 2 dipulihkan dari URL; baris sama | TC-TBL-04 |
| [05](05-url-disalin-ke-tab-baru.png) | URL disalin ke tab baru: keadaan dan baris sama | TC-TBL-04 |
| [06](06-url-rusak-dinormalisasi.png) | `?page=999&size=7&status=bogus,active&lantai=XX&diperbarui=2026-02-30..2026-13-01` → URL ditulis ulang menjadi `?status=active&page=2` (halaman terakhir), ukuran 25, tanpa galat halaman | TC-TBL-05 |
| [07](07-pencarian-tanpa-hasil.png) | Pencarian tanpa hasil: "Tidak ada ruang yang cocok." dengan tombol "Hapus filter" (kembali ke 137 baris) | TC-TBL-06 |
| [08](08-keadaan-memuat.png) | Memuat: kerangka baris sesuai kolom, `aria-busy` | – |
| [09](09-keadaan-galat.png) | Galat: penyebab + "Coba lagi" | – |
| [10](10-keadaan-kosong.png) | Belum ada data: keadaan kosong dengan langkah berikutnya, tanpa pagination | – |
| [11](11-halaman-terakhir-keyboard.png) | Pagination dengan keyboard (Enter pada tombol), halaman terakhir "131–137 dari 137", tombol berikutnya nonaktif | – |

Langkah lain di spec: filter dihapus satu per satu lewat chip (26 → 34 → 69 baris, kembali ke
halaman 1).

Lapisan lain:
- **U** `packages/ui/test/data-table.test.ts` (9): halaman/elipsis, semua halaman 10/25/50/100 tanpa
  baris ganda atau hilang, cari tanpa beda huruf/diakritik, irisan filter, rentang tanggal per zona
  waktu dan dua posisi `[dari, sampai]`.
- **U** `apps/admin/src/hooks/table-url.test.ts` (6): baca/tulis URL, normalisasi URL rusak
  (TC-TBL-05), awalan untuk dua tabel di satu halaman, bolak-balik URL ↔ keadaan (TC-TBL-04).
- **U** `packages/data/test/pagination.test.ts`: `pageRange`, `listPage`, halaman di luar jangkauan
  (PGRST103) kembali kosong dengan total benar.
- **D** `supabase/tests/table_search.test.sql` (10): normalisasi teks, escape `%`/`_`/`\`, filter aksi
  dan tanggal per zona waktu, Admin tidak melihat Log audit lewat fungsi pencarian (RLS).
- **I** `packages/data/test/integration/table-page.test.ts` (5, tabel contoh Log audit):
  TC-TBL-03 (135 baris, semua ukuran halaman, tanpa ganda/hilang), filter gabungan, TC-TBL-08
  (`50%`, `kode_unit`, `O'Brien`, `C:\denah`, `Kafé`, `%`/`_` saja tidak menjadi wildcard),
  TC-TBL-09/TC-SEC-81 (Admin: 0 baris dan total 0, anon ditolak), halaman 99 → kosong dengan total.

| ID | Hasil |
| --- | --- |
| TC-TBL-04 | Lulus |
| TC-TBL-05 | Lulus |
| TC-TBL-06 | Lulus |

Temuan:
- [SEDANG] Rentang tanggal tertukar: nilai kosong di posisi "dari" dibuang sehingga "sampai"
  bergeser menjadi "dari", dan dua perubahan cepat bisa memakai nilai lama (terlihat saat E2E
  mengisi dua tanggal berturut-turut). Diperbaiki: nilai rentang tetap dua posisi, isian tanggal
  disimpan lokal, dan `setFilter` menerima fungsi dari nilai terbaru (dipakai juga menu centang).
  Unit test regresi ditambahkan.
- [RENDAH] Format isian tanggal mengikuti bahasa browser (Chromium uji berbahasa Inggris →
  mm/dd/yyyy); di browser berbahasa Indonesia tampil dd/mm/yyyy. Tidak diubah.

Tinjauan: code-reviewer (lihat PR); security-reviewer: fungsi pencarian `security invoker` (RLS
tetap berlaku untuk baris dan total), dicabut dari anon, kata kunci dikirim sebagai parameter RPC
(bukan disusun ke filter PostgREST) dan di-escape sebelum `LIKE`.
