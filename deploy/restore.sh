#!/usr/bin/env bash
# Memulihkan database dan Storage dari backup: ./restore.sh <folder-backup|latest> [--yes]
# Data saat ini DIGANTI seluruhnya. Layanan berhenti selama pemulihan.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

source_dir=${1:-}
[ -n "$source_dir" ] || die "Pemakaian: restore.sh <folder-backup|latest> [--yes]"
if [ "$source_dir" = latest ]; then
  source_dir=$(find "$BACKUP_DIR" -mindepth 2 -maxdepth 2 -name complete -printf '%h\n' | sort | tail -n 1)
fi
source_dir=$(cd "$source_dir" 2>/dev/null && pwd) || die "Folder backup tidak ditemukan."
[ -f "$source_dir/complete" ] || die "Backup $source_dir tidak lengkap."
[ -f "$source_dir/db/base.tar.gz" ] || die "Backup database tidak ada di $source_dir/db."
case $source_dir in "$BACKUP_DIR"/*) ;; *) die "Backup harus berada di $BACKUP_DIR." ;; esac
name=$(basename "$source_dir")

# Skema database backup harus cocok dengan migrasi dan image paket yang terpasang.
backup_version=$(cat "$source_dir/version")
[ "$backup_version" = "$(release_version)" ] ||
  die "Backup dari versi $backup_version, paket di $DEPLOY_DIR versi $(release_version). Pasang paket versi $backup_version lebih dulu."

# Server baru: .env (rahasia dan kunci) ikut dipulihkan dari backup.
[ -f "$ENV_FILE" ] || install -m 600 "$source_dir/env" "$ENV_FILE"
load_env
if ! images_present 2>/dev/null; then
  fetch_images "$DEPLOY_DIR"
  images_present || die "Image versi $APP_VERSION tidak lengkap."
fi

if [ "${2:-}" != "--yes" ]; then
  read -r -p "Semua data saat ini diganti dengan backup $name. Ketik PULIHKAN untuk lanjut: " answer
  [ "$answer" = PULIHKAN ] || die "Dibatalkan."
fi

say "Menghentikan layanan"
dc down
docker volume rm -f "indoor-map_db-data" "indoor-map_storage-data" >/dev/null

say "Memulihkan database"
dc run --rm --no-deps -T --entrypoint bash db -c "
  set -e
  tar xzf /backups/$name/db/base.tar.gz -C /var/lib/postgresql/data
  chown -R postgres:postgres /var/lib/postgresql/data
  chmod 700 /var/lib/postgresql/data"

say "Memulihkan Storage"
dc run --rm --no-deps -T --user root --entrypoint sh storage -c 'tar xzf - -C /var/lib/storage' \
  <"$source_dir/storage.tar.gz"

say "Menjalankan layanan"
dc up -d
health_check || die "Layanan belum sehat setelah pemulihan. Periksa: docker compose -f $DEPLOY_DIR/compose.yml logs"
say "Pemulihan dari $name selesai."
