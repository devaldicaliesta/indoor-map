# @indoor/map-core

Lihat `docs/03-arsitektur.md` → "Tanggung jawab tiap paket".

**Tanggung jawab:** Pembuat style MapLibre, layer per jenis fitur, 2D/3D, georeferensi denah, kamera, lapisan rute, penanda.

**Perangkat tanpa WebGL:** MapLibre 6 hanya memakai WebGL2. `supportsWebGL()` memeriksanya sekali per halaman; bila `false`, app tidak membuat peta dan menampilkan penggantinya sendiri (Visitor: "Perangkat ini tidak mendukung peta", T-512). `createMap` tetap bisa melempar galat bila konteks GPU ditolak, jadi pemanggil menangkapnya.

**Tidak boleh berisi:** Akses data dan state aplikasi. Tidak memanggil `@indoor/data`; data diterima lewat argumen.

Paket ini diekspor langsung dari sumber TypeScript (`exports` → `src/index.ts`), sehingga app memakainya tanpa build terpisah.
