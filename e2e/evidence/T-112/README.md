# T-112 · Fasilitas dan jenis fasilitas — bukti E2E

Spec: `e2e/tests/admin/verify/T-112-facilities.spec.ts` (fixture `testVenue`, login Admin). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-kosong.png) | Venue tanpa jenis fasilitas: keadaan kosong |
| [02](02-form-ikon-bawaan.png) | "Ruang Laktasi Ümmü" dengan ikon bawaan P3K (nama kosong ditolak lebih dulu) |
| [02b](02b-form-keselamatan-unggah.png) | "APAR & Hidran": ikon PNG diunggah, centang Fasilitas keselamatan, pratinjau ikon di peta |
| [06](06-error-nama-ganda.png) | "ruang laktasi ümmü" ditolak "Nama ini sudah dipakai jenis lain di venue ini." (tanpa membedakan huruf besar/kecil) |
| [03](03-daftar-jenis.png) | Daftar jenis: ikon unggahan berlatar merah (keselamatan), ikon bawaan; DB `isSafety`; ikon unggahan ada di Storage dan termuat sebagai PNG |
| [04](04-fasilitas-di-peta.png) | Editor Peta: alat Titik → Fasilitas → APAR & Hidran, ditaruh di peta; DB 1 fitur `facility` |
| [05](05-masih-dipakai.png) | Hapus jenis yang dipakai: dialog "masih dipakai 1 fasilitas" tanpa tombol hapus; jenis yang tidak dipakai berhasil dihapus |

Juga: ubah nama jenis (toast "Jenis fasilitas disimpan").

## Temuan

- [RENDAH] Ikon unggahan dirender sebagai siluet dari kanal alfa: gambar tanpa latar transparan (mis. logo bulat penuh) menjadi lingkaran polos tanpa gambar. Pratinjau di dialog sudah menunjukkannya, tetapi tidak ada keterangan "gunakan ikon berlatar transparan". Dicatat.
- [RENDAH, aksesibilitas] Dialog "masih dipakai" punya dua tombol bernama "Tutup" (tombol × dan tombol footer).
- [Catatan test] Klik pertama di peta setelah menutup dropdown jenis fasilitas tertelan lapisan dropdown; spec menunggu dropdown tertutup (perilaku Radix, bukan bug aplikasi).
