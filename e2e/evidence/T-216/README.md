# T-216 · Visitor: penutupan live — bukti E2E

Spec: `e2e/tests/visitor/verify/T-216-visitor-live-closures.spec.ts` (fixture `fullVenue` dipublish, Visitor HP). Hasil: **lulus 3 run beruntun** (2026-10-02).

Visitor membaca penutupan setiap 60 detik (dan saat jendela kembali fokus). Test memasang jam palsu Playwright yang tetap berjalan, lalu memajukannya 65 detik setelah perubahan di server; halaman tidak dimuat ulang.

| Gambar | Langkah |
| --- | --- |
| [01](01-rute-lewat-lift.png) | Rute aksesibel GF-B08 → L1-B08 lewat lift |
| [02](02-lift-ditutup-live.png) | Penutupan lift dibuat lewat data client (tanpa publish); setelah satu siklus polling: "Rute ke tujuan ini tertutup sementara." + "Penutupan sementara: Perawatan lift", langkah hilang, lift bercincin merah di peta |
| [03](03-penutupan-berakhir.png) | Penutupan diakhiri: siklus berikutnya rute kembali lewat lift, peringatan hilang |

## Temuan

Tidak ada. Jeda sampai penutupan tampil maksimal ±60 detik (interval polling), sesuai keputusan T-216.
