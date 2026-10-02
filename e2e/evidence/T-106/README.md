# T-106 · Georeferensi dan opasitas — bukti E2E

Spec: `e2e/tests/admin/verify/T-106-georeference.spec.ts` (denah PNG diunggah lewat repository ke `testVenue`, login Admin). Hasil: **lulus 3 run beruntun** (2026-10-02).
Test case: kriteria T-106 (geser, ukuran, rotasi, kalibrasi jarak, opasitas, simpan).

| Gambar | Langkah |
| --- | --- |
| [01](01-awal.png) | Halaman "Tempatkan denah", denah belum ditempatkan |
| [02](02-ukuran-rotasi-opasitas.png) | Lebar 80 m (tinggi ikut, proporsi terkunci), rotasi 15°, opasitas 40%; status "Belum disimpan" |
| [03](03-kalibrasi.png) | "Ukur jarak": dua titik di denah, jarak nyata = 2 × terukur |
| [04](04-tersimpan.png) | "Terapkan skala" melipatgandakan lebar (≈ 2×); denah diseret; "Simpan posisi" → "Tersimpan" |

DB: 4 sudut tersimpan dan berubah setelah denah diseret (dibandingkan dengan simpan sebelum menyeret), opasitas 0,4. Setelah muat ulang lebar, rotasi 15°, dan opasitas 40% tetap.

## Temuan

- [RENDAH] Setelah kalibrasi membesarkan denah, kamera tidak menyesuaikan sehingga sudut kuning untuk mengubah ukuran berada di luar layar (gambar 04); pengguna harus memperkecil peta sendiri. Dicatat.
