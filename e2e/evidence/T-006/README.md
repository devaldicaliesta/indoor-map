# T-006 · Sistem desain — bukti verifikasi

Spec: `e2e/tests/admin/verify/T-006-design-system.spec.ts` (pemeriksa kontras `e2e/support/contrast.ts`). Hasil: **lulus 3/3** (2026-10-02).
Test case: TC-NFR-07 (kontras AA), TC-NFR-08 (fokus keyboard), TC-NFR-06 sebagian (target sentuh), NFR-USE-01.

| Gambar | Isi |
| --- | --- |
| [01-galeri-ui.png](01-galeri-ui.png) | Galeri `/_ui` lengkap: token, tabel kontras, tipografi, tombol, form, badge, tabel, tab, dialog, skeleton, keadaan kosong |
| [02-fokus-keyboard.png](02-fokus-keyboard.png) | Fokus keyboard pada tombol "Publish": garis `--signal` 2 px + `--ink` 1 px |
| [03-visitor-token.png](03-visitor-token.png) | Visitor: Atkinson Hyperlegible, tombol 44 px |
| [04-ringkasan.png](04-ringkasan.png) | 12 pemeriksaan |

- Kontras dihitung otomatis untuk **setiap teks yang tampil** di `/_ui` dan beranda Visitor (latar efektif dari leluhur, 4,5:1 atau 3:1 untuk teks besar): tidak ada yang gagal.
- Font: IBM Plex Sans/Mono (Admin) dan Atkinson Hyperlegible (Visitor) dimuat dari server app sendiri; tidak ada request ke luar (Google Fonts dll.).
- Bentuk: radius ≤ 8 px (kecuali titik bulat), tanpa gradien, bayangan blur ≤ 12 px; tombol Admin 36 px, Visitor 44 px.
- Tanpa warna hex di komponen `.tsx` (warna lewat token).

## Temuan

- [SEDANG] Galeri `/_ui` memakai istilah industri ("Poli Anak", "Apotek 2") sebagai teks contoh, melanggar aturan CLAUDE.md (istilah industri hanya di data template). **Diperbaiki:** diganti "Ruang Rapat", "Ruang Arsip". Pemindaian ulang `poli|tenant|toko|mall|apotek|pasien|dokter` di kode (di luar template dan test): bersih.
- [RENDAH] Gaya peta mengunci gulir dokumen di Admin, sehingga screenshot satu halaman panjang perlu memperbesar viewport. Tidak memengaruhi pengguna (halaman Admin punya area gulir sendiri). Dicatat.
- [RENDAH] Latar putih raster PDF/DXF/QR (`#ffffff` di `pdf.ts`, `cad.ts`, `qr-download.ts`) dan nilai awal `<input type="color">` memakai hex karena keluarannya berkas gambar/nilai input, bukan gaya UI. Dicatat, tidak diubah.

Tinjauan: code-reviewer — Setuju; security-reviewer — tidak relevan.
