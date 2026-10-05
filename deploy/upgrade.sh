#!/usr/bin/env bash
# Pembaruan: deploy/upgrade.sh <tag|commit>
# backup → checkout versi baru → build → migrasi → health check. Bila salah satu gagal setelah
# layanan diganti, versi sebelumnya dan backup tadi dipulihkan otomatis.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

target=${1:-}
[ -n "$target" ] || die "Pemakaian: deploy/upgrade.sh <tag|commit>"
load_env
[ -z "$(git -C "$REPO_DIR" status --porcelain --untracked-files=no)" ] ||
  die "Ada perubahan lokal di $REPO_DIR; simpan atau buang dulu."

previous_ref=$(git -C "$REPO_DIR" rev-parse HEAD)
previous_version=$APP_VERSION

say "Backup sebelum pembaruan"
backup=$("$DEPLOY_DIR/backup.sh")

say "Mengambil versi $target"
git -C "$REPO_DIR" fetch --tags --quiet origin || say "PERINGATAN: fetch gagal; memakai ref lokal."
git -C "$REPO_DIR" checkout --quiet --detach "$target"
version=$(current_version)

back_to_previous_code() {
  git -C "$REPO_DIR" checkout --quiet --detach "$previous_ref"
  set_env APP_VERSION "$previous_version"
}

# Gagal sebelum layanan diganti: cukup kembali ke kode lama, data tidak tersentuh.
if ! (assert_release_license_key && APP_VERSION=$version dc build); then
  back_to_previous_code
  die "Build versi $target gagal. Versi $previous_version tetap berjalan."
fi

rollback() {
  say "Pembaruan gagal: kembali ke versi $previous_version dan memulihkan backup"
  back_to_previous_code
  "$DEPLOY_DIR/restore.sh" "$backup" --yes
  die "Pembaruan ke $target dibatalkan. Versi $previous_version berjalan dengan data dari $(basename "$backup")."
}

set_env APP_VERSION "$version"
load_env
say "Menjalankan versi $version"
dc up -d --remove-orphans || rollback
dc run --rm migrate || rollback
health_check 36 || rollback
say "Pembaruan ke $target ($version) selesai. Backup sebelum pembaruan: $backup"
