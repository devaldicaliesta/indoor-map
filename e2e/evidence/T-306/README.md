# T-306 · Alias pencarian — bukti E2E

Spec: `e2e/tests/visitor/verify/T-306-search-aliases.spec.ts` (fixture `fullVenue`; Admin di konteks desktop terpisah, Visitor di HP). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-alias-fasilitas.png) | Radiologi: alias "Rontgen, sinar tembus"; jenis fasilitas Toilet: "WC, kamar kecil"; DB memuat keempatnya |
| [02](02-cari-alias-lokasi.png) | Sebelum publish "sinar tembus" dan "kamar kecil" belum ditemukan; setelah publish "sinar tembus" → Radiologi |
| [03](03-cari-alias-fasilitas.png) | "kamar kecil" → Toilet (Fasilitas · 3 tempat) |
| [04](04-alias-dihapus.png) | Diubah ke "Rontgen, pemindaian" lalu publish: "pemindaian" ditemukan, "sinar tembus" tidak. Semua alias dihapus lalu publish: "rontgen" dan "pemindaian" tidak lagi menemukan Radiologi |

Alias kategori memakai `AliasField` yang sama (dialog kategori); disimpan lewat repository `aliases` yang sama.

## Temuan

Tidak ada.
