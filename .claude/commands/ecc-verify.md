---
description: Verifikasi keadaan repo sebelum commit atau PR (check, build, test database, audit) dan laporkan siap/tidak
argument-hint: "[cepat|penuh|pra-pr]"
---

Verifikasi dengan mode: $ARGUMENTS (bawaan: penuh)

Jalankan berurutan dan berhenti di langkah pertama yang merah:

1. **Check**: `pnpm check` (typecheck, Biome, Vitest). Mode `cepat` berhenti di sini.
2. **Build**: `pnpm build`.
3. **Database** (bila Supabase lokal berjalan, `supabase status`): `pnpm exec supabase test db` dan `pnpm test:integration`. Bila tidak berjalan, tulis bahwa langkah ini dilewati.
4. **Audit perubahan** (`git diff --name-only main...HEAD`):
   - `console.log`, `any`, `@ts-ignore`, dan TODO tanpa nomor task;
   - impor `@supabase/*` di luar `packages/data` dan `supabase/functions`;
   - teks Visitor yang tidak lewat i18next, istilah industri di kode;
   - komentar yang hanya berisi tag kebutuhan seperti `(FR-MAP-09)`;
   - migrasi lama yang ikut berubah;
   - rahasia atau `.env.local` yang ikut ter-commit.
5. **Mode `pra-pr`**: jalankan juga agent `code-reviewer`, dan agent `security-reviewer` bila perubahan menyentuh RLS, Storage, Edge Function, auth, atau unggahan.

Laporan:

```
VERIFIKASI: LULUS/GAGAL
Check:     OK/merah (ringkasan)
Build:     OK/merah
Database:  OK/merah/dilewati
Audit:     OK/n temuan
Siap PR:   YA/TIDAK
```
