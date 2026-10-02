# T-003 · Kerangka paket bersama — bukti verifikasi

Spec: `e2e/tests/admin/verify/T-003-packages.spec.ts` (helper `e2e/support/repo-checks.ts`). Hasil: **lulus 3/3** (2026-10-02).
Task tanpa UI; bukti berupa 29 pemeriksaan struktur, arah dependensi, dan uji negatif batas impor.
Test case: NFR-MNT-02 (portabilitas: hanya `packages/data` yang menyentuh Supabase), dasar TC-SEC-03 s.d. 05 (logika di domain/routing).

| Bukti | Isi | Hasil |
| --- | --- | --- |
| [01-ringkasan.png](01-ringkasan.png) | 29 pemeriksaan | Semua lulus |

- Lima paket `@indoor/domain`, `routing`, `map-core`, `data`, `ui`: ESM, `exports` ke `src/index.ts`, tsconfig dari base, README.
- Arah dependensi sesuai `03-arsitektur.md`: domain tanpa paket internal; routing, map-core, data, ui hanya ke domain.
- Uji negatif: impor `react`, `maplibre-gl`, `@supabase/*`, atau paket internal lain dari domain/routing/map-core ditolak Biome; app Admin dan Visitor juga ditolak mengimpor Supabase langsung; `packages/data` diizinkan.
- Setiap paket punya test (domain 60+, routing, map-core, data, ui).

## Temuan

- [RENDAH] `@indoor/domain` mengekspor `./fixtures/*` (fixture test) dan `@indoor/data` mengekspor `./testing/full-venue`. Hanya dipakai test dan tidak ikut bundle produksi selama tidak diimpor kode app. Dicatat, tidak diubah.

Tinjauan: code-reviewer — Setuju; security-reviewer — tidak relevan.
