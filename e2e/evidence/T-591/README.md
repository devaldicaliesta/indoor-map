# T-591 · Analitik penggunaan anonim — bukti E2E

Spec: `e2e/tests/license/f2/T-591-analytics.spec.ts`, proyek `license` (serial). Hasil: **2 lulus**
di CI E2E PR #120 (run 43795984460, 2026-11-16). Test case: TC-OPS-01 s.d. 05, TC-SEC-72.

| Gambar | Langkah |
| --- | --- |
| [01](01-pemberitahuan-privasi.png) | Visitor dari QR titik asal: pemberitahuan privasi dengan Tolak/Oke |
| [02](02-dasbor-analitik.png) | Dasbor Analitik (Super Admin): kunjungan 2, pencarian 3, lokasi dibuka 2, rute 1; pencarian tanpa hasil "zzzqqq"; sumber Info Point dan QR; export CSV dan PDF dicocokkan di spec |
| [03](03-pengunjung-menolak.png) | Pengunjung menolak: "Kirim statistik pemakaian anonim" mati, tidak ada kiriman |
| [04](04-pengaturan-analitik.png) | Pengaturan sistem: analitik dimatikan, teks privasi ID/EN; setelah itu tidak ada kiriman |

| ID | Hasil |
| --- | --- |
| TC-OPS-01 s.d. 05 | Lulus (E) |
| TC-SEC-72 | Lulus (E) |
