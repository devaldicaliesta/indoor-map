# Setup trial ter-hosting PanduArah (F2-K, T-618)

Panduan untuk **pemilik**, dijalankan di akun Supabase, Cloudflare, Gmail, dan GitHub milik
vendor. Hasilnya: calon klien meminta trial di **panduarah.my.id**, menerima email, dan dalam
semenit punya Admin (**admin.panduarah.my.id**) dan Visitor (**app.panduarah.my.id/v/&lt;slug&gt;**)
sendiri, 17 hari, tanpa campur tangan vendor. Rancangan lengkapnya ada di
`docs/23-trial-hosting.md`, rincian task di `docs/24-F2-K-task.md`.

Biaya Rp0: Supabase Free + Cloudflare Pages Free + Gmail. Batas yang perlu diingat: database
500 MB, Storage 1 GB, Gmail ±500 email per hari, project Free dijeda setelah 7 hari tanpa
aktivitas (ditangani langkah 7).

> Urutan langkah penting. **Langkah 3 (Super Admin) harus selesai sebelum Admin dipasang di
> domain publik (langkah 5)**: selama instalasi belum punya Super Admin, halaman aktivasi Admin
> membolehkan siapa pun membuat Super Admin pertama.

## 0. Siapkan

- Supabase CLI lewat repo: `pnpm exec supabase --version`.
- Gmail `panduarahid@gmail.com` dengan verifikasi 2 langkah dan **App Password** (Akun Google →
  Keamanan → Sandi aplikasi). Password akun biasa tidak bisa dipakai SMTP.
- Kunci lisensi **vendor asli**, bukan `tools/license-cli/dev-keys/` (kunci privat dev ikut di
  repo, jadi siapa pun yang punya repo bisa membuat lisensi untuk server yang memakai kunci dev):
  ```sh
  pnpm --filter @indoor/license-cli license-cli keygen --out ~/indoor-license-keys
  ```
  Ganti nilai `LICENSE_PUBLIC_KEY` di `packages/domain/src/license.publicKey.ts` dengan kunci
  publik yang dihasilkan (commit rilis), lalu simpan kunci privatnya di luar repo dan cadangkan.

## 1. Project Supabase

1. Buat project **Free** di region **Southeast Asia (Singapore)**. Catat *project ref*, password
   database, URL, *anon key*, dan *service_role key* (Settings → API).
2. Hubungkan dan pasang skema:
   ```sh
   pnpm exec supabase link --project-ref <ref>
   pnpm exec supabase db push
   ```
   Tanpa `supabase login` bisa juga langsung ke database. Host `db.<ref>.supabase.co` hanya punya
   alamat IPv6; dari jaringan IPv4 pakai **session pooler** (Settings → Database → Connection
   string → Session pooler). Password dengan karakter khusus harus di-encode (`@` → `%40`):
   ```sh
   pnpm exec supabase db push --dry-run \
     --db-url 'postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres'
   ```
   Migrasi memasang semuanya: tabel, RLS, bucket Storage, `pg_cron`, `pg_net`, skema `hosting`,
   dan jadwal `license-checkin`, `license-service`, `trial-lifecycle`.
3. Tandai project ini sebagai server ter-hosting (SQL Editor):
   ```sql
   insert into app.server_settings (key, value) values
     ('hosting_mode', 'true'),
     ('functions_url', 'https://<ref>.supabase.co/functions/v1')
   on conflict (key) do update set value = excluded.value;
   -- opsional, bawaan 15: ('trial_capacity', '15')
   ```
4. **Settings → API → Exposed schemas**: biarkan `public` dan `graphql_public` saja. Jangan
   menambahkan `hosting` — data calon klien hanya dijangkau Edge Function.

## 2. Edge Functions dan rahasia

1. Rahasia — tulis berkas sementara di luar repo (mis. `~/panduarah-hosting.env`), lalu:
   ```sh
   pnpm exec supabase secrets set --env-file ~/panduarah-hosting.env
   ```
   ```sh
   TRIAL_SMTP_HOST=smtp.gmail.com
   TRIAL_SMTP_PORT=587
   TRIAL_SMTP_USERNAME=panduarahid@gmail.com
   TRIAL_SMTP_PASSWORD=<App Password Gmail>
   TRIAL_SMTP_FROM=PanduArah <panduarahid@gmail.com>
   TRIAL_VENDOR_EMAIL=panduarahid@gmail.com
   TRIAL_VERIFY_URL=https://panduarah.my.id/trial/verifikasi/
   TRIAL_ADMIN_URL=https://admin.panduarah.my.id
   TRIAL_VISITOR_URL=https://app.panduarah.my.id
   TRIAL_ALLOWED_ORIGIN=https://panduarah.my.id
   SEND_EMAIL_HOOK_SECRET=<rahasia hook dari langkah 4.3>
   ```
   Hapus berkas itu setelah dipasang.
2. Pasang semua fungsi (pengaturan `verify_jwt` dibaca dari `supabase/config.toml`):
   ```sh
   pnpm exec supabase functions deploy
   ```
   Yang dipakai project ini: `publish`, `admin-users`, `auth-email`, `account-notice`,
   `system-settings`, `license-activate`, `license-checkin`, `license-service`, `trial-request`,
   `trial-verify`, `trial-lifecycle`.

## 3. Super Admin vendor dan lisensi server (sebelum Admin dipublikasikan)

1. **Authentication → Users → Add user**: email vendor, password kuat, *Auto Confirm*. Lalu di
   SQL Editor:
   ```sql
   insert into public.profiles (user_id, full_name, email, role)
   select id, 'Vendor PanduArah', email, 'super_admin' from auth.users
   where email = '<email vendor>';
   ```
   Profil ini akses-semua (`all_venues` bawaan true): staf vendor melihat semua venue, termasuk
   venue trial, untuk dukungan.
2. Catat ID instalasi: `select instance_id from public.installation;`
3. Terbitkan lisensi server berpaket `hosting` dengan kunci vendor asli. Kuota venue, gedung,
   lantai, dan Info Point dihitung untuk **seluruh project** (venue demo + semua trial), jadi beri
   ruang lega; batas per trial sudah ditegakkan terpisah (`app.trial_quota`). Tanpa `cad_import`
   (konverter DXF tidak berjalan di hosting).
   Path kunci dan `--out` harus **absolut**: `pnpm --filter` menjalankan CLI dari
   `tools/license-cli`, jadi path relatif terhadap root repo tidak ditemukan.
   ```sh
   pnpm --filter @indoor/license-cli license-cli issue --key ~/indoor-license-keys/license-private.pkcs8.b64 \
     --client "PanduArah Hosting" --plan hosting --instance <instance_id> --until 2027-12-31 \
     --venues 100 --buildings 200 --floors 600 --info-points 100 --features 3d,info_point \
     --out hosting.json
   ```
4. Pasang lisensi setelah Admin bisa dibuka (langkah 5): masuk sebagai Super Admin → halaman
   **Aktivasi instalasi** → tab **Unggah berkas** → pilih `hosting.json` → **Pasang lisensi**.
   Catat tanggal berakhirnya: **lisensi server yang kedaluwarsa menghentikan Visitor semua
   trial**; perpanjang lewat **Lisensi → Pasang lisensi baru**.
5. Check-in lisensi ke server vendor (`LICENSE_VENDOR_URL`) belum ada untuk project ini; Super
   Admin akan melihat banner "check-in gagal" setelah 7 hari. Banner itu tidak tampil ke pemohon
   trial.

## 4. Auth

1. **Authentication → URL Configuration**: *Site URL* `https://admin.panduarah.my.id`;
   *Redirect URLs* `https://admin.panduarah.my.id/**` (tautan buat password di email "Trial siap").
2. **Authentication → Providers → Email**: matikan *Allow new users to sign up* (akun hanya dibuat
   provisioning dan undangan, sama dengan `enable_signup = false` lokal).
3. **Authentication → Hooks**:
   - *Send Email*: HTTP `https://<ref>.supabase.co/functions/v1/auth-email`; salin rahasianya ke
     `SEND_EMAIL_HOOK_SECRET` (langkah 2.1) lalu `supabase secrets set` ulang.
   - *Password Verification Attempt*: fungsi Postgres `app.hook_password_verification_attempt`
     (penguncian setelah gagal masuk berulang).
4. Setelah Admin terbuka: **Pengaturan → Sistem** → URL publik Visitor
   `https://app.panduarah.my.id`, dan SMTP Gmail yang sama (email akun: reset password, undangan).

## 5. Cloudflare Pages

Hubungkan repo GitHub; *production branch* `production` (lihat `docs/07-aturan-branch.md`).
Variabel `NODE_VERSION` = isi `.nvmrc`. Admin dan Visitor adalah SPA: tanpa `404.html`, Pages
otomatis menyajikan `index.html` untuk alamat yang tidak dikenal.

| Situs | Domain | Build command | Output | Variabel |
| --- | --- | --- | --- | --- |
| Landing (sudah ada) | `panduarah.my.id` | `pnpm --filter @indoor/landing build` | `apps/landing/dist` | `VITE_SUPABASE_URL`, `VITE_VISITOR_URL=https://app.panduarah.my.id` |
| Admin | `admin.panduarah.my.id` | `pnpm --filter @indoor/admin build` | `apps/admin/dist` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Visitor | `app.panduarah.my.id` | `pnpm --filter @indoor/visitor build` | `apps/visitor/dist` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Vendor | `vendor.panduarah.my.id` | — | — | Menyusul T-617 (dasbor vendor, butuh 2FA T-592) |

`VITE_CAD_CONVERTER_URL` dibiarkan kosong: unggah DXF nonaktif (paket hosting tanpa impor CAD).

## 6. DNS

Domain sudah memakai nameserver Cloudflare. Di tiap project Pages: **Custom domains → Set up a
custom domain** — Cloudflare membuat CNAME-nya.

## 7. Data demo dan keepalive

1. Venue demo wajib ada: menjadi demo publik `/v/demo` **dan sumber data contoh setiap trial**
   (slug `demo`, `demo-mal`, `demo-kampus`, `demo-kantor`, `demo-bandara`, `demo-pabrik`,
   `demo-konser`). Dari laptop, terhadap project ter-hosting:
   ```sh
   SUPABASE_API_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=<anon key> \
   SEED_ADMIN_EMAIL=<email vendor> SEED_ADMIN_PASSWORD=<password vendor> \
   SEED_VISITOR_URL=https://app.panduarah.my.id SEED_DEMO_USERS=0 \
   pnpm db:seed-demo:hosted
   ```
   `SEED_DEMO_USERS=0` wajib: akun demo lokal memakai password seed yang sama dan tidak boleh ada
   di server publik. Jangan berikan `SUPABASE_SERVICE_ROLE_KEY` ke perintah ini.
2. GitHub → Settings → Secrets and variables → Actions: `HOSTING_SUPABASE_URL` dan
   `HOSTING_SUPABASE_ANON_KEY`. Workflow `.github/workflows/hosting-keepalive.yml` menjalankan
   query ringan tiap hari (jadwal GitHub hanya berjalan dari branch default).

## 8. Uji asap

1. `https://app.panduarah.my.id/v/demo` menampilkan peta rumah sakit demo.
2. Landing → **Coba gratis 17 hari** → isi dengan email sendiri → email "Konfirmasi trial" → klik
   → "Ruang kerja Anda siap" → email "Trial PanduArah Anda siap" → buat password → Admin
   menampilkan "Trial — sisa 17 hari"; Visitor `/v/<slug>` terbuka.
3. SQL Editor: `select email, status, created_at from hosting.trial_requests order by created_at desc;`
4. Hapus trial uji (tanpa menunggu 24 hari):
   ```sql
   update hosting.trials set ends_at = now() - interval '8 days',
     locked_at = now() - interval '8 days'
   where request_id = (select id from hosting.trial_requests where email = '<email uji>');
   ```
   lalu panggil `https://<ref>.supabase.co/functions/v1/trial-lifecycle` (POST) — venue, berkas,
   dan akunnya dihapus; permintaannya tetap sebagai lead berstatus `deleted`. Agar email itu bisa
   dipakai menguji lagi: `delete from hosting.trial_requests where email = '<email uji>';`

## Operasional

| Kebutuhan | Cara |
| --- | --- |
| Melihat calon klien (sampai dasbor vendor T-617) | `select * from hosting.trial_requests order by created_at desc;` — vendor juga menerima email "Trial aktif", "Trial antre", "Trial berakhir", "Provisioning gagal" |
| Menolak spam/pesaing | `insert into hosting.blocklist (value, kind) values ('spam.example', 'domain');` (atau `'nama@contoh.id', 'email'`) |
| Kapasitas | `update app.server_settings set value = '20' where key = 'trial_capacity';` — naik kelas ke Supabase Pro bila sering penuh; arsitektur tidak berubah |
| Membuka kunci trial | `update hosting.trials set locked_at = null, ends_at = now() + interval '7 days' where venue_id = '<venue>';` lalu Super Admin menerbitkan ulang peta venue itu |
| Privasi | Isian form dihapus otomatis setelah 12 bulan (`hosting_lifecycle_forget`), ruang kerja 7 hari setelah trial berakhir — sesuai kebijakan privasi landing |
| Lisensi server | Perpanjang sebelum berakhir (langkah 3) |
