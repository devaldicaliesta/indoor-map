# @indoor/data

Lihat `docs/03-arsitektur.md` → "Tanggung jawab tiap paket".

**Tanggung jawab:** Klien Supabase, repository per entitas, upload Storage, auth, pemetaan error. Satu-satunya pintu ke database.

**Tidak boleh berisi:** Komponen UI dan hook React (hook TanStack Query ada di app).

Paket ini diekspor langsung dari sumber TypeScript (`exports` → `src/index.ts`), sehingga app memakainya tanpa build terpisah.
