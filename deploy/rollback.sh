#!/usr/bin/env bash
# Membatalkan pembaruan terakhir: ./rollback.sh [--yes]
# Berkas rilis lama dari releases/<versi>/ dipasang lagi, lalu database dan Storage dipulihkan
# dari backup yang dibuat upgrade.sh tepat sebelum pembaruan. Data yang masuk setelah
# pembaruan ikut hilang. Image versi lama masih ada di Docker sejak versi itu terpasang.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

load_env
current=$APP_VERSION
previous=$(cat "$RELEASES_DIR/previous" 2>/dev/null) || die "Belum ada pembaruan yang bisa dibatalkan."
dir="$RELEASES_DIR/$previous"
backup=$(cat "$dir/backup")
[ -f "$backup/complete" ] || die "Backup sebelum pembaruan ($backup) sudah tidak ada."
prefix=$(release_value "$dir" IMAGE_PREFIX)
# shellcheck disable=SC2030 # sengaja hanya untuk subshell: memeriksa image versi lama
(export APP_VERSION=$previous IMAGE_PREFIX=$prefix && images_present "$dir") ||
  die "Image versi $previous sudah dihapus dari Docker. Muat dulu: docker load -i <images.tar arsip $previous>."

if [ "${1:-}" != "--yes" ]; then
  read -r -p "Kembali dari $current ke $previous; data sejak $(basename "$backup") hilang. Ketik KEMBALI untuk lanjut: " answer
  [ "$answer" = KEMBALI ] || die "Dibatalkan."
fi

install_release_files "$dir" "$DEPLOY_DIR"
set_env APP_VERSION "$previous"
set_env IMAGE_PREFIX "$prefix"
"$DEPLOY_DIR/restore.sh" "$backup" --yes
rm -f "$RELEASES_DIR/previous"
say "Rollback $current → $previous selesai."
