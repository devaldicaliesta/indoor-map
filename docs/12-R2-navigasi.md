# 12 · R2 Navigasi

**Tujuan:** Admin membangun graf jalur lengkap dengan konektor antar-lantai dan antar-gedung, lalu pengunjung mendapat rute langkah demi langkah dari QR titik asal, pilihan lokasi, atau ketuk peta, termasuk rute aksesibel dan penutupan sementara.

**Gerbang selesai R2** (venue contoh + graf lengkap):
- Semua **skenario uji rute wajib** di bawah lolos di Admin (test route) dan Visitor dengan hasil yang sama.
- Operator bisa membuat penutupan lift; Visitor yang sedang terbuka langsung mendapat rute memutar tanpa publish.
- QR titik asal yang dicetak membuka Visitor dengan posisi dan arah yang benar.
- `packages/routing` punya cakupan test ≥ 90% baris.

**Skenario uji rute wajib** (dijadikan test di `packages/routing/test/scenarios.test.ts` dengan fixture venue contoh):
1. Rute satu lantai antar-dua unit.
2. Rute naik lewat eskalator naik, kembali lewat eskalator turun (tidak pernah melawan arah).
3. Rute antar-gedung lewat Area Luar dengan instruksi "keluar gedung" dan "masuk gedung".
4. Rute aksesibel ke lantai yang hanya dilayani satu lift; lalu lift ditutup → hasil `accessible_blocked`.
5. Lift yang tidak melayani L2 tidak pernah dipakai untuk rute ke/dari L2.
6. Tujuan dengan dua unit/dua titik masuk → rute ke titik masuk terdekat.
7. Rute dari titik asal QR dan dari Info Point ke lokasi di gedung lain.

Dokumen pendukung: `03-arsitektur.md` bagian Routing, `04-model-data.md` (tabel navigasi).

---

### T-201 · Routing: model graf dan A*

- **Untuk:** NFR-PERF-02
- **Mendukung:** FR-NAV-*, FR-VST-08 (dimiliki T-205 s.d. T-215)
- **Bergantung pada:** R1 (format snapshot)
- **Konteks:** Jantung produk. Gunakan model besar untuk desain API. Paket murni, tanpa UI.
- **Langkah:**
  1. `buildGraph(snapshot.graph, options)` → struktur adjacency yang efisien (array bertipe, bukan objek per edge).
  2. `findRoute(graph, from, to, options)` dengan A*: heuristik haversine + penalti minimal beda lantai.
  3. Tipe hasil: `{ ok: true, path: NodeId[], legs, distanceM } | { ok: false, reason }` sesuai `03-arsitektur.md`.
  4. Fixture `packages/domain/test/fixtures/venue-sample.json` (2 gedung, 3 lantai, lift, eskalator naik/turun, tangga, pintu gedung, 20 unit).
  5. Benchmark sederhana: graf 20.000 edge, rute terjauh < 50 ms di Node.
- **File:** `packages/routing/src/graph.ts`, `packages/routing/src/astar.ts`, `packages/routing/test/**`
- **Selesai jika:**
  - [ ] Hasil A* sama dengan Dijkstra referensi (test acak 200 pasang node)
  - [ ] Skenario 1 lulus
  - [ ] Benchmark di bawah target
- **Jangan:** memasang pustaka graf pihak ketiga.

### T-202 · Routing: konektor

- **Untuk:** FR-NAV-04, FR-NAV-05, FR-NAV-06
- **Bergantung pada:** T-201
- **Langkah:**
  1. Lift: edge antar setiap pasang pemberhentian; bobot dari `costs.ts`.
  2. Eskalator: edge **berarah** sesuai `direction` (`up` = dari level rendah ke tinggi).
  3. Tangga: dua arah, bobot per lantai.
  4. Pintu gedung: dua arah, bobot 0, menghubungkan lantai dasar gedung dengan Area Luar.
  5. Konstanta bobot terdokumentasi di `packages/routing/src/costs.ts`.
- **File:** `packages/routing/src/connectors.ts`, `packages/routing/src/costs.ts`
- **Selesai jika:**
  - [ ] Skenario 2, 3, dan 5 lulus
- **Jangan:** mengubah API `findRoute`.

### T-203 · Routing: aksesibilitas, penutupan, titik masuk terdekat

- **Untuk:** FR-NAV-07, FR-NAV-08 (logika), aturan titik masuk terdekat
- **Bergantung pada:** T-202
- **Langkah:**
  1. Opsi `accessible: true` memakai hanya edge dan konektor `accessible`.
  2. Opsi `closures: Closure[]` membuang fitur/edge/konektor yang sedang tertutup (berdasarkan waktu `now` yang disuntikkan, bukan jam sistem, agar bisa dites).
  3. Tujuan berupa lokasi: node super-tujuan virtual ke semua titik masuk unit-unitnya.
  4. Alasan gagal yang spesifik: `accessible_blocked` jika rute ada tanpa mode aksesibel; `closed` jika rute ada tanpa penutupan.
- **File:** `packages/routing/src/options.ts`, `packages/routing/src/findRoute.ts`
- **Selesai jika:**
  - [ ] Skenario 4 dan 6 lulus
  - [ ] Penutupan dengan `ends_at` lewat tidak berpengaruh (test dengan `now` disuntikkan)
- **Jangan:** membaca penutupan dari jaringan di paket ini.

### T-204 · Routing: generator instruksi

- **Untuk:** FR-NAV-09 (logika)
- **Mendukung:** FR-VST-10 (dimiliki T-215)
- **Bergantung pada:** T-203
- **Langkah:**
  1. Pecah jalur menjadi langkah: lurus (gabungkan segmen sejajar), belok kiri/kanan (> 30°), agak kiri/kanan (15–30°), konektor (naik/turun lift/eskalator/tangga), keluar/masuk gedung, tiba.
  2. Teks dari `instructionTemplates` dengan placeholder `{distance}`, `{floor}`, `{building}`, `{origin}`, `{destination}`; bahasa sebagai parameter.
  3. Setiap langkah membawa `floorId` dan rentang koordinat untuk disorot di peta.
- **File:** `packages/routing/src/instructions.ts`
- **Selesai jika:**
  - [ ] Skenario 3 menghasilkan urutan instruksi yang diharapkan dalam ID dan EN (snapshot test)
  - [ ] Jarak dibulatkan ke 5 m terdekat, minimal 5 m
- **Jangan:** meng-hardcode teks; semua dari template.

### T-205 · Editor graf: gambar dan edit jalur

- **Untuk:** FR-NAV-01, FR-NAV-02
- **Bergantung pada:** R1 editor, T-201
- **Langkah:**
  1. Mode "Jalur" di editor: menggambar garis membuat node di ujung dan di persimpangan dengan garis lain (split otomatis), edge di antaranya, panjang dihitung dalam meter.
  2. Edit: pindah node (edge ikut), hapus node/edge, gabung node yang berjarak < 0,5 m, pisah edge.
  3. Di lapisan Area Luar, jalur yang sama dipakai untuk antar-gedung.
  4. Simpan ke `nav_nodes`/`nav_edges` dengan simpan otomatis seperti fitur; ikut undo/redo.
- **File:** `apps/admin/src/features/editor/graph/**`, `packages/domain/src/graphEdit.ts` (fungsi split/merge murni + test)
- **Selesai jika:**
  - [ ] Dua garis bersilangan menghasilkan node di persimpangan
  - [ ] Panjang edge sesuai ukuran nyata (selisih ≤ 2%)
  - [ ] Graf tetap terhubung setelah memindah dan menggabung node (test fungsi murni)
- **Jangan:** mengizinkan edge antar-lantai (itu konektor).

### T-206 · Titik masuk unit dan fasilitas

- **Untuk:** FR-NAV-03
- **Bergantung pada:** T-205
- **Langkah:**
  1. Tombol "Hubungkan titik masuk": untuk setiap unit dan fasilitas, sarankan titik masuk dari fitur pintu terdekat (atau tepi unit terdekat ke jalur), tampilkan saran untuk disetujui satu per satu atau sekaligus.
  2. Titik masuk manual: klik unit lalu klik jalur.
  3. Panel "Belum terhubung" berisi unit/fasilitas tanpa titik masuk; klik menuju ke sana.
- **File:** `apps/admin/src/features/editor/graph/Entrances.tsx`, `packages/domain/src/entrances.ts`
- **Selesai jika:**
  - [ ] Saran otomatis muncul untuk semua unit yang punya pintu
  - [ ] Panel "Belum terhubung" kosong setelah semua dihubungkan
- **Jangan:** membuat titik masuk tanpa edge ke graf.

### T-207 · Editor konektor dan aksesibilitas

- **Untuk:** FR-NAV-04, FR-NAV-05, FR-NAV-06, FR-NAV-07 (UI)
- **Bergantung pada:** T-205
- **Langkah:**
  1. Alat "Konektor": pilih jenis (lift, eskalator, tangga, pintu gedung), klik posisi.
  2. Lift: centang lantai yang dilayani. Eskalator: lantai tujuan + arah. Tangga: lantai atas/bawah. Pintu gedung: menghubungkan lantai dasar gedung ini dengan Area Luar.
  3. Sistem membuat node di setiap lantai terkait pada koordinat yang sama; pengguna menghubungkannya ke jalur.
  4. Flag aksesibel per edge dan per konektor (default: lift dan pintu gedung aksesibel; eskalator dan tangga tidak).
- **File:** `apps/admin/src/features/editor/connectors/**`, `packages/data/src/connectors.ts`
- **Selesai jika:**
  - [ ] Keempat jenis konektor bisa dibuat dan tersimpan dengan pemberhentian yang benar
  - [ ] Eskalator tanpa arah tidak bisa disimpan
- **Jangan:** menghitung rute di komponen; gunakan `packages/routing`.

### T-208 · Tampilan graf

- **Untuk:** FR-NAV-11
- **Bergantung pada:** T-207
- **Langkah:**
  1. Sakelar tampil/sembunyi node dan edge.
  2. Edge tidak aksesibel: garis putus-putus. Edge/konektor tertutup: merah arsir.
  3. Node terisolasi (tidak terhubung ke komponen terbesar) diberi tanda.
- **File:** `packages/map-core/src/layers/graph.ts`
- **Selesai jika:**
  - [ ] Ketiga gaya terlihat berbeda dan dijelaskan di legenda kecil
- **Jangan:** menggambar graf di Visitor.

### T-209 · Test route di editor

- **Untuk:** FR-NAV-10
- **Bergantung pada:** T-204, T-207
- **Langkah:**
  1. Panel "Test route": pilih asal dan tujuan (unit, lokasi, fasilitas, QR titik asal, Info Point, atau klik di peta), sakelar mode aksesibel.
  2. Tampilkan garis rute (berpindah lantai otomatis mengikuti langkah), jarak, dan daftar instruksi ID/EN.
  3. Jika gagal, tampilkan alasan dengan bahasa jelas ("Lantai L3 tidak terhubung lift yang aksesibel").
  4. Memakai data draft, bukan snapshot.
- **File:** `apps/admin/src/features/editor/TestRoute.tsx`
- **Selesai jika:**
  - [ ] Hasil untuk skenario uji wajib sama dengan test di `packages/routing`
- **Jangan:** menulis logika rute di komponen.

### T-210 · Template instruksi

- **Untuk:** FR-NAV-09 (UI)
- **Bergantung pada:** T-204
- **Langkah:**
  1. Pengaturan → Instruksi: tabel 15 aksi dengan teks ID dan EN yang bisa diedit; placeholder yang tersedia ditampilkan.
  2. Pratinjau contoh kalimat saat mengedit.
  3. Validasi: placeholder yang tidak dikenal ditolak.
- **File:** `apps/admin/src/features/settings/Instructions.tsx`
- **Selesai jika:**
  - [ ] Mengubah teks langsung terlihat di test route
- **Jangan:** mengizinkan menghapus aksi.

### T-211 · Penutupan sementara dan role Operator

- **Untuk:** FR-NAV-08
- **Bergantung pada:** T-208, T-203
- **Langkah:**
  1. Halaman Penutupan: daftar aktif dan terjadwal; tambah (pilih area/edge/konektor di peta), alasan, mulai, selesai (opsional).
  2. Dampak ditampilkan sebelum menyimpan (jalankan routing untuk pasangan titik penting: "rute aksesibel ke L2 tidak tersedia selama penutupan").
  3. Aksi "Akhiri sekarang" dan "Ubah waktu selesai".
  4. Operator hanya melihat menu ini dan peta baca; uji dengan akun Operator.
  5. Klik kanan elemen di editor → "Tutup sementara" (Admin/Operator).
- **File:** `apps/admin/src/features/closures/**`, `packages/data/src/closures.ts`
- **Selesai jika:**
  - [ ] Operator bisa membuat, memperpanjang, dan mengakhiri penutupan, tetapi tidak bisa mengubah fitur
  - [ ] Penutupan berakhir otomatis pada waktunya (terlihat di daftar tanpa aksi manual)
- **Jangan:** mewajibkan publish untuk penutupan.

### T-212 · QR titik asal

- **Untuk:** FR-DEV-01, FR-DEV-02
- **Bergantung pada:** T-205, FR-SYS-01 (T-010)
- **Langkah:**
  1. Halaman Titik Asal: tabel QR titik asal; tambah (nama, gedung, lantai, klik posisi, putar arah hadap).
  2. Snap otomatis ke node jalur terdekat (atau buat node baru di edge terdekat).
  3. QR berisi URL deep link (T-213) dengan URL publik dari Pengaturan Sistem.
  4. Unduh PNG dan PDF A6 siap cetak sesuai wireframe `05-desain-ui.md`.
  5. Tombol "Coba" membuka Visitor dari titik tersebut.
- **File:** `apps/admin/src/features/origins/**`, `packages/domain/src/qr.ts`
- **Selesai jika:**
  - [ ] QR yang dipindai membuka Visitor dengan posisi dan arah yang benar
  - [ ] PDF A6 tercetak dengan QR terbaca (uji dengan kamera HP)
  - [ ] Tanpa URL publik di Pengaturan Sistem, pembuatan QR ditolak dengan arahan ke Pengaturan
- **Jangan:** memakai layanan QR eksternal.

### T-213 · Spesifikasi deep link

- **Untuk:** FR-VST-12 (format)
- **Bergantung pada:** –  (boleh paralel dengan T-201)
- **Langkah:**
  1. `packages/domain/src/deepLink.ts`: `encode`/`decode` dengan zod. Parameter: `v` (venue), `b` (gedung), `f` (lantai), `loc` (lokasi), `o` (kode titik asal QR), `ip` (kode Info Point), `from`/`to` (lokasi atau `lng,lat,floorId`), `a11y` (1/0), `lang` (`id`/`en`).
  2. Dokumentasikan contoh URL di README paket.
  3. Test round-trip dan penolakan parameter tidak valid.
- **File:** `packages/domain/src/deepLink.ts`
- **Selesai jika:**
  - [ ] `decode(encode(x))` sama dengan `x` untuk semua kombinasi di test
  - [ ] Parameter rusak diabaikan dengan aman, tidak membuat aplikasi error
- **Jangan:** memasukkan data pribadi ke URL.

### T-214 · Visitor: titik asal

- **Untuk:** FR-VST-07
- **Bergantung pada:** T-213, T-118
- **Langkah:**
  1. Dari QR (`o=`): penanda "Anda di sini" dengan arah hadap; peta berpusat di sana.
  2. Tanpa QR: saat menekan "Rute ke sini", minta titik asal: cari lokasi/fasilitas → "Saya di sini", atau ketuk peta.
  3. Titik asal bisa diganti kapan saja dari panel rute.
- **File:** `apps/visitor/src/features/origin/**`
- **Selesai jika:**
  - [ ] Ketiga cara menentukan titik asal berfungsi dan titik asal bisa diganti
- **Jangan:** meminta izin lokasi GPS perangkat.

### T-215 · Visitor: rute dan instruksi

- **Untuk:** FR-VST-08, FR-VST-09, FR-VST-10
- **Bergantung pada:** T-204, T-214
- **Langkah:**
  1. Panel rute sesuai wireframe: Dari/Ke, tukar, sakelar "Rute aksesibel", ringkasan jarak.
  2. Garis rute di peta (`--route`), penanda asal/tujuan, chip perpindahan lantai/gedung.
  3. Daftar langkah dengan ikon; mode langkah (maju/mundur) menggeser kamera ke segmen dan berpindah lantai otomatis.
  4. Pesan kegagalan sesuai `reason` dalam ID/EN.
- **File:** `apps/visitor/src/features/route/**`, `packages/map-core/src/layers/route.ts`
- **Selesai jika:**
  - [ ] Hasil rute sama dengan test route Admin untuk asal/tujuan yang sama (termasuk mode aksesibel)
  - [ ] Rute antar-lantai berpindah lantai mengikuti langkah
  - [ ] Hitung rute ≤ 500 ms di HP kelas menengah (ukur dengan fixture)
- **Jangan:** menghitung rute di server.

### T-216 · Visitor: penutupan live

- **Untuk:** FR-VST-13
- **Bergantung pada:** T-211, T-215
- **Langkah:**
  1. Ambil penutupan aktif venue (akses `anon`) saat buka dan setiap 60 detik saat halaman terlihat.
  2. Tandai elemen tertutup di peta; ID yang tidak dikenal di snapshot diabaikan.
  3. Jika rute yang sedang tampil terdampak, hitung ulang dan tampilkan pemberitahuan singkat.
- **File:** `apps/visitor/src/features/closures/**`, `packages/data/src/publicClosures.ts`
- **Selesai jika:**
  - [ ] Penutupan baru di Admin terlihat di Visitor yang sedang terbuka dalam ≤ 60 detik, tanpa publish
  - [ ] Rute yang terdampak otomatis memutar dengan pemberitahuan
- **Jangan:** memakai Supabase Realtime.

### T-217 · Visitor: bagikan

- **Untuk:** FR-VST-12
- **Bergantung pada:** T-213, T-215
- **Langkah:**
  1. Tombol "Bagikan" di profil lokasi dan panel rute: Web Share API bila ada, jika tidak salin tautan.
  2. Membuka tautan memulihkan keadaan (lokasi, atau asal + tujuan + mode aksesibel + bahasa).
- **File:** `apps/visitor/src/features/share/**`
- **Selesai jika:**
  - [ ] Tautan lokasi dan rute membuka keadaan yang sama di perangkat lain
- **Jangan:** memakai pemendek URL eksternal.
