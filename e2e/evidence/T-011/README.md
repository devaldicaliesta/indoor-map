# T-011 · Kerangka Visitor — bukti E2E

Spec: `e2e/tests/visitor/verify/T-011-visitor-shell.spec.ts`. Hasil: **lulus 3 run beruntun** (3 test, 2026-10-02).
Test case: kriteria T-011 (360 px dan desktop, bahasa tanpa reload dan diingat, PWA installable, tanpa domain pihak ketiga), NFR target sentuh ≥ 44 px.

| Gambar | Langkah |
| --- | --- |
| [01](01-hp-awal.png) | HP 360 × 740: peta penuh, kolom cari mengambang, bottom sheet |
| [02](02-hp-sheet-intip.png) | Panah bawah → intip (96 px), `aria-expanded=false` |
| [03](03-hp-sheet-setengah.png) | Panah atas → setengah (370 px) |
| [04](04-hp-sheet-penuh.png) | Panah atas → penuh (layar − 72 px), kolom cari tetap terlihat; Enter → kembali intip; drag ±280 px → setengah |
| [05](05-hp-english.png) | Ganti ke English tanpa memuat ulang (`lang=en`, label berganti); tetap English setelah muat ulang |
| [06](06-desktop.png) | Desktop 1280 × 800: panel kiri, tanpa bottom sheet |
| [07](07-pwa-build-produksi.png) | Build produksi + `vite preview`: manifest (standalone, ikon 192/512/maskable), service worker aktif, Chromium `Page.getInstallabilityErrors` kosong |

Selama sesi HP semua request hanya ke Visitor dan Supabase lokal (tanpa domain pihak ketiga).

## Temuan

- [SEDANG] **Enter/Spasi pada pegangan sheet tidak berbuat apa-apa.** Komentar dan desain menyebut "Klik/Enter: intip → setengah → penuh → intip", tetapi pegangan hanya menangani pointer, sehingga pengguna keyboard hanya bisa memakai panah. **Diperbaiki** di `apps/visitor/src/components/bottom-sheet.tsx` (click tanpa pointer, `detail === 0`, memutar tinggi); dijaga spec ini (merah sebelum perbaikan).
- [RENDAH] Di HP, sheet tidak menampilkan kalimat arahan ("Cari nama lokasi atau kode unit…") yang tampil di panel desktop; sheet penuh terlihat kosong di bawah chip (gambar 04).
- [Catatan] Data uji kecil (`publishedVenue`); tampilan peta dengan data banyak diuji di T-104 dan R2.
