# @indoor/routing

Lihat `docs/03-arsitektur.md` → "Tanggung jawab tiap paket".

**Tanggung jawab:** Pembangun graf dari snapshot, A*, aturan konektor/aksesibel/penutupan, generator instruksi.

**Tidak boleh berisi:** React, Supabase, MapLibre. Hanya boleh bergantung pada `@indoor/domain`.

Paket ini diekspor langsung dari sumber TypeScript (`exports` → `src/index.ts`), sehingga app memakainya tanpa build terpisah.
