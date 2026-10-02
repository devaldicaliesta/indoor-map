# T-206 · Titik masuk unit/fasilitas — bukti E2E

Spec: `e2e/tests/admin/verify/T-206-entrances.spec.ts` (fixture `testVenue`: dua unit di atas jalur mendatar). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-mode-menyambung.png) | Unit kiri dipilih → "Hubungkan ke jalur": status "Klik jalur untuk menyambung titik masuk …" |
| [02](02-terhubung-manual.png) | Klik jalur: "1 titik masuk terhubung ke jalur."; DB 1 node `entrance` |
| [03](03-saran.png) | Tab Titik masuk: "1 dari 2 … belum terhubung" → "Hubungkan titik masuk" → "Saran (1)" |
| [04](04-semua-terhubung.png) | "Setujui semua": "Semua unit dan fasilitas sudah terhubung ke jalur."; DB 2 titik masuk |
| [05](05-setelah-hapus.png) | Node titik masuk unit kiri dipilih ("Titik masuk") → "Hapus node": DB tinggal 1, yang kiri hilang |

"Pindah" titik masuk = hapus lalu sambung ulang ke titik lain jalur (tidak ada seret node khusus titik masuk); geser node umum diuji di T-205.

## Temuan

Tidak ada.
