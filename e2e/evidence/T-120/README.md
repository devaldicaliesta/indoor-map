# T-120 · Visitor: bahasa ID/EN — bukti E2E

Spec: `e2e/tests/visitor/verify/T-120-visitor-language.spec.ts` (fixture `fullVenue` terbit). Hasil: **lulus 3 run beruntun** (2026-10-02). Spec lama `tests/visitor/language.spec.ts` (bahasa perangkat EN) juga lulus.

| Gambar | Langkah |
| --- | --- |
| [01](01-detail-id.png) | Detail Radiologi dalam Bahasa Indonesia |
| [02](02-detail-en.png) | Tombol EN: label UI dan status jam ("Closed · opens Monday 08:00", "Directions to here", "Share") berganti tanpa navigasi; tidak ada sisa label Indonesia di kontrol |
| [03](03-tautan-lang-en.png) | Pilihan diingat setelah muat ulang; tautan `?lang=en` membuka bahasa Inggris walau pilihan tersimpan Indonesia |

## Temuan

- [Catatan] Isi data venue (nama tipe "Layanan", nama field "Ekstensi telepon", deskripsi) tetap dalam bahasa saat diisi Admin; Visitor hanya menerjemahkan teks UI. Sesuai cakupan R1 (data satu bahasa).
