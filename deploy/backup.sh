#!/usr/bin/env bash
# Backup database (pg_basebackup, tanpa menghentikan layanan) + Storage + .env ke
# backups/<waktu>/. Backup lebih tua dari 14 hari dihapus. Mencetak path backup.
set -euo pipefail
. "$(dirname "$0")/lib.sh"
load_env

RETENTION_DAYS=${RETENTION_DAYS:-14}
name=$(date +%Y%m%d-%H%M%S)
target="$BACKUP_DIR/$name"
mkdir -p "$target"
chmod 700 "$BACKUP_DIR" "$target"

say "Backup database ke $target" >&2
dc exec -T db pg_basebackup -U supabase_admin -D "/backups/$name/db" -Ft -z -X fetch --checkpoint=fast
say "Backup Storage" >&2
dc exec -T storage tar czf - -C /var/lib/storage . >"$target/storage.tar.gz"
cp "$ENV_FILE" "$target/env"
printf '%s\n' "$APP_VERSION" >"$target/version"
# Penanda terakhir: restore hanya menerima backup yang lengkap.
date -Iseconds >"$target/complete"

find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' -mtime "+$((RETENTION_DAYS - 1))" \
  -exec rm -rf {} +
say "Backup selesai: $target" >&2
printf '%s\n' "$target"
