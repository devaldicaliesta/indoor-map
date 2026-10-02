# T-205 · Editor graf — bukti E2E

Spec: `e2e/tests/admin/verify/T-205-graph-editor.spec.ts` (fixture `testVenue`, login Editor). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-jalur-digambar.png) | Alat Jalur: tiga titik, klik ganda untuk selesai → DB 3 node, 2 edge; "2 edge jalur" di bilah status |
| [02](02-edge-tidak-aksesibel.png) | Edge dipilih: panjang 35,58 m; "Bisa dilalui kursi roda" dimatikan → garis putus-putus, DB `accessible=false`; "Pisah di tengah" → 4 node, 3 edge |
| [03](03-setelah-hapus.png) | "Hapus node" ujung kanan (edge yang menempel ikut terhapus) → 3 node, 2 edge; "Hapus edge" → 1 edge; tetap setelah muat ulang |

## Temuan

Tidak ada.
