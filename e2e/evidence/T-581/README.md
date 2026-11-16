# T-581 · Event & promosi: data dan Admin — bukti E2E

Spec: `e2e/tests/admin/f2/T-581-events.spec.ts` (proyek `admin`) dan
`e2e/tests/license/T-581-events-license.spec.ts` (proyek `license`). Hasil: **lulus** di CI E2E
PR #120 (run 43795984460, 2026-11-16). Test case: TC-EVT-01 s.d. 05, 11, TC-SEC-70.

| Gambar | Langkah |
| --- | --- |
| [01](01-validasi.png) | Editor membuat event: durasi lebih dari 1 tahun ditolak ("Durasi event paling lama 1 tahun") |
| [02](02-form-dan-pratinjau.png) | Form lengkap (gambar, lokasi Radiologi, titik peta, tautan) dengan pratinjau kartu; judul `<script>…` dan deskripsi `<img onerror>` tampil sebagai teks |
| [03](03-tabel.png) | "Event disimpan": tabel berstatus Berlangsung, tempat "Radiologi, Titik peta" |
| [04](04-filter-selesai.png) | Filter "Status: Selesai": hanya "Promo Lewat" |
| [05](05-ubah-hapus.png) | Ubah judul menjadi "Seminar Jantung Sehat" dan hapus event lain: "Event diperbarui", "Event dihapus" |
| [06](06-viewer-baca.png) | Viewer: "Mode baca", tanpa tombol tambah/ubah/hapus (TC-SEC-70) |
| [07](07-menu-terkunci.png) | Lisensi tanpa fitur `events`: menu terkunci dengan keterangan "Event & Promo tidak termasuk paket lisensi ini." |
| [08](08-halaman-terkunci.png) | Halaman Event & Promo tanpa fitur: peringatan yang sama; server menolak tulis dan anon tidak membaca (diperiksa di spec) |

| ID | Hasil |
| --- | --- |
| TC-EVT-01 s.d. 05, 11 | Lulus (E) |
| TC-SEC-70 | Lulus (E) |
