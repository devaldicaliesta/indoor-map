// Kunci publik vendor (Ed25519, 32 bait mentah, base64) untuk memeriksa berkas lisensi.
// Sengaja ditanam di kode, bukan dibaca dari konfigurasi: klien on-premise mengendalikan
// konfigurasinya sendiri dan bisa memasang kunci miliknya. Diganti per build rilis dengan
// keluaran `license-cli keygen`; kunci privat pasangannya tidak pernah masuk repo.
export const LICENSE_PUBLIC_KEY = 'zp0+cfPx25szlRSU5eKvBkEkNSe92RXNB1vOWnPVc7g=';
