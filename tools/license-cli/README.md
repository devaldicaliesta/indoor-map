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
