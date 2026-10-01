---
description: Bersihkan kode mati, duplikasi, dan komentar yang tidak perlu dengan verifikasi pnpm check di setiap langkah
argument-hint: "[paket atau folder]"
---

Rapikan: $ARGUMENTS (bawaan: seluruh repo)

1. Jalankan agent `refactor-cleaner`.
2. Pastikan `pnpm check` hijau sebelum mulai.
3. Usulkan daftar penghapusan per kategori risiko (aman, hati-hati, jangan) dan kerjakan yang aman lebih dulu.
4. Setelah setiap kelompok, jalankan `pnpm check`; kembalikan perubahan yang membuatnya merah.
5. Ringkas apa yang dihapus atau digabung beserta buktinya.
