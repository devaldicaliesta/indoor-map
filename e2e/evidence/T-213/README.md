# T-213 · Spesifikasi deep link — bukti E2E

Spec: `e2e/tests/visitor/verify/T-213-deep-link.spec.ts` (fixture `fullVenue` dipublish, Visitor HP). Hasil: **lulus 3 run beruntun** (2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-lokasi-en.png) | `?loc=<Radiologi>&lang=en`: profil Radiologi terbuka, `<html lang="en">`, tombol "Directions to here" |
| [02](02-rute-aksesibel.png) | `?from=<lng,lat,lantai>&to=<Radiologi>&a11y=1`: panel Rute "Titik di peta" → Radiologi, aksesibel tercentang, langkah tampil. `?from=<Laboratorium>` (belum ada di peta): nama asal tetap tampil, alasan "Titik asal tidak terhubung" |
| [03](03-lantai-l1.png) | `?f=<L1>`: pemilih lantai di L1. `?b=<Gedung Timur>`: pemilih gedung "Gedung Timur" |
| [04](04-parameter-rusak.png) | `?loc=bukan-uuid&lang=xx&a11y=2&f=<L1>`: parameter rusak dibuang, bahasa tetap ID, `f` yang valid tetap dipakai |

## Temuan

- **Diperbaiki (SEDANG)**: parameter `b` (gedung) dan `f` (lantai) di-decode tetapi tidak dipakai Visitor; tautan selalu membuka gedung/lantai default. Kini `linkedMapView` (domain, diuji unit) menentukan tampilan awal peta dari tautan; `link` dibawa lewat `ExploreProvider`.
- **Diperbaiki (RENDAH)**: asal berupa lokasi yang belum ada di peta membuat isian "Dari" kosong; kini nama lokasinya tampil (alasan gagal tetap ditampilkan).
