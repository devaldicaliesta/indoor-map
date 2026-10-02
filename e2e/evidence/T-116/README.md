# T-116 · Lokasi dasar, kategori, tautan unit — bukti E2E

Spec: `e2e/tests/admin/verify/T-116-locations.spec.ts` (fixture `fullVenue` + 24 lokasi tambahan: semua status, nama sangat panjang, aksen, `&`, `'`, `<`, angka di awal). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-daftar-lokasi.png) | Daftar ±28 lokasi, status campuran, "Belum tertaut" ditandai; nama panjang membungkus, kolom Aksi terlihat |
| [02](02-cari.png) | Cari "rad" → Radiologi + Radioterapi; cari kode "L-07" → IGD |
| [06](06-error-nama.png) | Simpan tanpa nama: "Nama lokasi wajib diisi." |
| [02b](02b-form-terisi.png) | Tipe Layanan, kategori Pemeriksaan, unit GF-A05 dipilih dari saran |
| [03](03-tersimpan.png) | "Lokasi ditambahkan"; baris menampilkan kategori, gedung, lantai, unit; DB unit GF-A05 |
| [04](04-diubah.png) | Nama diubah |
| [05](05-dihapus.png) | Dihapus dari daftar dan DB |

## Temuan

- [SEDANG] **Nama lokasi panjang mendorong kolom Aksi keluar layar** (tombol "Hapus" terpotong di 1440 px), sama dengan T-101. **Diperbaiki** (kolom Nama membungkus); dijaga cek lebar tabel (merah sebelum perbaikan: 50 px meluap).
- [RENDAH] Isian "Tanggal khusus" memakai input tanggal bawaan browser yang menampilkan `mm/dd/yyyy` walaupun UI berbahasa Indonesia (tergantung locale browser).
- [Catatan] Kategori terikat ke tipe lokasi: formulir dengan tipe "Lokasi" menampilkan "Tipe ini belum punya kategori…", kategori Pemeriksaan baru muncul setelah memilih tipe "Layanan". Sesuai desain T-303.

Tinjauan code-reviewer T-107–T-115: Setuju; dua asersi SEDANG diperkuat di commit ini: T-115 kini membuktikan tinggi 12 m dan mode awal 3D lewat snapshot terbit (bukan perbandingan gambar dari kamera berbeda); T-113 tidak lagi mengklaim perpindahan kamera dari beda piksel (kanvas juga berubah karena sorotan).
