# T-207 · Editor konektor dan aksesibilitas — bukti E2E

Spec: `e2e/tests/admin/verify/T-207-connectors.spec.ts` (fixture `testVenue` + lantai L1, L2). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [06](06-error-lantai.png) | Lift dengan satu lantai: "Pilih minimal dua lantai." |
| [01](01-form-lift.png) | Lift GF + L1 + L2, nama "Lift Pasien Ümmü"; DB `elevator`, 3 pemberhentian, aksesibel (bawaan) |
| [02](02-form-eskalator.png) | Eskalator tanpa arah ditolak ("Pilih arah eskalator."); setelah arah dipilih, kursi roda tidak tercentang |
| [03](03-dua-konektor.png) | Dua konektor; DB eskalator 2 pemberhentian, ada arah, tidak aksesibel |
| [04](04-lift-dihapus.png) | Lift diubah jadi tidak aksesibel ("Konektor disimpan"), lalu "Hapus dari semua lantai": toast "Konektor dihapus", DB tinggal eskalator |

## Temuan

- **Diperbaiki**: toast "Konektor dihapus" tidak pernah muncul. Callback `onSuccess` per-`mutate` tidak dipanggil karena panel konektor ter-unmount saat node-nya hilang; diganti `mutateAsync` di `connector-panel.tsx`.
