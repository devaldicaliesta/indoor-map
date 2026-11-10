# Aturan branch

Struktur branch sejak 2026-10-09 (keputusan pemilik). Menggantikan aturan satu branch
`claude/vibrant-davinci-uyrrka`, yang dihapus 2026-10-12 setelah isinya dipindah ke `develop`
(jejaknya disimpan sebagai tag `arsip/claude-vibrant-davinci-uyrrka`; begitu pula
`arsip/landing-publish`).

```
production   ← yang diterbitkan (Cloudflare Pages). Hanya diisi dari main
   ▲ merge saat rilis
main         ← kode stabil, CI hijau. Default branch GitHub
   ▲ PR
develop      ← integrasi pengembangan harian
   ▲ PR
feature/<nama>   ← fitur besar atau rangkaian task (mis. feature/trial-hosting)
```

| Branch | Isi | Siapa yang mengubah |
| --- | --- | --- |
| `production` | Versi yang sedang live di Cloudflare Pages (landing, nanti Admin dan Visitor hosting) | Hanya merge dari `main` saat rilis |
| `main` | Kode stabil yang sudah lolos `pnpm check` dan review | Hanya lewat PR dari `develop` |
| `develop` | Gabungan pekerjaan terbaru; task kecil boleh langsung di sini | Agen dan pemilik |
| `feature/<nama>` | Rangkaian task satu fitur (lihat tabel di bawah) | Agen; dihapus setelah digabung ke `develop` |

Dokumen (`docs/`, `PROGRESS.md`, PRD) ikut di branch yang sama dengan kodenya, agar status task
selalu sinkron dengan kode.

## Branch fitur yang aktif

| Branch | Task | Dokumen |
| --- | --- | --- |
| — | Tidak ada (`feature/landing-redesign`, T-505 landing bergaya Mappedin, digabung ke `main` lewat PR #33 pada 2026-10-12) | — |

Task di luar daftar ini dikerjakan langsung di `develop`.

## Wajib

- Sebelum mulai: `git fetch origin <branch>` lalu `git checkout -B <branch> origin/<branch>`
  (`<branch>` = branch fitur task itu, atau `develop`).
- Commit dan push ke branch itu: `git push -u origin <branch>`.
- Sesi cloud yang otomatis berada di `claude/<nama-acak>`: pindahkan commit-nya ke branch yang
  benar (merge atau fast-forward), push ke sana, lalu hapus branch `claude/…` itu.
- Jangan push langsung ke `main` atau `production`.
- Satu task tetap satu rangkaian commit dengan pesan `T-xxx: ringkasan singkat`.
- PR dibuka hanya bila diminta: `feature/…` → `develop`, `develop` → `main`.
- Branch fitur yang sudah digabung dihapus, lalu barisnya dihapus dari tabel di atas.

## Rilis ke production

1. PR `develop` → `main`, CI hijau, merge.
2. Tunggu workflow CI, E2E, dan Security pada push ke `main` selesai hijau.
3. Actions → **Rilis production** → Run workflow (branch `main`). Workflow menolak bila salah satu
   dari tiga workflow itu belum hijau untuk commit `main`, lalu fast-forward `production` ke
   `main`. Cadangan manual: `git checkout production && git merge --ff-only origin/main && git push origin production`.
4. Cloudflare Pages membangun ulang otomatis dari `production`.

## CI

| Workflow | Kapan | Isi |
| --- | --- | --- |
| CI (`ci.yml`) | PR, push `main`/`develop`/`production` | `pnpm check`, `pnpm build`; job Database: pgTAP, `database.types.ts` sesuai migrasi, `pnpm test:integration` |
| E2E (`e2e.yml`) | PR (dilewati bila hanya dokumen), push `main`, manual | Playwright per proyek/shard; check ringkasan `E2E` |
| Security (`security.yml`) | PR, push, mingguan | pnpm audit, pip-audit, gitleaks, Trivy |
| Rilis production (`release.yml`) | manual dari `main` | fast-forward `production` |
| Graf graphify | push `main` | perbarui `graphify-out/` |

Versi action diperbarui Dependabot (`.github/dependabot.yml`, bulanan, PR ke `develop`).
Required status check yang disarankan untuk `develop` dan `main`: `check`,
`Database (pgTAP, tipe, integrasi)`, `E2E`.
