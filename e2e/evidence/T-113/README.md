# T-113 · Panel daftar fitur — bukti E2E

Spec: `e2e/tests/admin/verify/T-113-feature-list.spec.ts` (fixture `fullVenue`, GF Gedung Utama 39 fitur). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-grup-dibuka.png) | Grup per jenis dengan jumlah; grup Unit dibuka, isi terurut |
| [02](02-cari-jenis.png) | Cari "gf-b0" (huruf kecil) hanya unit GF-B0x; cari "eskalator" menampilkan grup Eskalator 2 |
| [03](03-dipilih-peta-fokus.png) | Klik GF-B03: properti "Unit GF-B03", baris ditandai `aria-current`, peta bergerak ke unit itu |
| [04](04-tidak-ada-hasil.png) | Esc di kotak cari mengosongkan teks tanpa membatalkan pilihan; teks tanpa hasil: "Tidak ada fitur yang cocok dengan …" |

## Temuan

Tidak ada baru (perbaikan Enter + cari di T-109).
