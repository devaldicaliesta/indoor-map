#!/usr/bin/env bash
# Instalasi dari nol: cek prasyarat, buat deploy/.env (rahasia dibangkitkan di server ini),
# build image, jalankan layanan dan migrasi, pasang backup harian, tampilkan URL aktivasi.
# Tanpa terminal (otomasi), isian dibaca dari variabel lingkungan dengan nama yang sama.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

check_prerequisites() {
  say "Memeriksa prasyarat"
  command -v docker >/dev/null || die "Docker belum terpasang (lihat deploy/README.md)."
  docker compose version >/dev/null 2>&1 || die "Docker Compose v2 belum terpasang."
  docker info >/dev/null 2>&1 || die "Docker daemon tidak bisa diakses (jalankan sebagai root atau anggota grup docker)."
  command -v openssl >/dev/null || die "openssl belum terpasang."
  command -v git >/dev/null || die "git belum terpasang."
  local mem_gb disk_gb
  mem_gb=$(awk '/MemTotal/ {printf "%d", $2 / 1024 / 1024}' /proc/meminfo)
  disk_gb=$(df -Pk "$DEPLOY_DIR" | awk 'NR == 2 {printf "%d", $4 / 1024 / 1024}')
  [ "$mem_gb" -ge 3 ] || say "PERINGATAN: RAM ${mem_gb} GB; minimum 4 GB (README)."
  [ "$disk_gb" -ge 20 ] || say "PERINGATAN: ruang disk kosong ${disk_gb} GB; minimum 20 GB (README)."
  assert_release_license_key
}

ask() {
  local var=$1 prompt=$2 default=${3:-} value=${!1:-}
  if [ -z "$value" ] && [ -t 0 ]; then
    read -r -p "$prompt${default:+ [$default]}: " value
  fi
  value=${value:-$default}
  [ -n "$value" ] || die "$var wajib diisi."
  printf -v "$var" '%s' "$value"
}

b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

jwt() {
  local role=$1 now header payload signature
  now=$(date +%s)
  header=$(printf '{"alg":"HS256","typ":"JWT"}' | b64url)
  payload=$(printf '{"role":"%s","iss":"supabase","iat":%d,"exp":%d}' "$role" "$now" $((now + 10 * 365 * 24 * 3600)) | b64url)
  signature=$(printf '%s.%s' "$header" "$payload" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | b64url)
  printf '%s.%s.%s' "$header" "$payload" "$signature"
}

tls_directive() {
  case $TLS_MODE in
    auto) ask ACME_EMAIL "Email untuk Let's Encrypt"; printf '%s' "$ACME_EMAIL" ;;
    files)
      [ -f "$DEPLOY_DIR/certs/cert.pem" ] && [ -f "$DEPLOY_DIR/certs/key.pem" ] ||
        die "Sertifikat klien tidak ditemukan: letakkan deploy/certs/cert.pem dan deploy/certs/key.pem."
      printf '/certs/cert.pem /certs/key.pem' ;;
    internal) printf 'internal' ;;
    *) die "TLS_MODE harus auto, files, atau internal." ;;
  esac
}

write_env() {
  say "Membuat deploy/.env"
  ask ADMIN_DOMAIN "Domain Admin (mis. admin.peta.klien.co.id)"
  ask VISITOR_DOMAIN "Domain Visitor (mis. peta.klien.co.id)"
  ask API_DOMAIN "Domain API (mis. api.peta.klien.co.id)"
  ask TLS_MODE "HTTPS: auto (Let's Encrypt) / files (sertifikat klien) / internal" auto
  local tls
  tls=$(tls_directive)
  LICENSE_VENDOR_URL=${LICENSE_VENDOR_URL-}
  if [ -z "$LICENSE_VENDOR_URL" ] && [ -t 0 ]; then
    read -r -p "Alamat layanan lisensi vendor (kosong = aktivasi manual saja): " LICENSE_VENDOR_URL
  fi

  POSTGRES_PASSWORD=$(openssl rand -hex 32)
  JWT_SECRET=$(openssl rand -hex 32)
  local hook_secret anon service
  hook_secret="v1,whsec_$(openssl rand -base64 32)"
  anon=$(jwt anon)
  service=$(jwt service_role)

  umask 077
  cat >"$ENV_FILE" <<ENV
# Dibuat deploy/install.sh pada $(date -Iseconds). RAHASIA: jangan dibagikan atau di-commit.
# Salinannya ikut di setiap backup; tanpa file ini backup tidak bisa dipulihkan di server lain.
ADMIN_DOMAIN=$ADMIN_DOMAIN
VISITOR_DOMAIN=$VISITOR_DOMAIN
API_DOMAIN=$API_DOMAIN
TLS_DIRECTIVE=$tls
LICENSE_VENDOR_URL=$LICENSE_VENDOR_URL
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$anon
SERVICE_ROLE_KEY=$service
SEND_EMAIL_HOOK_SECRET=$hook_secret
APP_VERSION=$(current_version)
ENV
  umask 022
}

# Rahasia hook email di supabase/config.toml hanya untuk lokal; instalasi wajib punya miliknya.
assert_own_hook_secret() {
  local repo_secret
  repo_secret=$(sed -n 's/^SEND_EMAIL_HOOK_SECRET = "\(.*\)"/\1/p' "$REPO_DIR/supabase/config.toml")
  [ "$SEND_EMAIL_HOOK_SECRET" != "$repo_secret" ] ||
    die "SEND_EMAIL_HOOK_SECRET sama dengan rahasia lokal di repo. Hapus deploy/.env lalu jalankan ulang."
  [[ $SEND_EMAIL_HOOK_SECRET == v1,whsec_* ]] || die "Format SEND_EMAIL_HOOK_SECRET harus v1,whsec_<base64>."
}

install_backup_schedule() {
  local cron=/etc/cron.d/indoor-map-backup
  if [ -w /etc/cron.d ]; then
    printf '# Backup harian Indoor Map (deploy/backup.sh), retensi 14 hari.\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n30 2 * * * root %s >>%s/backup.log 2>&1\n' \
      "$DEPLOY_DIR/backup.sh" "$BACKUP_DIR" >"$cron"
    say "Backup harian terjadwal pukul 02.30 ($cron)."
  else
    say "PERINGATAN: tidak bisa menulis /etc/cron.d. Jadwalkan $DEPLOY_DIR/backup.sh harian secara manual."
  fi
}

main() {
  check_prerequisites
  mkdir -p "$BACKUP_DIR" "$DEPLOY_DIR/certs"
  if [ -f "$ENV_FILE" ]; then
    say "deploy/.env sudah ada; rahasia lama dipakai ulang."
  else
    write_env
  fi
  load_env
  assert_own_hook_secret

  say "Build image (beberapa menit pada instalasi pertama)"
  dc build
  say "Menjalankan layanan"
  dc up -d
  say "Menerapkan migrasi database"
  dc run --rm migrate
  health_check || die "Layanan belum sehat. Periksa: docker compose -f deploy/compose.yml logs"
  install_backup_schedule

  cat <<DONE

Instalasi selesai.
  1. Buka https://$ADMIN_DOMAIN/aktivasi
  2. Unggah berkas lisensi (atau aktivasi online), lalu buat Super Admin pertama.
  Visitor: https://$VISITOR_DOMAIN  ·  API: https://$API_DOMAIN
  Isi "URL publik Visitor" di Pengaturan Sistem dengan https://$VISITOR_DOMAIN
DONE
}

main "$@"
