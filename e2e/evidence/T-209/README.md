# T-209 · Test route — bukti E2E

Spec: `e2e/tests/admin/verify/T-209-test-route.spec.ts` (fixture `fullVenue`). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-rute-lintas-lantai.png) | GF-A01 → L2-B08: lewat tangga, chip lantai GF dan L2, langkah terakhir "Tiba di L2-B08" |
| [02](02-langkah-di-L2.png) | Klik langkah terakhir: pemilih lantai pindah ke L2, "Langkah n dari m"; tombol sebelumnya menandai satu langkah aktif |
| [03](03-kursi-roda-gagal.png) | Mode kursi roda GF → L2: alasan gagal menyebut L2 (lift hanya GF–L1); ke L1-B08 lewat lift |
| [04](04-instruksi-en.png) | Bahasa instruksi EN: langkah berbahasa Inggris ("Arrive …") |

## Temuan

- RENDAH: saat langkah memindah editor ke lantai lain, panel Uji rute sesaat kembali ke kerangka "Memuat…" (isian Dari/Ke dan langkah) sebelum rute tampil lagi. Sesaat, tidak mengubah hasil.
