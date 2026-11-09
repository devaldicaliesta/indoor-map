# Video promosi PanduArah

Materi pemasaran, bukan bagian situs landing dan bukan video landing 15 detik
(`apps/landing/motion`, `scripts/landing-motion.mjs`). Setiap konsep adalah satu halaman canvas
yang digambar per frame di Chromium Playwright lalu dikodekan dengan ffmpeg sistem.

```
motion-promo/
  shared/        kanvas & area aman, easing, proyeksi isometrik, orang mini, teks kinetik,
                 subtitle, jadwal (ketukan musik, kalimat dubber), ikon Lucide untuk canvas
  pengelola/     konsep 4 "Untuk Pengelola Gedung" (B2B, ±50 detik, 105 BPM)
    copy.ts      naskah dubber, teks kinetik, teks UI ID/EN
    scene-*.ts   satu berkas per adegan
    admin-*.ts   tampilan Admin yang digambar ulang (Editor Peta, Penutupan)
    phone.ts     HP pengunjung dengan Visitor
  out/           hasil render (tidak di-commit)
```

## Render

```
node scripts/promo-motion.mjs --concept pengelola --size 1920x1080 --lang id
node scripts/promo-motion.mjs --concept pengelola --size 1080x1920 --lang en --burn-subs
node scripts/promo-motion.mjs --concept pengelola --stills auto      # gambar diam untuk dinilai
node scripts/promo-motion.mjs --concept pengelola --stills 0,12.5    # detik tertentu
```

Hasil per render di `out/`: `<konsep>-<ukuran>-<bahasa>.mp4` (H.264 + AAC, 30 fps, faststart),
`.srt`, `-thumb.jpg` (frame 0), `-contact.jpg` (1 frame per detik), `.timeline.json` (jadwal yang
dipakai), dan `.report.json` (durasi, fps, audio, selisih teks–suara, frame diam > 1 detik).

## Suara dan musik

- Klip dubber per kalimat: `motion-promo/<konsep>/audio/<lang>/01.mp3`, `02.mp3`, … (atau folder
  bersama `motion-promo/audio/<lang>/`). Durasinya diukur ffprobe dan dikirim ke halaman sebagai
  `timeline.json`; adegan yang kalimatnya lebih panjang diperpanjang per birama, jadi batas adegan
  tetap di ketukan. Potong hening di awal/akhir klip agar teks pas dengan suara.
- Musik: `motion-promo/<konsep>/music.mp3` (atau `motion-promo/music.mp3`). Tanpa berkas itu,
  musik sintetis dibuat sesuai BPM konsep (`scripts/promo-music.mjs`), lengkap dengan aksen di
  batas adegan dan efek suara UI. Musik diredam −14 dB selama dubber bicara; hasil akhir
  dinormalkan ke −16 LUFS.
- Tanpa klip dubber, video memakai timeline bawaan (panjang kalimat diperkirakan dari jumlah
  huruf) dan tidak bersuara dubber; `.srt` dan `--burn-subs` tetap memakai naskah.

## Aturan isi

Tidak ada titik biru GPS: "Anda di sini" berasal dari QR titik asal. Orang mini hanya ilustrasi.
Semua nama tempat fiktif (Menara Sinergi, Ruang Rapat 3.02). Teks kinetik maksimal lima kata,
kata kunci diberi blok kuning `--signal` dengan teks `--ink` (kontras dicek di
`test/promo.test.ts`). Area aman 9:16: 8% atas, 18% bawah, 12% kanan dikosongkan.
