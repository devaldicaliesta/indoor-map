# T-544 · Export peta cetak (PDF dan SVG) — bukti E2E

Spec: `e2e/tests/admin/f2/T-544-print-export.spec.ts`, proyek `admin`. Hasil: **lulus** di CI E2E
PR #120 (run 43795984460, 2026-11-16). Test case: TC-MPX-04.

| Berkas | Langkah |
| --- | --- |
| [01](01-dialog-export.png) | Editor Peta lantai GF → "Export peta": judul terisi otomatis "nama venue — gedung lantai", format PDF/SVG, kertas A3/A4, orientasi lanskap/potret |
| [02](02-denah-a3-lanskap.pdf) | PDF A3 lanskap (MediaBox 1190,55 × 841,89 pt) |
| [03](03-denah-a3-lanskap.svg) | SVG A3 lanskap (420 × 297 mm): judul, label unit, legenda |
| [04](04-pratinjau-a3.png) | Pratinjau berkas A3: judul + subjudul "Denah lantai GF", legenda (koridor, unit, lift, eskalator, tangga, dinding, pintu, fasilitas), arah utara "U", skala 10 m, "Dicetak 16 November 2026 · PanduArah" |
| [05](05-denah-a4-potret.svg) | SVG A4 potret (210 × 297 mm) |

Catatan pemeriksaan gambar: di [01](01-dialog-export.png) graf jalur editor tampak menembus dialog
karena screenshot diambil saat animasi muncul dialog belum selesai; isi dialog tetap terbaca.

| ID | Hasil |
| --- | --- |
| TC-MPX-04 | Lulus (E) |
