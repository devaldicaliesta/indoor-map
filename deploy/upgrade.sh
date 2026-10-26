#!/usr/bin/env bash
# Pembaruan dari arsip rilis vendor: ./upgrade.sh <panduarah-versi.tar.gz>
# muat image → backup → simpan berkas rilis lama di releases/ → pasang berkas baru → jalankan →
# migrasi → health check. Bila salah satu gagal setelah layanan diganti, rilis sebelumnya dan
# backup tadi dipulihkan otomatis. Rollback manual sesudahnya: ./rollback.sh.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

archive=${1:-}
[ -f "$archive" ] || die "Pemakaian: upgrade.sh <panduarah-versi.tar.gz>"
load_env
previous_version=$APP_VERSION
previous_prefix=${IMAGE_PREFIX:-panduarah}

if [ -f "$archive.sha256" ]; then
  (cd "$(dirname "$archive")" && sha256sum -c --quiet "$(basename "$archive").sha256") ||
    die "Checksum $archive tidak cocok; unduh ulang arsip rilis."
else
  say "PERINGATAN: $archive.sha256 tidak ada; checksum arsip tidak diperiksa."
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
tar -xzf "$archive" -C "$work"
new_dir=$(find "$work" -mindepth 2 -maxdepth 2 -name release.env -printf '%h\n' | head -n 1)
[ -n "$new_dir" ] || die "$archive bukan arsip rilis PanduArah."
version=$(release_version "$new_dir")
prefix=$(release_value "$new_dir" IMAGE_PREFIX)
[ "$version" != "$previous_version" ] || die "Versi $version sudah terpasang."

# Gagal sebelum layanan diganti: versi lama tetap berjalan, data tidak tersentuh.
if ! (export APP_VERSION=$version IMAGE_PREFIX=$prefix && fetch_images "$new_dir" && images_present "$new_dir"); then
  die "Image versi $version tidak bisa dimuat. Versi $previous_version tetap berjalan."
fi

say "Backup sebelum pembaruan"
backup=$("$DEPLOY_DIR/backup.sh")

say "Menyimpan rilis $previous_version di releases/ untuk rollback"
rm -rf "${RELEASES_DIR:?}/$previous_version"
install_release_files "$DEPLOY_DIR" "$RELEASES_DIR/$previous_version"
printf '%s\n' "$backup" >"$RELEASES_DIR/$previous_version/backup"
printf '%s\n' "$previous_version" >"$RELEASES_DIR/previous"

rollback() {
  say "Pembaruan gagal: kembali ke versi $previous_version dan memulihkan backup"
  install_release_files "$RELEASES_DIR/$previous_version" "$DEPLOY_DIR"
  set_env APP_VERSION "$previous_version"
  set_env IMAGE_PREFIX "$previous_prefix"
  "$DEPLOY_DIR/restore.sh" "$backup" --yes
  rm -f "$RELEASES_DIR/previous"
  die "Pembaruan ke $version dibatalkan. Versi $previous_version berjalan dengan data dari $(basename "$backup")."
}

install_release_files "$new_dir" "$DEPLOY_DIR"
set_env APP_VERSION "$version"
set_env IMAGE_PREFIX "$prefix"
load_env
say "Menjalankan versi $version"
dc up -d --remove-orphans || rollback
dc run --rm migrate || rollback
health_check 36 || rollback
say "Pembaruan $previous_version → $version selesai. Backup sebelum pembaruan: $backup"
