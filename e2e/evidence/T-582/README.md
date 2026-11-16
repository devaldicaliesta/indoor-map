# T-582 · Event & promosi di Visitor — bukti E2E

Spec: `e2e/tests/visitor/f2/T-582-visitor-events.spec.ts`, proyek `visitor` (HP 360 × 740). Hasil:
**2 lulus** di CI E2E PR #120 (run 43795984460, 2026-11-16). Test case: TC-EVT-06 s.d. 08.

| Gambar | Langkah |
| --- | --- |
| [01](01-chip-dan-penanda.png) | Chip "Event & Promo (3)" dan penanda event di peta (draf tidak ikut) |
| [02](02-daftar-event.png) | Daftar: Sedang berlangsung dan Segera, kartu dengan gambar, jenis, waktu, lokasi |
| [03](03-detail-event.png) | Detail event Seminar Jantung (Berlangsung) |
| [04](04-lencana-lokasi.png) | Profil Radiologi: "Event di sini · Berlangsung · Seminar Jantung" |
| [05](05-rute-ke-event.png) | "Rute ke sini" dari UJI-GF-002 ke Radiologi, 35 m |
| [06](06-event-selesai-hilang.png) | Jam dimajukan 3 menit: event yang selesai hilang tanpa publish ulang, chip menjadi (2) |
| [07](07-tautan-ev-en.png) | Tautan bagikan `ev=` dibuka di HP lain dalam EN: "Events & Deals", "Live" |
| [08](08-lima-puluh-event.png) | 50 event aktif dimuat setelah peta tampil: "Event & Promo (50)" |

Catatan:
- Di [03](03-detail-event.png) dan [07](07-tautan-ev-en.png) judul event berada di bawah batas
  layar; yang terlihat gambar dan lencana.
- Langkah [07](07-tautan-ev-en.png) (`T-582-visitor-events.spec.ts:176`) gagal intermiten di CI
  setelah merge (#122 percobaan pertama dan push ke `main` 2026-11-16): kartu "Heart Seminar" tidak
  muncul dalam 30 detik di tab EN baru. Kode sama dengan run yang lulus; penyebab belum diketahui
  (lihat Pertanyaan terbuka di `docs/PROGRESS.md`).

| ID | Hasil |
| --- | --- |
| TC-EVT-06, 07 | Lulus (E), intermiten di langkah tautan `ev=` |
| TC-EVT-08 | Lulus (E) |
