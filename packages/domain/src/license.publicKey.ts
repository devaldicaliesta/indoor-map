// Kunci publik vendor (Ed25519, 32 bait mentah, base64) untuk memeriksa berkas lisensi.
// Sengaja ditanam di kode, bukan dibaca dari konfigurasi: klien on-premise mengendalikan
// konfigurasinya sendiri dan bisa memasang kunci miliknya.
//
// Nilai di repo adalah kunci DEV: kunci privatnya ada di `tools/license-cli/dev-keys/` agar
// pengembangan dan test bisa memakai lisensi sah. Build rilis WAJIB mengganti nilai ini dengan
// keluaran `license-cli keygen` milik vendor; paket instalasi (T-411) menolak build yang masih
// memakai `LICENSE_DEV_PUBLIC_KEY`.
export const LICENSE_DEV_PUBLIC_KEY = 'BMshNVa3pErwTUL4XS3qIebn/SR/5Q5WPMVPNjKrw8A=';

export const LICENSE_PUBLIC_KEY = LICENSE_DEV_PUBLIC_KEY;
