# 03 · Arsitektur

## Prinsip

1. **Logika murni dipisah dari UI.** Validasi, graf, dan perhitungan rute berada di paket TypeScript tanpa React, sehingga mudah diuji dan dipakai ulang di Admin, Visitor, dan Edge Function.
2. **Satu pintu ke database.** Hanya `packages/data` yang mengenal Supabase. Pindah ke Postgres + API sendiri nanti cukup mengganti implementasi paket itu.
3. **Pengunjung membaca snapshot, bukan database.** Snapshot JSON berversi membuat Visitor cepat, bisa di-cache offline, dan tidak membebani server.
4. **On-premise sejak hari pertama.** Semua jalan di laptop dengan `supabase start`; tidak ada ketergantungan pada layanan internet selain lisensi vendor.
5. **Tidak membangun lebih awal.** Three.js, blue dot, analitik, dan integrasi tidak dibangun sampai diputuskan.

## Struktur paket dan dependensi

```
apps/admin ─────┬─> packages/ui
                ├─> packages/map-core ──> packages/domain
                ├─> packages/data ──────> packages/domain
                ├─> packages/routing ───> packages/domain
                └─> packages/domain

apps/visitor ───┬─> packages/ui
                ├─> packages/map-core
                ├─> packages/routing
                ├─> packages/data   (hanya: baca snapshot, penutupan aktif, pengaturan publik)
                └─> packages/domain

supabase/functions/publish ──> packages/domain (validasi + builder snapshot)
```

Aturan dependensi (diperiksa saat review):
- `domain` tidak bergantung pada paket lain di repo.
- `routing` hanya bergantung pada `domain`.
- `map-core` tidak memanggil `data`; ia menerima data lewat argumen.
- `apps/*` tidak saling mengimpor.

### Tanggung jawab tiap paket

| Paket | Isi | Tidak boleh berisi |
| --- | --- | --- |
| `domain` | Tipe entitas, skema zod, konstanta, aturan validasi geometri dan publish, builder snapshot, format deep link | React, Supabase, MapLibre |
| `routing` | Pembangun graf dari snapshot, A*, aturan konektor/aksesibel/penutupan, generator instruksi | React, Supabase, MapLibre |
| `map-core` | Pembuat style MapLibre, layer per jenis fitur, 2D/3D, georeferensi denah, kamera, lapisan rute, penanda | Akses data, state aplikasi |
| `data` | Klien Supabase, repository per entitas, upload Storage, auth, pemetaan error | Komponen UI |
| `ui` | Komponen shadcn yang sudah dikustom, token, ikon, pola layout | Logika bisnis |

## Aliran data

### Admin (tulis)

```
Komponen React ─> hook TanStack Query ─> repository (packages/data) ─> Supabase (RLS)
                                                              └─> Storage (denah, ikon, logo)
```

State editor peta (seleksi, alat aktif, riwayat undo) ada di store Zustand per lantai. Perubahan geometri disimpan ke draft dengan debounce ±800 ms (FR-MAP-10).

### Publish

```
Admin klik Publish
  └─> Edge Function `publish`
        1. baca semua data draft venue
        2. jalankan validasi (domain) ──> Error? batal, kembalikan temuan
        3. bangun snapshot (domain)
        4. simpan  snapshots/{venue_id}/v{n}.json  +  latest.json  ke Storage
        5. catat baris `publications` (aktif = true), nonaktifkan versi lama
```

R1 memakai versi minimal (langkah 1, 3, 4 tanpa riwayat). R3 menambahkan validasi, versi, dan rollback **tanpa mengubah format snapshot**.

### Visitor dan Info Point (baca)

```
Buka URL ─> ambil /snapshots/{venue}/latest.json (cache service worker)
         ─> map-core menggambar, routing membangun graf di browser
         ─> ambil penutupan aktif (tabel kecil, polling 60 s) ─> routing menerapkan
```

Info Point memeriksa `latest.json` setiap 5 menit dan menukar data hanya saat idle (FR-IP-06).

## Format snapshot

Satu file JSON per versi. Tipe TypeScript-nya (`Snapshot`) didefinisikan di `packages/domain/src/snapshot.ts` dan diberi nomor `schemaVersion`.

```ts
interface Snapshot {
  schemaVersion: 1;
  venue: { id; name; timezone; defaultBuildingId; defaultLanguage; branding?; camera; display };
  buildings: Building[];            // id, name, code, footprint, defaultFloorId
  floors: Floor[];                  // termasuk lapisan Area Luar (isOutdoor)
  features: FeatureCollection;      // GeoJSON, properties: kind, floorId, unitCode, height, color, facilityTypeId, name
  facilityTypes: FacilityType[];
  locations: Location[];            // hanya status aktif/segera buka/nonaktif sementara; field kustom yang visible
  locationTypes: LocationType[];    // termasuk definisi field yang visible
  categories: Category[];
  searchIndex: SearchEntry[];       // teks yang sudah dinormalisasi: nama, kode, alias, field searchable
  graph: { nodes: NavNode[]; edges: NavEdge[]; connectors: Connector[] };
  instructionTemplates: Record<Action, { id: string; en: string }>;
  originPoints: OriginPoint[];
  infoPoints: InfoPointPublic[];
  enabledFeatures: string[];        // dari lisensi: '3d', 'info_point', ...
  publishedAt: string;
  version: number;
}
```

Aturan: snapshot tidak pernah berisi data pribadi, email, atau data pengaturan server.

## Routing

- **Graf:** node per lantai; edge berbobot panjang (meter) dua arah; konektor menjadi edge antar-lantai:
  - lift: edge penuh antar setiap pasang lantai yang dilayani, bobot = 15 m ekuivalen + 3 m per lantai (konstanta di `routing/src/costs.ts`)
  - eskalator: edge **berarah** sesuai `direction`, bobot 10 m ekuivalen
  - tangga: dua arah, bobot 12 m ekuivalen per lantai
  - pintu gedung: dua arah, bobot 0, menghubungkan lantai dasar gedung dengan Area Luar
- **Algoritma:** A* dengan heuristik jarak lurus (haversine) ditambah penalti beda lantai minimal. Graf tipikal < 20.000 edge, jadi jalan di browser.
- **Filter saat hitung:** elemen tertutup (dari penutupan aktif) dibuang; mode aksesibel hanya memakai edge dan konektor `accessible = true`.
- **Tujuan dengan banyak titik masuk:** jalankan satu pencarian ke node super-tujuan virtual yang terhubung ke semua titik masuk (hasil otomatis ke yang terdekat).
- **Instruksi:** jalur dipecah per segmen; perubahan arah > 30° menjadi belok kiri/kanan; konektor menjadi instruksi naik/turun/lift/tangga/keluar gedung/masuk gedung; teks dari template sesuai bahasa.
- **Hasil:** `{ ok: true, legs: Leg[], distanceM, steps: Step[] }` atau `{ ok: false, reason: 'no_path' | 'origin_invalid' | 'accessible_blocked' | 'closed' }`.

## Peta (map-core)

- Style MapLibre kosong (tanpa basemap internet). Latar = warna token; Area Luar digambar sendiri.
- Satu source GeoJSON per lantai aktif; berganti lantai = mengganti data source, bukan membuat peta baru.
- 2D: layer `fill` + `line`. 3D: layer `fill-extrusion` dengan tinggi dari properti fitur. Beralih dengan `easeTo` pitch 0 ↔ 50.
- Label memakai `symbol` layer dengan ikon dari sprite yang dibangun dari ikon fasilitas/kategori.
- Denah: `image` source dengan 4 koordinat sudut; opasitas diatur lewat `raster-opacity`.
- Lapisan rute: `line` dengan pola garis; penanda asal/tujuan dan perpindahan lantai.
- Editor: terra-draw dengan adapter MapLibre. Mode: polygon, linestring, point, select. Snapping diaktifkan per mode.

## Autentikasi, otorisasi, dan portabilitas

- Supabase Auth untuk login. Role disimpan di tabel `profiles`.
- Semua kebijakan RLS memanggil fungsi pembungkus di skema `app` (`app.current_user_id()`, `app.current_role()`, `app.can_edit()`, …), **bukan** `auth.uid()` langsung. Saat pindah dari Supabase, hanya fungsi pembungkus ini yang diubah (misalnya membaca `current_setting('app.user_id')`).
- Pengunjung memakai role `anon` dan hanya bisa membaca: penutupan aktif, versi published aktif, dan objek Storage di folder `snapshots/` serta `public-assets/`.

## Storage

| Bucket/folder | Isi | Akses |
| --- | --- | --- |
| `floor-plans/` | File denah asli dan hasil raster | Admin |
| `public-assets/` | Logo venue, logo/foto lokasi, ikon fasilitas | Baca publik |
| `snapshots/` | `{venue}/v{n}.json`, `{venue}/latest.json` | Baca publik |

## Keputusan arsitektur (ADR ringkas)

| No | Keputusan | Alasan | Konsekuensi |
| --- | --- | --- | --- |
| ADR-01 | Monorepo pnpm + Turborepo | Satu tempat untuk admin, visitor, dan paket bersama | Aturan dependensi antar paket harus dijaga |
| ADR-02 | Snapshot JSON untuk pengunjung | Cepat, bisa di-cache, tahan gangguan, murah untuk server klien | Perubahan harus dipublish; penutupan dibuat pengecualian |
| ADR-03 | Routing di browser | Graf kecil; bekerja offline; server tidak terbebani | Graf harus ikut di snapshot |
| ADR-04 | Repository di `packages/data` + fungsi `app.*` untuk RLS | Portabilitas dari Supabase ke Postgres/SQL lain | Sedikit kode tambahan di awal |
| ADR-05 | 3D dengan `fill-extrusion`; Three.js ditunda | Cukup untuk ruang dan dinding; Three.js hanya perlu untuk model GLB | Model 3D menunggu backlog |
| ADR-06 | Info Point = mode Visitor | Satu kode, satu pengujian | Perilaku khusus Info Point diatur lewat route dan konfigurasi |
| ADR-07 | Lisensi = file bertanda tangan Ed25519 + check-in online | Verifikasi lokal, sulit dipalsukan | Public key vendor tertanam di aplikasi; private key tidak pernah masuk repo |
| ADR-08 | Area Luar sebagai `floor` khusus per venue | Jalur antar-gedung memakai mesin yang sama dengan jalur dalam gedung | Konektor "pintu gedung" wajib untuk menghubungkan |

Keputusan baru dicatat di `PROGRESS.md` bagian "Catatan keputusan", lalu dipindah ke tabel ini saat rilis ditutup.
