#!/usr/bin/env bash
# Build rilis di mesin vendor (tidak ikut paket klien):
#   deploy/build-release.sh <versi> --public-key <license-public.b64> [--save] [--push <registry>]
#
# Kode diambil dari commit HEAD (git archive), kunci publik lisensi vendor ditanam di salinan itu,
# lalu image web, functions, dan cad-converter dibangun dengan tag <versi>. Hasil di deploy/out/:
#   panduarah-<versi>/              isi paket klien: compose.yml, skrip, migrasi (tanpa kode sumber)
#   panduarah-<versi>.tar.gz        arsip yang dikirim ke klien, beserta .sha256
# --save        image (aplikasi dan Supabase) ikut di arsip sebagai images.tar: instalasi tanpa internet
# --push <reg>  image aplikasi didorong ke registry privat vendor; server klien menariknya
# DOCKER_BUILD_FLAGS (opsional) diteruskan ke docker build, mis. "--network host" di balik proxy.
set -euo pipefail
. "$(dirname "$0")/lib.sh"

REPO_DIR=$(dirname "$DEPLOY_DIR")
OUT_DIR="$DEPLOY_DIR/out"
KEY_FILE_IN_REPO=packages/domain/src/license.publicKey.ts
# Nama image → target di deploy/Dockerfile.
declare -A TARGETS=([web]=web [functions]=functions [cad-converter]=cad)

usage() { die "Pemakaian: deploy/build-release.sh <versi> --public-key <license-public.b64> [--save] [--push <registry>]"; }

parse_args() {
  version=${1:-}
  [ -n "$version" ] || usage
  shift
  public_key_file='' save=false registry=''
  while [ $# -gt 0 ]; do
    case $1 in
      --public-key) public_key_file=${2:-}; shift 2 || usage ;;
      --save) save=true; shift ;;
      --push) registry=${2:-}; shift 2 || usage; [ -n "$registry" ] || usage ;;
      *) usage ;;
    esac
  done
  [[ $version =~ ^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$ ]] || die "Versi '$version' tidak sah (huruf, angka, . _ -)."
  [ -n "$public_key_file" ] || usage
  [ -f "$public_key_file" ] || die "Berkas kunci publik $public_key_file tidak ditemukan."
  $save || [ -n "$registry" ] || die "Pilih --save (arsip berisi image) dan/atau --push <registry>."
  prefix="${registry:+$registry/}panduarah"
}

# Rilis selalu dari commit, agar isi image bisa dilacak dan berkas yang belum di-commit tidak ikut.
export_source() {
  [ -z "$(git -C "$REPO_DIR" status --porcelain --untracked-files=no)" ] ||
    die "Ada perubahan yang belum di-commit. Rilis dibangun dari commit; commit atau buang dulu."
  commit=$(git -C "$REPO_DIR" rev-parse --short=12 HEAD)
  src=$(mktemp -d)
  trap 'rm -rf "$src"' EXIT
  git -C "$REPO_DIR" archive HEAD | tar -x -C "$src"
  # CA proxy perusahaan (tidak di-commit) tetap dipakai build bila ada.
  cp "$DEPLOY_DIR"/ca/*.crt "$src/deploy/ca/" 2>/dev/null || true
}

# Kunci publik vendor menggantikan kunci DEV, yang kunci privatnya ada di repo.
plant_vendor_key() {
  local file="$src/$KEY_FILE_IN_REPO" dev
  vendor_key=$(tr -d '[:space:]' <"$public_key_file")
  dev=$(sed -n "s/^export const LICENSE_DEV_PUBLIC_KEY = '\(.*\)';/\1/p" "$file")
  [ -n "$dev" ] || die "LICENSE_DEV_PUBLIC_KEY tidak ditemukan di $KEY_FILE_IN_REPO."
  [ "$vendor_key" != "$dev" ] ||
    die "Kunci lisensi DEV ditolak: kunci privatnya ada di repo. Pakai kunci publik vendor (license-cli keygen)."
  [[ $vendor_key =~ ^[A-Za-z0-9+/]{43}=$ ]] && [ "$(printf '%s' "$vendor_key" | base64 -d | wc -c)" -eq 32 ] ||
    die "Isi $public_key_file bukan kunci publik Ed25519 (32 bait, base64)."
  sed -i "s|^export const LICENSE_PUBLIC_KEY = .*;$|export const LICENSE_PUBLIC_KEY = '$vendor_key';|" "$file"
  grep -qx "export const LICENSE_PUBLIC_KEY = '$vendor_key';" "$file" ||
    die "Gagal menanam kunci publik vendor di $KEY_FILE_IN_REPO."
}

build_images() {
  local name
  for name in web functions cad-converter; do
    say "Build image $prefix/$name:$version"
    # shellcheck disable=SC2086
    docker build ${DOCKER_BUILD_FLAGS:-} -q -f "$src/deploy/Dockerfile" --target "${TARGETS[$name]}" \
      --label "org.opencontainers.image.version=$version" \
      --label "org.opencontainers.image.revision=$commit" \
      -t "$prefix/$name:$version" "$src" >/dev/null
  done
}

# Bukti dari image itu sendiri: Edge Function lisensi memeriksa dengan kunci vendor.
assert_image_key() {
  local cid line
  cid=$(docker create "$prefix/functions:$version")
  line=$(docker cp "$cid:/srv/packages/domain/src/license.publicKey.ts" - | tar -xO | grep '^export const LICENSE_PUBLIC_KEY')
  docker rm "$cid" >/dev/null
  [ "$line" = "export const LICENSE_PUBLIC_KEY = '$vendor_key';" ] ||
    die "Image functions tidak memakai kunci publik vendor ($line)."
}

assemble_package() {
  pkg="$OUT_DIR/panduarah-$version"
  say "Menyusun paket klien $pkg"
  rm -rf "$pkg" "$pkg.tar.gz" "$pkg.tar.gz.sha256"
  mkdir -p "$pkg/db" "$pkg/migrations"
  cp "$src/deploy/"{compose.yml,lib.sh,install.sh,upgrade.sh,rollback.sh,backup.sh,restore.sh,migrate.sh,README.md,SUMBER-TERBUKA.md} "$pkg/"
  cp "$src/deploy/db/"{roles.sql,pg_hba.conf} "$pkg/db/"
  cp "$src/supabase/migrations/"*.sql "$pkg/migrations/"
  printf 'APP_VERSION=%s\nIMAGE_PREFIX=%s\nCOMMIT=%s\n' "$version" "$prefix" "$commit" >"$pkg/release.env"
  # Rahasia hook email lokal (supabase/config.toml) hanya sebagai hash: install.sh menolak .env yang memakainya.
  sed -n 's/^SEND_EMAIL_HOOK_SECRET = "\(.*\)"/\1/p' "$src/supabase/config.toml" | tr -d '\n' |
    sha256sum | cut -d' ' -f1 >"$pkg/dev-hook-secret.sha256"
}

package_images() {
  APP_VERSION=$version IMAGE_PREFIX=$prefix docker compose --project-directory "$pkg" -f "$pkg/compose.yml" \
    --env-file /dev/null --profile tools config --images 2>/dev/null | sort -u
}

# Lisensi pihak ketiga diambil dari image itu sendiri, sehingga sama persis dengan isinya.
copy_from_image() {
  local image=$1 path=$2 target=$3 cid
  cid=$(docker create "$image")
  docker cp "$cid:$path" "$target"
  docker rm "$cid" >/dev/null
}

# Daftar paket OS dan komponen per image, untuk penawaran kode sumber GPL (SUMBER-TERBUKA.md).
os_packages() {
  docker run --rm --entrypoint sh "$1" -c '
    . /etc/os-release 2>/dev/null && echo "# $PRETTY_NAME"
    { apk info -v 2>/dev/null || dpkg-query -W -f "\${Package} \${Version}\n" 2>/dev/null; } | sort
    if [ -d /nix/store ]; then
      echo "# Komponen Nix (/nix/store)"
      ls /nix/store | grep -v "\.drv$" | sed "s/^[a-z0-9]*-//" | sort -u
    fi' 2>/dev/null || echo "# Image tanpa shell dan paket OS (biner statis); sumber: lihat SUMBER-TERBUKA.md"
}

collect_licenses() {
  local dir="$pkg/licenses" image
  say "Mengumpulkan lisensi pihak ketiga"
  mkdir -p "$dir/os-packages"
  copy_from_image "$prefix/web:$version" /opt/panduarah/www/admin/third-party-notices.txt "$dir/admin.txt"
  copy_from_image "$prefix/web:$version" /opt/panduarah/www/visitor/third-party-notices.txt "$dir/visitor.txt"
  copy_from_image "$prefix/functions:$version" /srv/packages/domain/THIRD-PARTY-NOTICES.txt "$dir/functions.txt"
  copy_from_image "$prefix/cad-converter:$version" /srv/THIRD-PARTY-NOTICES.txt "$dir/cad-converter.txt"
  while read -r image; do
    docker image inspect "$image" >/dev/null 2>&1 || docker pull -q "$image" >/dev/null
    os_packages "$image" >"$dir/os-packages/$(printf '%s' "$image" | tr '/:' '__').txt"
  done < <(package_images)
}

save_images() {
  local images
  mapfile -t images < <(package_images)
  say "Menyimpan ${#images[@]} image ke images.tar"
  for image in "${images[@]}"; do
    docker image inspect "$image" >/dev/null 2>&1 || docker pull -q "$image" >/dev/null
  done
  docker save -o "$pkg/images.tar" "${images[@]}"
}

push_images() {
  local name
  for name in web functions cad-converter; do
    say "Push $prefix/$name:$version"
    docker push -q "$prefix/$name:$version" >/dev/null
  done
}

# Paket klien tidak boleh membawa kode sumber, kunci lisensi, rahasia, atau perintah build.
check_package() {
  local dir
  for dir in apps packages supabase services tools node_modules; do
    [ ! -e "$pkg/$dir" ] || die "Paket memuat $dir/."
  done
  [ ! -e "$pkg/.env" ] || die "Paket memuat .env."
  ! grep -rIlE --exclude=images.tar 'LICENSE_(DEV_)?PUBLIC_KEY|PRIVATE KEY' "$pkg" ||
    die "Paket memuat kunci lisensi."
  ! grep -qE '^\s+build:' "$pkg/compose.yml" || die "compose.yml paket masih berisi build:."
  ! grep -qE '\b(git|pnpm|npm)\b' "$pkg"/*.sh || die "Skrip paket masih memanggil git/pnpm/npm."
}

archive_package() {
  say "Membuat arsip"
  tar -C "$OUT_DIR" -czf "$pkg.tar.gz" "panduarah-$version"
  (cd "$OUT_DIR" && sha256sum "panduarah-$version.tar.gz" >"panduarah-$version.tar.gz.sha256")
}

main() {
  parse_args "$@"
  export_source
  plant_vendor_key
  build_images
  assert_image_key
  assemble_package
  collect_licenses
  check_package
  if [ -n "$registry" ]; then push_images; fi
  if $save; then save_images; fi
  archive_package
  say "Rilis $version ($commit) siap: $pkg.tar.gz"
}

main "$@"
