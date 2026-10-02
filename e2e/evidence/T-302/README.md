# T-302 · Tipe venue dan template industri — bukti E2E

Spec: `e2e/tests/admin/verify/T-302-venue-templates.spec.ts` (role Super Admin; venue dibuat lalu dihapus di akhir test). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-pratinjau-kampus.png) | Wizard langkah 2: tipe "Kampus", pratinjau tipe lokasi, field, kategori, jenis fasilitas, jumlah kata pencarian awal |
| [02](02-konfirmasi.png) | Langkah 3: "n tipe lokasi, m jenis fasilitas" sesuai template |
| [03](03-venue-baru-terpilih.png) | "Venue dibuat", venue baru jadi venue aktif |

Diperiksa di database terhadap `VENUE_TEMPLATES.campus`: nama tipe lokasi, field tiap tipe (label, jenis, wajib, urutan), kategori, jenis fasilitas, dan kata alias sama persis. Venue kedua dari template yang sama tidak terpengaruh saat jenis fasilitas di venue pertama dihapus (salinan, bukan rujukan). Template Rumah sakit lewat UI diuji di T-101.

## Temuan

Tidak ada.
