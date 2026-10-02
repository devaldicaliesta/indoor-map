# T-304 · Status dan jam operasional — bukti E2E

Spec: `e2e/tests/admin/verify/T-304-status-hours.spec.ts` (fixture `fullVenue`, zona Asia/Jakarta; Visitor dibuka di konteks HP baru dengan jam palsu per waktu uji). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-jam-operasional.png) | Radiologi: Rabu 08.00–17.00, Sabtu dibuka 08.00–12.00, tanggal khusus 2026-10-14 tutup; DB sama |
| [02](02-segera-buka-tanpa-tanggal.png) | Ruang Tunggu Ümum "Segera buka" tanpa tanggal ditolak; dengan 2026-11-02 tersimpan |
| [03](03-rabu-buka.png) | Visitor Rabu 7 Okt 10.00 WIB: "Buka · tutup 17.00" |
| [04](04-tanggal-khusus-tutup.png) | Rabu 14 Okt 10.00 WIB (tanggal khusus): "Tutup · buka besok 08.00" |
| [05](05-segera-buka.png) | Ruang Tunggu Ümum: "Segera buka · mulai …" |

Label lain yang diperiksa (tanpa gambar): Rabu 18.00 "Tutup · buka besok 08.00", Sabtu 10.00 "Buka · tutup 12.00", Sabtu 13.00 "Tutup · buka Senin 08.00".

## Temuan

- **Diperbaiki (RENDAH)**: isian jam (`type="time"`, lebar `w-28`) memotong teks di browser berformat 12 jam ("04:00 I", ":00 PM"). Lebar menjadi `w-36` di `hours-editor.tsx`.
