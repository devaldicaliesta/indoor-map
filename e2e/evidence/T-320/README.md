# T-320 · Validasi ulang tampilan dengan data kaya — bukti E2E

Spec: `e2e/tests/visitor/verify/T-320-demo-venues.spec.ts`: tiga venue demo (T-314) dibuat dan diterbitkan di `beforeAll`, dihapus di `afterAll`. Hasil: **lulus 3 run beruntun** (2026-10-03).

| Gambar | Isi |
| --- | --- |
| [mal-01](mal-01-hp-2d.png) | Mal di HP 2D: unit berwarna kategori, penanda POI, lantai memanjang diputar mengisi layar |
| [mal-02](mal-02-hp-3d-l2.png) | Cari "kopi" → Kopi Kenangan Pagi; ganti ke L2; 3D |
| [mal-03](mal-03-hp-rute.png) | Rute Sepatu Jaya (GF) → Dapur Peranakan L2 lewat konektor, garis aliran |
| [mal-04](mal-04-desktop-2d.png), [mal-05](mal-05-desktop-3d.png) | Desktop 2D dan 3D: chip kategori berwarna sebagai legenda |
| [rs-01](rs-01-hp-cari.png) | Rumah sakit: alias "rontgen" → Radiologi; IGD "Buka 24 jam" |
| [rs-02](rs-02-hp-rute-kursi-roda.png) | Rute kursi roda IGD (GF) → kamar rawat L3 lewat lift, tanpa tangga |
| [kampus-01](kampus-01-hp-rute-antar-gedung.png) | Kampus: rute Ruang Dosen 101 (Gedung Rektorat L1) → Kantin A (Gedung Kuliah Bersama GF) lewat Area Luar: "Keluar dari Gedung Rektorat … Masuk ke Gedung Kuliah Bersama" |

## Temuan

- RENDAH: gambar yang diambil segera setelah ganti lantai/mode menangkap label yang masih memudar (animasi `fade` MapLibre), sehingga beberapa nama tampak samar/bertumpuk sesaat. Bukan masalah tampilan akhir.
