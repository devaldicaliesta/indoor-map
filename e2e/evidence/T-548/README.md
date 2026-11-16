# T-548 · Scan otomatis denah gambar (tahap 1) — bukti E2E

Spec: `e2e/tests/license/T-548-floor-plan-scan.spec.ts`, proyek `license` (serial). Hasil: **2 lulus
di Supabase lokal** dengan `cad-converter` berjalan (PR #109). Di CI spec ini **dilewati** karena
`VITE_CAD_CONVERTER_URL` tidak diatur, sama seperti `cad-floor-plan.spec.ts`. Test case: TC-MPX-08
s.d. 11, 13.

| Gambar | Langkah |
| --- | --- |
| [01](01-hasil-scan.png) | Panel "Scan denah", kepekaan Sedang: 8 ruang dan 18 dinding terdeteksi, semuanya keyakinan tinggi; pratinjau di atas denah; tombol "Impor 26 sebagai draft" |
| [02](02-diimpor-sebagai-draft.png) | Satu ruang tidak dipilih, lalu impor: "25 fitur diimpor sebagai draft" (Unit 7, Dinding 18), status Tersimpan |
| [03](03-impor-diurungkan.png) | Satu kali Urungkan (Ctrl+Z) menghapus seluruh impor: 0 fitur |
| [04](04-tanpa-fitur.png) | Lisensi tanpa `cad_import`: panel Scan terkunci; layanan juga menolak `/scan` (403, diperiksa di spec) |

Catatan pemeriksaan gambar: teks kunci di [04](04-tanpa-fitur.png) masih "Impor denah CAD (DXF)
tidak termasuk paket lisensi ini" karena scan memakai hak `cad_import` yang sama (dicatat di PR #109).

| ID | Hasil |
| --- | --- |
| TC-MPX-08 s.d. 11, 13 | Lulus lokal (E); tidak dijalankan di CI |
