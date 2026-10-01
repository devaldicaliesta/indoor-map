# @indoor/domain

Lihat `docs/03-arsitektur.md` → "Tanggung jawab tiap paket".

**Tanggung jawab:** Tipe entitas, skema zod, konstanta, aturan validasi geometri dan publish, builder snapshot, format deep link.

**Tidak boleh berisi:** React, Supabase, MapLibre. Tidak bergantung pada paket lain di repo.

Paket ini diekspor langsung dari sumber TypeScript (`exports` → `src/index.ts`), sehingga app memakainya tanpa build terpisah.

## Deep link Visitor

Keadaan Visitor yang bisa dibagikan dan dipakai QR (titik asal, "Lanjutkan di HP") dibentuk `encodeDeepLink` / `deepLinkUrl` dan dibaca `decodeDeepLink` (`src/deep-link.ts`). Bentuk kanonik memakai rute venue: `{URL publik}/v/{venue}?{parameter}`; `decodeDeepLink` juga menerima `?v={venue}`. Urutan parameter selalu sama agar tautan yang sama identik.

| Parameter | Isi | Contoh |
| --- | --- | --- |
| `v` | Venue (UUID); biasanya di path `/v/{venue}` | `/v/675a7e25-…` |
| `b` | Gedung (UUID) | `b=b331a645-…` |
| `f` | Lantai (UUID) | `f=599dad1f-…` |
| `loc` | Lokasi yang dibuka (UUID) | `loc=0a9b3f6e-…` |
| `o` | Kode publik QR titik asal (12 heksadesimal) | `o=3fa9c1d2e4b5` |
| `ip` | Kode Info Point sebagai titik asal | `ip=IP-LOBI` |
| `from`, `to` | Ujung rute: UUID lokasi, atau `lng,lat,lantai` (7 desimal) | `to=0a9b3f6e-…`, `from=106.8272345,-6.1754321,599dad1f-…` |
| `a11y` | Rute aksesibel: `1` atau `0` | `a11y=1` |
| `lang` | Bahasa antarmuka: `id` atau `en` | `lang=en` |

Contoh:

```
https://peta.contoh.test/v/675a7e25-4413-5cd3-93db-4d1ede832633
https://peta.contoh.test/v/675a7e25-4413-5cd3-93db-4d1ede832633?loc=0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a05&lang=en
https://peta.contoh.test/v/675a7e25-4413-5cd3-93db-4d1ede832633?o=3fa9c1d2e4b5
https://peta.contoh.test/v/675a7e25-4413-5cd3-93db-4d1ede832633?ip=IP-LOBI&to=0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a05&a11y=1&lang=id
https://peta.contoh.test/v/675a7e25-4413-5cd3-93db-4d1ede832633?from=106.8272345%2C-6.1754321%2C599dad1f-3e11-54f4-bf79-a222b96e5e6f&to=0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a05
```

Parameter yang rusak atau tidak dikenal diabaikan satu per satu tanpa error; bila parameter berulang, nilai pertama yang dipakai. Tanpa venue yang sah `decodeDeepLink` mengembalikan `null`. Tautan hanya berisi id, kode publik, koordinat, dan pilihan tampilan, tidak pernah data pribadi pengunjung.
