# T-101 · Venue dan multi-venue — bukti E2E

Spec: `e2e/tests/admin/verify/T-101-venues.spec.ts` (data: fixture `variedVenues`, 6 venue bervariasi + Venue Contoh). Hasil: **lulus 3 run beruntun** (2 test, 2026-10-02).
Test case: TC-VEN (CRUD venue lewat wizard, logo, zona waktu, hapus dengan konfirmasi), TC-VEN-07 (keadaan kosong), pindah venue (T-007).

| Gambar | Langkah |
| --- | --- |
| [01](01-daftar-venue.png) | Daftar venue: nama sangat panjang membungkus, kolom Aksi tetap terlihat; zona waktu WIB/WITA/WIT |
| [06](06-error-validasi.png) | Nama kosong dan titik pusat bukan koordinat ditolak dengan pesan per kolom |
| [02](02-form-langkah-1.png) | Langkah 1: nama beraksen dengan `&` dan `'`, alamat, koordinat Makassar, WITA, logo PNG |
| [02b](02b-pilih-tipe.png) | Langkah 2: tipe "Rumah sakit" dengan pratinjau isi template |
| [03](03-tersimpan.png) | Toast "Venue dibuat", venue langsung dipilih, logo tampil (128 px); DB: alamat, WITA, koordinat, logo, tipe lokasi dan jenis fasilitas template tersalin |
| [04](04-diubah.png) | Nama diubah, terbaca setelah muat ulang |
| [05](05-konfirmasi-hapus.png) | Hapus: tombol aktif hanya bila nama diketik persis (huruf kecil ditolak) |
| [05b](05b-dihapus.png) | Venue hilang dari daftar dan database |
| [07](07-gedung-kosong.png) | Venue tanpa gedung (Admin): tab Gedung dengan "Tambah gedung" |

## Temuan

- [SEDANG] **Nama venue panjang mendorong kolom Aksi keluar layar** di 1440 px: tombol "Ubah"/"Hapus" terpotong dan hanya bisa dicapai dengan gulir mendatar. **Diperbaiki** (kolom Nama membungkus, `min-w-48 whitespace-normal`); dijaga cek lebar kontainer tabel.
- [RENDAH] Pesan galat formulir baru hilang saat dikirim ulang, bukan saat kolom diperbaiki (perilaku sama di formulir lain). Dicatat.
- [Catatan test] Venue `variedVenues` dari run yang dihentikan paksa tertinggal di daftar (fixture tidak sempat membersihkan); hilang saat `pnpm db:reset`.

Tinjauan code-reviewer (T-101–T-106): Perlu perbaikan → **diperbaiki**: keadaan kosong kini memeriksa "Belum ada gedung" (sebelumnya hanya tombol yang selalu ada); T-103 urutan level dikunci `[2, 1, 0, -1]` dan default dicek pada gedung uji; T-104 perkecil, kembali ke tampilan awal, dan kompas kini punya asersi nyata; T-105 aktivasi JPG menunggu riwayat dan DB; T-106 regex rotasi ketat.
