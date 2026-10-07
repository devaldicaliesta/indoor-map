# PanduArah

**PanduArah — Indoor Navigation.** Platform peta dan navigasi dalam gedung untuk semua jenis gedung, dipasang on-premise di server klien.

Logo resmi dan turunannya: `packages/ui/src/brand/` (sumber pemilik di `docs/brand/`).

- **Admin**: membangun peta, jalur navigasi, lokasi, titik asal; publish; lisensi
- **Visitor**: pengunjung mencari lokasi dan mengikuti rute dari HP
- **Info Point**: mode layar sentuh dari Visitor dengan titik "Anda di sini" tetap

## Mulai

1. Baca `docs/00-README.md` untuk peta playbook.
2. Status pekerjaan ada di `docs/PROGRESS.md`.
3. Aturan kerja untuk agen AI ada di `CLAUDE.md`.
4. Semua pekerjaan di satu branch: `claude/vibrant-davinci-uyrrka`. Jangan membuat branch baru (`docs/07-aturan-branch.md`).

## Status saat ini

- R0–R2 dan R3 sampai T-306 berstatus `review`.
- **Berikutnya: T-307a** — verifikasi end-to-end CRUD dan UI/UX dengan Playwright untuk semua task `review`, bertahap mulai R0 Fondasi, dengan screenshot di `e2e/evidence/T-xxx/`. Panduan dan daftar periksa: `docs/15-verifikasi-e2e.md`.
- Setelah itu T-307 (validasi publish). File spesifikasi R3 (`13-R3-operasional.md`) sudah dihapus; detail T-307 s.d. T-313 perlu ditulis ulang atau diambil dari riwayat git.

## Menjalankan

```
pnpm install
supabase start         # butuh Docker
pnpm db:reset          # seed + Super Admin admin@local.test
pnpm dev               # Admin :5173, Visitor :5174
pnpm check             # typecheck + lint + test
pnpm test:e2e          # Playwright
```

Dengan Claude Code: `/kerjakan-task T-307a`.
