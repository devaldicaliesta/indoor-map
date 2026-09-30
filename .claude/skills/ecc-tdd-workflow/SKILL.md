---
name: ecc-tdd-workflow
description: Gunakan saat menulis atau memperbaiki logika di packages/domain, packages/routing, packages/data, fungsi SQL, atau policy RLS di repo indoor-map. Menulis test lebih dulu di lapisan yang tepat (Vitest, pgTAP, integrasi) sebelum implementasi.
---

# Alur TDD indoor-map

1. **Pilih lapisan test**
   - Logika murni (`domain`, `routing`): Vitest, berkas `*.test.ts` di `src/` atau `test/` paket itu.
   - Pemetaan baris dan argumen RPC (`data`): Vitest unit di `packages/data/test/`.
   - Hak akses, trigger, fungsi SQL: pgTAP di `supabase/tests/*.test.sql`, satu `plan(n)` per berkas, dijalankan dalam transaksi yang di-rollback.
   - Repository lewat RLS sungguhan, Storage, Edge Function: `packages/data/test/integration/`.
2. **Merah**: tulis test untuk perilaku yang diminta beserta kasus tepinya, jalankan, dan pastikan gagal karena alasan yang benar.
3. **Hijau**: implementasi minimal.
4. **Rapikan**: nama jelas, fungsi kecil, komentar hanya untuk alasan.
5. **Verifikasi**:
   ```bash
   pnpm check
   pnpm exec supabase test db     # bila ada pgTAP baru dan Supabase lokal berjalan
   pnpm test:integration          # bila ada test integrasi baru
   ```

Kasus tepi yang sering terlewat: teks dengan spasi, huruf besar/kecil, dan diakritik; nilai batas; role tanpa hak (Operator, Viewer, anon); lebih dari 1.000 baris dari PostgREST; geometri di tepi footprint.
