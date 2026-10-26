# Fungsi bersama skrip paket instalasi. Di-source, bukan dijalankan.
# Di server klien semua skrip ada di folder instalasi (mis. /opt/panduarah) bersama compose.yml,
# migrations/, dan release.env dari arsip rilis; di repo, folder ini adalah deploy/.
# shellcheck shell=bash disable=SC2034

DEPLOY_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ENV_FILE="$DEPLOY_DIR/.env"
BACKUP_DIR="$DEPLOY_DIR/backups"
RELEASES_DIR="$DEPLOY_DIR/releases"
# Isi arsip rilis selain rahasia dan data: diganti saat upgrade, disimpan untuk rollback.
RELEASE_FILES=(compose.yml lib.sh install.sh upgrade.sh rollback.sh backup.sh restore.sh migrate.sh
  README.md SUMBER-TERBUKA.md release.env dev-hook-secret.sha256 db migrations licenses)

say() { printf '\033[1m==>\033[0m %s\n' "$*"; }
die() { printf '\033[31mGAGAL:\033[0m %s\n' "$*" >&2; exit 1; }

dc() { docker compose --project-directory "$DEPLOY_DIR" -f "$DEPLOY_DIR/compose.yml" --env-file "$ENV_FILE" "$@"; }

load_env() {
  [ -f "$ENV_FILE" ] || die ".env belum ada di $DEPLOY_DIR. Jalankan install.sh lebih dulu."
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

# Versi dan nama image dari release.env di folder rilis (dibuat build-release.sh).
release_value() {
  local dir=$1 key=$2
  sed -n "s/^$key=//p" "$dir/release.env" 2>/dev/null
}

release_version() {
  local version
  version=$(release_value "${1:-$DEPLOY_DIR}" APP_VERSION)
  [ -n "$version" ] || die "release.env tidak ada di ${1:-$DEPLOY_DIR}: ini bukan folder paket rilis."
  printf '%s' "$version"
}

# Image paket rilis dari arsip (images.tar, instalasi tanpa internet) atau dari registry vendor.
fetch_images() {
  local dir=$1
  if [ -f "$dir/images.tar" ]; then
    say "Memuat image dari images.tar"
    docker load -q -i "$dir/images.tar" >/dev/null
  else
    say "Mengunduh image dari registry"
    docker compose --project-directory "$dir" -f "$dir/compose.yml" --env-file "$ENV_FILE" pull -q
  fi
}

# Setiap image compose sudah ada di mesin ini, jadi `up` tidak perlu mengunduh apa pun.
images_present() {
  local dir=${1:-$DEPLOY_DIR} image missing=()
  while read -r image; do
    docker image inspect "$image" >/dev/null 2>&1 || missing+=("$image")
  done < <(docker compose --project-directory "$dir" -f "$dir/compose.yml" --env-file "$ENV_FILE" \
    --profile tools config --images)
  [ ${#missing[@]} -eq 0 ] || { printf 'Image belum ada: %s\n' "${missing[*]}" >&2; return 1; }
}

# Mengganti berkas rilis di folder instalasi tanpa menyentuh .env, backups/, certs/, releases/.
# Berkas diganti lewat mv (inode baru), sehingga skrip yang sedang berjalan tidak ikut berubah.
install_release_files() {
  local from=$1 to=$2 item
  mkdir -p "$to"
  for item in "${RELEASE_FILES[@]}"; do
    [ -e "$from/$item" ] || continue
    rm -rf "$to/.$item.new"
    cp -a "$from/$item" "$to/.$item.new"
    rm -rf "$to/$item.old"
    [ -e "$to/$item" ] && mv "$to/$item" "$to/$item.old"
    mv "$to/.$item.new" "$to/$item"
    rm -rf "$to/$item.old"
  done
}

migration_count() { find "$DEPLOY_DIR/migrations" -maxdepth 1 -name '*.sql' | wc -l; }

psql_db() { dc exec -T db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -X -At "$@"; }

# Semua layanan menjawab lewat gateway internal dan semua migrasi rilis ini sudah diterapkan.
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
