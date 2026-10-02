# T-001 · Monorepo dan tooling — bukti verifikasi

Spec: `e2e/tests/admin/verify/T-001-tooling.spec.ts`. Hasil: **lulus 3/3** (`--repeat-each=3`, 2026-10-02).
Task ini tanpa UI; bukti berupa pemeriksaan konfigurasi, uji penolakan aturan, dan log perintah.
Test case: NFR-MNT-01 (paket yang sama jalan lokal), TC-REL-07 sebagian (install beku).

| Bukti | Isi | Hasil |
| --- | --- | --- |
| [01-ringkasan.png](01-ringkasan.png) | 16 pemeriksaan (T001-01 s.d. 16) + potongan log | Semua lulus |
| [01-install-frozen.txt](01-install-frozen.txt) | `pnpm install --frozen-lockfile` | Lulus |
| [02-check.txt](02-check.txt) | `pnpm check` (typecheck + lint + test, semua paket) | Lulus |
| [03-build.txt](03-build.txt) | `pnpm build` | Lulus |
| [04-format-check.txt](04-format-check.txt) | `biome format .` (651 berkas, tanpa perubahan) | Lulus |
| GitHub Actions | Workflow CI berjalan di PR; run #27 [sukses](https://github.com/devaldicaliesta/indoor-map/actions/runs/36962554714) | Lulus |

Uji negatif (T001-13 s.d. 16): Biome menolak `any`, `console.txt`, dan format salah; TypeScript strict menolak akses indeks tanpa cek.

## Temuan

- [SEDANG] Fixture data uji lengkap yang baru dibuat sempat mengimpor Supabase dari `e2e/`; lint batas impor menolaknya → loader dipindah ke `packages/data/test/support/full-venue.ts` (diekspor `@indoor/data/testing/full-venue`). Diperbaiki.
- [SEDANG] `turbo.json` tidak meneruskan `VITE_CAD_CONVERTER_URL` ke `test:e2e`, sehingga spec DXF (T-313) terlewati saat dijalankan lewat `pnpm test:e2e`. Diperbaiki.
- [RENDAH] CI hanya berjalan pada `pull_request` dan push ke `main`; commit di branch kerja tanpa PR terbuka (T-410, T-313, dokumen T-307a) belum dicek CI. Saran: buka PR dari `claude/vibrant-davinci-uyrrka` ke `main`. Dicatat, tidak diubah.

Tinjauan: code-reviewer — Setuju (tanpa KRITIS/TINGGI); security-reviewer — tidak relevan (tanpa auth/data).
