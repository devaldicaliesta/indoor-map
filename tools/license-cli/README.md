# license-cli

Alat vendor untuk membuat kunci dan menerbitkan berkas lisensi (T-401). Format dan verifikasi
memakai `packages/domain/src/license.ts`, sama dengan aplikasi. Butuh Node 22 (menjalankan
TypeScript langsung).

```
pnpm --filter @indoor/license-cli license-cli keygen --out ~/indoor-license-keys
pnpm --filter @indoor/license-cli license-cli issue --key ~/indoor-license-keys/license-private.pkcs8.b64 \
  --client "RS Contoh" --plan professional --instance <instance_id> --until 2027-12-31 \
  --venues 2 --buildings 5 --floors 30 --info-points 10 --features 3d,info_point --out lisensi.json
pnpm --filter @indoor/license-cli license-cli inspect lisensi.json --instance <instance_id>
```

- `keygen` sekali per vendor; folder di dalam repo git ditolak, kunci privat berizin 600 dan
  tidak pernah ditimpa. Kunci publik yang dicetak ditempel ke
  `packages/domain/src/license.publicKey.ts` untuk build rilis.
- `inspect` memeriksa dengan kunci publik build (atau `--public-key`); kode keluar 2 bila ditolak.

## Trial (T-504)

```
pnpm --filter @indoor/license-cli license-cli issue --key ~/indoor-license-keys/license-private.pkcs8.b64 \
  --client "Mal Calon Klien" --plan trial --instance <instance_id> --days 14 --out trial.json
```

- `--plan trial` wajib `--days 14`–`30` (atau `--until` dengan lama yang sama); di luar itu ditolak.
- Batas trial bawaan: 1 venue, 2 gedung, 6 lantai, 2 Info Point, 1.000 fitur per lantai, 300 lokasi,
  20 titik asal, 5 pengguna aktif, Storage 1.024 MB, berkas 20 MB, 500 baris per impor, 20 publish
  per hari, semua fitur. Setiap batas bisa ditimpa: `--features-per-floor`, `--locations`,
  `--origin-points`, `--users`, `--storage-mb`, `--max-upload-mb`, `--import-rows`,
  `--publish-per-day` (juga untuk paket berbayar; yang tidak diisi berarti tidak dibatasi).
- Trial otomatis dari tombol "Mulai trial" di `/aktivasi` diterbitkan server vendor (`POST /v1/trial`
  di `tools/vendor-stub`): sekali per instalasi, email, dan domain email kantor, dibatasi laju per IP.
  Jangan menaruh berkas trial siap pakai di paket instalasi: lisensi terikat ke ID instalasi.
