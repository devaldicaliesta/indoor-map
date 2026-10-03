# T-315 · Warna kategori dan unit berwarna — bukti E2E

Spec: `e2e/tests/admin/verify/T-315-category-color.spec.ts` (fixture `publishedVenue`, role Admin). Hasil: **lulus 3 run beruntun** (2026-10-03).

| Gambar | Langkah |
| --- | --- |
| [01](01-dialog-warna.png) | Lokasi → Tipe lokasi → kategori "Pemeriksaan" → Ubah: "Warna di peta (opsional)"; "merah" ditolak "Format warna #rrggbb.", `#d2452f` tersimpan (DB) |
| [02](02-visitor-unit-berwarna.png) | Setelah publish: unit Radiologi berisi pastel merah dengan tepi lebih pekat; chip "Pemeriksaan" berlatar warna yang sama (legenda), `rgb(242, 203, 197)` |
| [00](00-mal-demo-sebelum.png) → [03](03-mal-demo-desktop.png) | Mal Demo Sentosa (`pnpm db:seed-demo`) sebelum dan sesudah: unit diwarnai per kategori (13 kategori), chip menjadi legenda |

Urutan warna unit (`unitColors`, domain, 3 test): kategori pertama lokasi → warna tipe lokasi → bawaan; unit kosong dan unit dengan warna sendiri tidak ditimpa. Isi pastel dan tepi dari `categoryUnitColors` (map-core, test). Snapshot lama tanpa `color` kategori tetap terbaca (skema opsional).

## Temuan

- Di HP, gedung yang sangat memanjang (mal 220 × 40 m) tampil kecil di bingkai awal; ditangani di T-317 (kamera awal).
