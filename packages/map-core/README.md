# @indoor/map-core

Lihat `docs/03-arsitektur.md` → "Tanggung jawab tiap paket".

**Tanggung jawab:** Pembuat style MapLibre, layer per jenis fitur, 2D/3D, georeferensi denah, kamera, lapisan rute, penanda.

**Tidak boleh berisi:** Akses data dan state aplikasi. Tidak memanggil `@indoor/data`; data diterima lewat argumen.

Paket ini diekspor langsung dari sumber TypeScript (`exports` → `src/index.ts`), sehingga app memakainya tanpa build terpisah.
