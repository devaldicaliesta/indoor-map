# @indoor/ui

Lihat `docs/03-arsitektur.md` → "Tanggung jawab tiap paket".

**Tanggung jawab:** Komponen shadcn yang sudah dikustom, token, ikon, pola layout.

**Tidak boleh berisi:** Logika bisnis.

Paket ini diekspor langsung dari sumber TypeScript (`exports` → `src/index.ts`), sehingga app memakainya tanpa build terpisah.
