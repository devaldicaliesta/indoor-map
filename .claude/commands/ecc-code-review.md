---
description: Tinjau perubahan yang belum di-commit atau diff terhadap main dengan aturan repo, keamanan, dan kualitas
argument-hint: "[main | path]"
---

Tinjau perubahan: $ARGUMENTS (bawaan: perubahan yang belum di-commit; `main` = seluruh diff branch terhadap `main`)

1. Jalankan agent `code-reviewer` untuk diff tersebut.
2. Bila diff menyentuh migrasi, policy RLS/Storage, Edge Function, auth, atau unggahan berkas, jalankan juga agent `security-reviewer`.
3. Gabungkan temuan, urutkan dari KRITIS ke RENDAH, dengan file:baris dan usulan perbaikan.
4. Jangan menyetujui perubahan yang masih punya temuan KRITIS atau TINGGI.
