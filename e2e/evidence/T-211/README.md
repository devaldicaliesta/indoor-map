# T-211 · Penutupan dan role Operator — bukti E2E

Spec: `e2e/tests/admin/verify/T-211-closures-operator.spec.ts` (fixture `fullVenue`, role Operator). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-dialog-dampak.png) | Pilih "Lift 1 · GF Gedung Utama" → Tutup sementara: alasan kosong ditolak; dampak "Rute aksesibel ke L1 Gedung Utama tidak tersedia selama penutupan." |
| [02](02-sedang-berlaku.png) | Disimpan: "Sedang berlaku", "Sampai diakhiri"; DB 1 penutupan. Lalu "Ubah waktu selesai" (DB `endsAt` terisi) dan "Akhiri sekarang" (DB 0 penutupan berlaku) |
| [03](03-terjadwal.png) | Eskalator dijadwalkan dua hari lagi → "Terjadwal"; "Batalkan" → "Tidak ada penutupan terjadwal." |
| [04](04-editor-hanya-baca.png) | Operator di Editor Peta: alat Poligon dan Jalur nonaktif, hanya Pilih |

Penolakan di server untuk Operator yang mengubah peta (RLS) sudah diuji di T-009a (matriks role); gaya penutupan di peta Visitor diuji di T-216.

## Temuan

Tidak ada.
