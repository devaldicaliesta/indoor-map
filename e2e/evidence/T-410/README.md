# T-410 · Branding Visitor — bukti E2E

Spec: `e2e/tests/admin/branding.spec.ts` (project `admin`). Hasil: **2 lulus** (Supabase lokal, 2026-10-02).

| Gambar | Langkah |
| --- | --- |
| [01](01-branding-bawaan.png) | Tab Pengaturan → Branding, pratinjau memakai nama venue dan warna bawaan |
| [02](02-validasi-warna.png) | Warna "kuning" ditolak dengan pesan per kolom |
| [03](03-pratinjau-langsung.png) | Kuning muda `#fff6b3` + rute `#e4002b` + nama + logo; pratinjau langsung, teks tetap gelap (16,8:1) |
| [04](04-tersimpan.png) | Disimpan (`display_settings.branding` + logo venue) |
| [05](05-visitor-desktop.png) | Visitor desktop setelah publish: logo, "Kenari Medika", judul tab, token `--signal`/`--on-signal` |
| [05b](05b-visitor-hp.png) | Visitor HP: logo di header |
| [06](06-logo-dihapus.png) | Logo dihapus dan warna utama kembali bawaan |
| [07](07-editor-baca-saja.png) | Editor: formulir hanya baca (server juga menolak, lihat test integrasi) |

Temuan: placeholder bernama venue terpotong di HP → dipakai hanya di desktop. Pesan error kolom tidak hilang saat diperbaiki → diperbaiki. Info Point belum ada (T-408), jadi branding di Info Point belum bisa dibuktikan.
