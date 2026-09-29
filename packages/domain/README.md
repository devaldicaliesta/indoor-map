# @indoor/domain

Lihat `docs/03-arsitektur.md` → "Tanggung jawab tiap paket".

**Tanggung jawab:** Tipe entitas, skema zod, konstanta, aturan validasi geometri dan publish, builder snapshot, format deep link.

**Tidak boleh berisi:** React, Supabase, MapLibre. Tidak bergantung pada paket lain di repo.

Paket ini diekspor langsung dari sumber TypeScript (`exports` → `src/index.ts`), sehingga app memakainya tanpa build terpisah.
