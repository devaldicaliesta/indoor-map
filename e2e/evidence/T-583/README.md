# T-583 · Playlist promosi di Info Point — bukti E2E

Spec: `e2e/tests/visitor/f2/T-583-info-point-playlist.spec.ts` (proyek `visitor`, Info Point potret
1080 × 1920) dan `e2e/tests/admin/f2/T-583-playlist-settings.spec.ts` (proyek `admin`). Hasil:
**lulus** di CI E2E PR #120 (run 43795984460, 2026-11-16). Test case: TC-EVT-09, 10.

| Gambar | Langkah |
| --- | --- |
| [01](01-playlist-slide-1.png) | Info Point idle: slide layar penuh "Pameran Alat Medis" (gambar, jenis, waktu, lokasi, QR detail) |
| [02](02-playlist-slide-2.png) | Slide berikutnya "Promo Apotek" setelah durasi slide |
| [03](03-sentuh-rute-ke-event.png) | Sentuhan pada event berlokasi: rute dari Info Point Lobi ke Radiologi dan QR "Lanjutkan di HP" |
| [04](04-sentuh-buka-event.png) | Sentuhan pada promo tanpa lokasi: detail event terbuka |
| [05](05-offline-tetap-tampil.png) | Jaringan diputus: slide yang sudah dimuat tetap tampil, penanda "Offline" |
| [06](06-admin-pengaturan-playlist.png) | Admin (Editor): playlist dinyalakan, durasi per slide 4–60 detik, "Event tertentu" |

Catatan pemeriksaan gambar: di [06](06-admin-pengaturan-playlist.png) nilai durasi sudah 6 (sah),
tetapi pesan "Durasi per slide 4–60 detik." dari nilai sebelumnya masih tampil. Perlu dicek apakah
pesan galat seharusnya hilang begitu nilai diperbaiki.

| ID | Hasil |
| --- | --- |
| TC-EVT-09 | Lulus (E) |
| TC-EVT-10 | Lulus (E) |
