# Aturan branch

Semua pekerjaan dilakukan di **satu branch kerja**: `claude/vibrant-davinci-uyrrka`.

## Wajib

- **Jangan membuat branch baru**, termasuk `task/T-xxx-slug` atau `claude/<nama-acak>` yang dibuat otomatis oleh sesi.
- Sebelum mulai: `git fetch origin claude/vibrant-davinci-uyrrka` lalu `git checkout -B claude/vibrant-davinci-uyrrka origin/claude/vibrant-davinci-uyrrka`.
- Commit dan push langsung ke branch ini: `git push -u origin claude/vibrant-davinci-uyrrka`.
- Bila sesi sudah terlanjur berada di branch lain, pindahkan commit-nya ke `claude/vibrant-davinci-uyrrka` (merge/fast-forward), push ke sana, lalu branch lain itu boleh dihapus.
- Satu task tetap satu rangkaian commit dengan pesan `T-xxx: ringkasan singkat`.

## Tidak berlaku lagi

Aturan "branch `task/T-xxx-slug`" di `CLAUDE.md`, `06-alur-kerja.md`, dan `/kerjakan-task` digantikan oleh dokumen ini. PR dibuka hanya bila diminta, dari `claude/vibrant-davinci-uyrrka` ke `main`.
