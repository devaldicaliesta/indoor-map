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
2. `git checkout production && git merge --ff-only origin/main && git push origin production`.
3. Cloudflare Pages membangun ulang otomatis dari `production`.
