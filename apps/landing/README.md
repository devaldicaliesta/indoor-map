# Landing page PanduArah (T-505)

Situs vendor statis: pengenalan produk, jenis gedung, fitur, peta 3D interaktif (venue demo konser
stadion dan rumah sakit, lengkap dengan orang mini), cara kerja, model on-premise dan lisensi,
tangkapan layar, form permintaan trial, dan kebijakan privasi (`/privasi/`). Dua bahasa (ID/EN,
`?lang=en`). **Bukan bagian paket instalasi klien.**

```
pnpm dev:landing                           # http://localhost:5175
pnpm --filter @indoor/landing build        # dist/ siap di-host statis (index.html + privasi/index.html)
node scripts/landing-motion.mjs            # render ulang video motion graphic (public/media/)
```

## Form trial

Form dikirim ke Edge Function `supabase/functions/trial-request` yang **hanya dipasang di server
vendor** (dikecualikan dari image klien lewat `.dockerignore`). Fungsi memvalidasi isian dengan
aturan yang sama dengan browser (`@indoor/domain/trial-request`), menolak honeypot dan lebih dari
5 kiriman per menit per alamat IP, lalu mengirim rincian ke `panduarahid@gmail.com` dan email
konfirmasi ke pemohon.

Alamat fungsi untuk build landing: `VITE_TRIAL_ENDPOINT` (bawaan
`${VITE_SUPABASE_URL}/functions/v1/trial-request`).

Rahasia SMTP di server vendor (jangan di repo, jangan di kode klien):

```
supabase secrets set TRIAL_SMTP_HOST=smtp.gmail.com TRIAL_SMTP_PORT=587 \
  TRIAL_SMTP_USERNAME=panduarahid@gmail.com TRIAL_SMTP_PASSWORD=<App Password Gmail> \
  TRIAL_SMTP_FROM="PanduArah <panduarahid@gmail.com>" TRIAL_ALLOWED_ORIGIN=https://<domain-landing>
```

Lokal, `supabase/config.toml` mengarahkan fungsi ke Mailpit (`http://127.0.0.1:54324`) tanpa password.

## Performa

MapLibre dan data demo hanya dimuat saat bagian demo hampir terlihat (atau tombol "Muat peta 3D"),
video memakai poster dan `preload="none"`, tangkapan layar `loading="lazy"`. Modul `@indoor/ui` dan
`@indoor/domain` ditandai bebas efek samping di `vite.config.ts` agar komponen yang tidak dipakai
tidak ikut bundel.
