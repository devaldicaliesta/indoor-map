# T-117 · Snapshot minimal — bukti E2E

Spec: `e2e/tests/admin/verify/T-117-snapshot.spec.ts` (fixture `publishedVenue`, versi 1 terbit). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-visitor-sebelum-publish.png) | Lokasi baru "Klinik Kulit Baru" disimpan di draft: Visitor "Tidak ada hasil" |
| [01b](01b-visitor-versi-lama.png) | Lokasi terbit (Radiologi) tetap ditemukan |
| [02](02-admin-publish.png) | Admin → Publish → "Terbitkan (dev)": toast "Versi 2 diterbitkan"; DB versi aktif 2 |
| [03](03-visitor-setelah-publish.png) | Visitor (muat baru) menemukan "Klinik Kulit Baru · Lokasi · Gedung Uji · GF" |

## Temuan

Tidak ada. (Tombol publish masih bernama "Terbitkan (dev)"; alur publish lengkap dengan validasi ada di T-307.)
