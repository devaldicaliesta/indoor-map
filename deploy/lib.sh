# Fungsi bersama skrip deploy/. Di-source, bukan dijalankan.
# shellcheck shell=bash

DEPLOY_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_DIR=$(dirname "$DEPLOY_DIR")
ENV_FILE="$DEPLOY_DIR/.env"
BACKUP_DIR="$DEPLOY_DIR/backups"

say() { printf '\033[1m==>\033[0m %s\n' "$*"; }
die() { printf '\033[31mGAGAL:\033[0m %s\n' "$*" >&2; exit 1; }

dc() { docker compose --project-directory "$DEPLOY_DIR" -f "$DEPLOY_DIR/compose.yml" --env-file "$ENV_FILE" "$@"; }

load_env() {
  [ -f "$ENV_FILE" ] || die "deploy/.env belum ada. Jalankan deploy/install.sh lebih dulu."
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
}

set_env() {
  local key=$1 value=$2
  if grep -q "^$key=" "$ENV_FILE"; then
    sed -i "s|^$key=.*|$key=$value|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
  fi
}

current_version() { git -C "$REPO_DIR" rev-parse --short=12 HEAD; }

# Build rilis wajib memakai kunci publik lisensi vendor, bukan kunci dev yang privatnya ada di repo.
assert_release_license_key() {
  local file="$REPO_DIR/packages/domain/src/license.publicKey.ts" dev value
  dev=$(sed -n "s/^export const LICENSE_DEV_PUBLIC_KEY = '\(.*\)';/\1/p" "$file")
  value=$(sed -n "s/^export const LICENSE_PUBLIC_KEY = \(.*\);/\1/p" "$file")
  if [ -z "$value" ] || [ "$value" = "LICENSE_DEV_PUBLIC_KEY" ] || [ "$value" = "'$dev'" ]; then
    die "Build ini memakai kunci lisensi DEV. Paket rilis wajib memakai kunci publik vendor (license-cli keygen) di packages/domain/src/license.publicKey.ts."
  fi
}

migration_count() { find "$REPO_DIR/supabase/migrations" -maxdepth 1 -name '*.sql' | wc -l; }

psql_db() { dc exec -T db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -X -At "$@"; }

# Semua layanan menjawab lewat gateway internal dan semua migrasi di checkout ini sudah diterapkan.
health_check() {
  local tries=${1:-60} i
  for ((i = 1; i <= tries; i++)); do
    if health_once 2>/dev/null; then
      say "Health check lulus."
      return 0
    fi
    sleep 5
  done
  health_once || true
  return 1
}

health_once() {
  local gw=http://127.0.0.1:8000 applied expected
  dc exec -T web wget -qO- "$gw/auth/v1/health" >/dev/null || { echo "auth belum siap" >&2; return 1; }
  dc exec -T web wget -qO- --header "apikey: $ANON_KEY" "$gw/rest/v1/" >/dev/null ||
    { echo "rest belum siap" >&2; return 1; }
  dc exec -T web wget -qO- "$gw/storage/v1/status" >/dev/null || { echo "storage belum siap" >&2; return 1; }
  # license-service membaca database dan Storage lewat gateway: bukti seluruh rantai jalan.
  dc exec -T web wget -qO- --post-data '{}' --header 'Content-Type: application/json' \
    "$gw/functions/v1/license-service" >/dev/null ||
    { echo "functions belum siap" >&2; return 1; }
  dc exec -T web test -f /srv/admin/index.html -a -f /srv/visitor/index.html || { echo "web tanpa build" >&2; return 1; }
  applied=$(psql_db -c 'select count(*) from supabase_migrations.schema_migrations') || return 1
  expected=$(migration_count)
  [ "$applied" -ge "$expected" ] || { echo "migrasi $applied/$expected" >&2; return 1; }
}
