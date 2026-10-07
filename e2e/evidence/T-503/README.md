# T-503 · Tabel di semua halaman Admin — bukti E2E

Spec (project `admin`, 1440 × 900, Supabase lokal, 2026-10-07):
- `e2e/tests/admin/f2/T-503-locations-table.spec.ts` — Lokasi 2.000 baris (venue dibuat
  `createLargeVenue`, dihapus setelah test), sebagai Admin;
- `e2e/tests/admin/f2/T-503-audit-history-tables.spec.ts` — Log audit dan Riwayat publish
  (30 versi terbit venue uji), sebagai Super Admin; total untuk Admin lewat API;
- `e2e/tests/admin/f2/T-503-table-checklist.spec.ts` — daftar periksa 17 tabel (venue uji
  lengkap + dua versi denah, tiga penutupan, satu versi terbit).

Hasil: **3 spec lulus 3 kali berturut-turut** tanpa retry (`--repeat-each=3`) pada kode akhir,
ditambah spec lama yang disesuaikan (T-012, T-211) dan T-502 masing-masing 3 kali berturut-turut.
Suite Admin lengkap pada run pertama: 105 dari 108 lulus. Yang gagal: T-211 (spec masih mencari
bagian "Sedang berlaku"/"Terjadwal" lama; kini satu tabel dengan kolom Status), T-012 (spec
lama memakai filter aksi satu pilihan; sekaligus menemukan bug dua centang cepat, lihat Temuan),
dan `cad-floor-plan` yang sudah gagal sejak T-405 (lisensi dev tanpa `cad_import`, dicatat di
PROGRESS 2026-10-05, di luar T-503).

## Lokasi 2.000 baris (TC-TBL-01 s.d. 08)

| Gambar | Langkah | Test case |
| --- | --- | --- |
| [01](01-lokasi-2000-baris.png) | 2.000 lokasi: "1–25 dari 2.000", filter Status, Kategori, Tipe, Gedung, Lantai, Tautan unit | TC-TBL-01 |
| [02](02-cari-tanpa-aksen.png) | Cari "kafe lumiere" (tanpa aksen) → 125 "Kafé Lumière …"; juga kode lokasi `LK-0042` dan kode unit (1 hasil) | TC-TBL-01 |
| [03](03-filter-gabungan.png) | Status Aktif + Segera buka, Kategori Kopi & Teh, Gedung Utama, Lantai L2: irisan, empat chip filter aktif | TC-TBL-02 |
| [04](04-hapus-satu-filter.png) | Chip Kategori dihapus (irisan melebar); gedung diganti ke Area Luar → filter Lantai ikut kosong | TC-TBL-02 |
| [05](05-halaman-terakhir-100.png) | 100 baris per halaman, halaman 20: "1.901–2.000 dari 2.000", 100 baris tanpa ganda | TC-TBL-03 |
| [06](06-setelah-muat-ulang.png) | `?q=poli&status=active&size=100&page=2` → muat ulang memulihkan semuanya; URL yang sama di tab baru juga | TC-TBL-04 |
| [07](07-url-rusak-dinormalisasi.png) | `?page=999&size=7&status=active,bukan-status&tautan=apa` → halaman terakhir (50), ukuran 25, nilai asing dibuang | TC-TBL-05 |
| [08](08-tanpa-hasil.png) | Tanpa hasil: "Tidak ada lokasi yang cocok." + Hapus filter (kembali 2.000) | TC-TBL-06 |
| [09](09-hapus-baris-terakhir.png) | "kopi senja 11" (11 baris), 10 per halaman, satu-satunya baris di halaman 2 dihapus → pindah ke halaman 1 | TC-TBL-07 |

Juga di spec: `50%`, `o'bakery`, `ruang_laktasi`, dan `\` dicari sebagai teks (TC-TBL-08).

**Waktu jawaban server** per perubahan cari/filter (permintaan `search_locations`, dari
dikirim sampai jawaban selesai), tiga run terakhir:

| Perubahan | Run 1 | Run 2 | Run 3 |
| --- | ---: | ---: | ---: |
| cari "kafe lumiere" | 141 ms | 152 ms | 141 ms |
| cari kode `LK-0042` | 119 ms | 179 ms | 107 ms |
| cari kode unit `GF-U0002` | 130 ms | 103 ms | 121 ms |
| status Aktif + Segera buka | 100 ms | 77 ms | 78 ms |
| kategori Kopi & Teh | 39 ms | 30 ms | 50 ms |
| gedung Gedung Utama | 24 ms | 60 ms | 30 ms |
| lantai L2 | 39 ms | 35 ms | 61 ms |
| hapus filter kategori | 151 ms | 33 ms | 24 ms |

Batas di E2E: median < 500 ms dan setiap perubahan < 1.000 ms, karena worker lain bisa berjalan
bersamaan (mis. 29 publish di spec Log audit). Setiap perubahan < 500 ms dibuktikan berurutan di
lapisan I (`server-tables.test.ts`). Satu run sebelum migrasi 0037 mencatat 650–840 ms (RLS per
baris); sesudahnya halaman 100 baris ±80 ms lewat PostgREST.

## Log audit dan Riwayat publish (server)

| Gambar | Langkah | Test case |
| --- | --- | --- |
| [10](10-log-audit-cari-venue.png) | Cari nama venue → 30 peristiwa Publish, "1–25 dari 30" | TC-TBL-01 |
| [11](11-log-audit-filter-halaman-2.png) | Aksi Publish + Pengguna Super Admin + Tanggal hari ini, halaman 2: "26–30 dari 30" | TC-TBL-02, 03 |
| [12](12-log-audit-muat-ulang.png) | Muat ulang: kata kunci, tiga filter, dan halaman 2 dipulihkan dari URL | TC-TBL-04 |
| [13](13-riwayat-publish.png) | Riwayat versi 30 versi, 10 per halaman | – |
| [14](14-riwayat-publish-cari-halaman-2.png) | Cari "rilis uji 2" (11) + tanggal terbit, halaman 2, setelah muat ulang | TC-TBL-04 |

Juga di spec: Aksi Rollback → keadaan "Tidak ada log audit yang cocok."; tanggal besok → 0;
`v17` → 1. **TC-TBL-09 / TC-SEC-81:** akun Admin memanggil `audit.listPage` dengan kata kunci
yang sama → `{ rows: [], total: 0 }` (bukan 30).

## Daftar periksa 17 tabel (TC-TBL-10)

Setiap tabel diperiksa: `DataTable` (atribut `data-slot`), kolom cari, dan kontrol filter sesuai
kolomnya. Tabel yang diperiksa ditandai garis kuning di gambar.

| Gambar | Tabel | Filter | Data |
| --- | --- | --- | --- |
| [20](20-tabel-venue.png) | Venue | Tipe venue, Zona waktu | klien, URL `v.` |
| [21](21-tabel-gedung.png) | Gedung (+ baris tetap Area Luar) | Footprint | klien, URL `g.` |
| [22](22-tabel-lantai.png) | Lantai (sheet) | Gedung (termasuk "Semua gedung") | klien, memori |
| [23](23-tabel-riwayat-denah.png) | Riwayat denah (dialog) | Format, Diunggah | klien, memori |
| [24](24-tabel-lokasi.png) | Lokasi | Status, Kategori, Tipe, Gedung, Lantai, Tautan unit | **server** |
| [25](25-tabel-pratinjau-impor.png) | Pratinjau impor (sheet) | Hasil | klien, memori |
| [26](26-tabel-kolom-kustom.png) | Tipe lokasi → field (kolom kustom) | Jenis, Sifat | klien, URL `f.` |
| [27](27-tabel-kategori.png) | Kategori | Pemakaian | klien, URL `kat.` |
| [28](28-tabel-jenis-fasilitas.png) | Jenis fasilitas | Keselamatan, Pemakaian | klien, URL |
| [29](29-tabel-instruksi.png) | Template instruksi | Status (diubah/bawaan) | klien, URL |
| [30](30-tabel-log-audit.png) | Log audit | Aksi, Pengguna, Tanggal | **server** |
| [31](31-tabel-penutupan.png) | Penutupan | Status (sedang berlaku/terjadwal/selesai), Berlaku | **server** |
| [32](32-tabel-titik-asal.png) | Titik Asal | Lantai, Jalur | klien, URL |
| [33](33-tabel-info-point.png) | Info Point | Lantai, Mode, Jalur | klien, URL |
| [34](34-tabel-riwayat-publish.png) | Riwayat publish | Terbit | **server** |
| [35](35-tabel-pengguna.png) | Pengguna | Role, Status (aktif/terkunci/nonaktif) | klien, URL |
| [36](36-tabel-lisensi.png) | Kuota lisensi | Status kuota | klien, URL |

## Lapisan lain

- **U** `packages/ui/test/data-table.test.ts` (+5): `tableController` (halaman kembali ke 1,
  pembaruan beruntun membaca nilai terbaru, `setFilters`), `withRangeEnd` (ujung rentang tanggal
  yang melewati ujung lain menggeser, bukan menukar).
- **U** `apps/admin/src/hooks/table-url.test.ts` (+2): antrean URL yang belum dirender.
- **U** `apps/admin/src/features/closures/closure-model.test.ts`: label sasaran tanpa jenis ganda.
- **D** `supabase/tests/table_search_pages.test.sql` (26): `search_locations` (aksen, `%`, `_`,
  kode unit, status, kategori, gedung `outdoor`, gedung + lantai, belum tertaut, irisan),
  `search_closures` (tiga keadaan, kode unit, nama gedung, rentang beririsan),
  `search_publications` (hanya versi terbit, nomor versi, catatan, penerbit, tanggal per zona
  waktu), akun tanpa role → 0, anon ditolak (42501), dan semua kebijakan baca memakai
  `(select app.can_read())`.
- **I** `packages/data/test/integration/server-tables.test.ts` (8, 2.000 lokasi): urutan nama alami, `get` dan `codes`, TC-TBL-01
  (setiap perubahan < 500 ms), 02, 03 (20 halaman × 100 tanpa ganda), 08, 09/TC-SEC-81
  (Viewer semua, akun tanpa role 0, anon ditolak), Penutupan, Riwayat publish.

| ID | Hasil |
| --- | --- |
| TC-TBL-01 | Lulus |
| TC-TBL-02 | Lulus |
| TC-TBL-03 | Lulus |
| TC-TBL-04 | Lulus |
| TC-TBL-05 | Lulus |
| TC-TBL-06 | Lulus |
| TC-TBL-07 | Lulus |
| TC-TBL-08 | Lulus |
| TC-TBL-09 | Lulus |
| TC-TBL-10 | Lulus |
| TC-SEC-81 | Lulus |

## Temuan

- [TINGGI] **Kebijakan RLS dievaluasi per baris.** `app.can_read()` → `app.user_role()`
  (security definer) dipanggil untuk setiap baris yang dipindai, termasuk relasi yang ikut
  dimuat PostgREST; satu halaman Lokasi 2.000 baris 650–840 ms. Diperbaiki migrasi 0037
  (`(select …)` → InitPlan sekali per pernyataan): ±80 ms. Dijaga pgTAP.
- [SEDANG] **Dua perubahan filter cepat saling menimpa.** `setSearchParams(fn)` React Router
  memberi `fn` URL dari render terakhir; centang kedua di menu filter sebelum render
  menghapus centang pertama (terlihat di E2E T-012). Diperbaiki: antrean URL yang sudah ditulis
  menjadi dasar perubahan berikutnya (`useTableState`), dengan unit test.
- [SEDANG] **Rentang tanggal tertukar di depan pengguna.** Mengisi "dari" setelah "sampai"
  membuat normalisasi URL menukar keduanya. Diperbaiki: ujung lain ikut bergeser (`withRangeEnd`).
- [RENDAH] Status penutupan baru berubah "Selesai" pada pembaruan per menit setelah "Akhiri
  sekarang". Diperbaiki: status memakai waktu terbaru antara detik jam dan saat data dimuat.
- [RENDAH] Label sasaran penutupan "Lift Lift 1" bila nama konektor sudah memuat jenisnya.
  Diperbaiki.
- [RENDAH] Urutan nama dari server leksikografis ("… 1, 10, 100"); daftar lama di klien
  memakai urutan alami. Diperbaiki: kolom `locations.name` memakai collation ICU
  `und-u-kn-true` (migrasi 0036).

Tinjauan: lihat PR (code-reviewer dan security-reviewer: fungsi pencarian `security invoker`,
dicabut dari anon, kata kunci dikirim sebagai parameter RPC dan di-escape sebelum `LIKE`;
perubahan kebijakan RLS hanya mengubah waktu evaluasi, bukan syaratnya).
