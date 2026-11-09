#!/usr/bin/env bash
# Laporan Kesehatan sistem (Admin → Kesehatan sistem): status layanan, versi, disk, dan
# sertifikat HTTPS ditulis ke database lewat app.health_report (migrasi 0061). Dijalankan cron
# tiap 15 menit; peringatan dan email diputuskan database.
#   ./health-report.sh                 kirim laporan sekarang (mencetak JSON yang dikirim)
#   ./health-report.sh --pasang-jadwal pasang/perbarui jadwal cron backup dan laporan
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env

if [ "${1:-}" = "--pasang-jadwal" ]; then
  install_schedules
  exit 0
fi

# Nilai dari docker/df/openssl hanya huruf, angka, dan tanda baca path; tetap dibersihkan agar
# JSON yang disusun di sini selalu sah.
clean() { printf '%s' "$1" | tr -cd 'A-Za-z0-9._/:-'; }

services_json() {
  local name state health items=()
  while IFS=$'\t' read -r name state health; do
    [ -n "$name" ] || continue
    items+=("{\"name\":\"$(clean "$name")\",\"state\":\"$(clean "$state")\",\"health\":\"$(clean "$health")\"}")
  done < <(dc ps --all --format '{{.Service}}	{{.State}}	{{.Health}}' 2>/dev/null)
  local IFS=,
  printf '[%s]' "${items[*]}"
}

disk_json() {
  local path=$1 total used
  read -r total used < <(df -B1 --output=size,used "$path" 2>/dev/null | tail -n 1) || return 0
  [ -n "${total:-}" ] || return 0
  printf '{"path":"%s","total":%d,"used":%d}' "$(clean "$path")" "$total" "$used"
}

disks_json() {
  local docker_root items=()
  docker_root=$(docker info --format '{{.DockerRootDir}}' 2>/dev/null || true)
  # Volume database dan Storage ada di direktori Docker; backup di folder instalasi.
  for path in "$docker_root" "$DEPLOY_DIR"; do
    [ -n "$path" ] && [ -d "$path" ] || continue
    items+=("$(disk_json "$path")")
  done
  local IFS=,
  printf '[%s]' "${items[*]}"
}

# Sertifikat yang benar-benar disajikan gateway untuk domain Admin, apa pun sumbernya
# (Let's Encrypt, sertifikat instansi, atau CA internal).
cert_json() {
  local end expires
  command -v openssl >/dev/null || { printf 'null'; return; }
  end=$(openssl s_client -connect "127.0.0.1:${HTTPS_PORT:-443}" -servername "$ADMIN_DOMAIN" \
    </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | sed 's/^notAfter=//') || true
  # `date -d ""` berarti hari ini: tanpa sertifikat terbaca, laporkan null, bukan "berakhir hari ini".
  [ -n "$end" ] || { printf 'null'; return; }
  expires=$(date -u -d "$end" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null) || { printf 'null'; return; }
  printf '{"domain":"%s","expires_at":"%s"}' "$(clean "$ADMIN_DOMAIN")" "$expires"
}

report=$(printf '{"version":"%s","services":%s,"disks":%s,"cert":%s}' \
  "$(clean "${APP_VERSION:-}")" "$(services_json)" "$(disks_json)" "$(cert_json)")
printf "select app.health_report(:'report'::jsonb);\n" | db_psql -v report="$report" -f - >/dev/null
printf '%s\n' "$report"
