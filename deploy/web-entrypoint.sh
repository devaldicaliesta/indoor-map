#!/bin/sh
# Mengisi alamat API dan kunci anon instalasi ini ke build statis Admin dan Visitor, lalu
# menjalankan Caddy. Salinan bersih di /opt/panduarah/www diisi ulang setiap container mulai,
# jadi nilai baru di .env berlaku setelah `docker compose up -d web`.
set -eu

fail() { echo "web-entrypoint: $*" >&2; exit 1; }

url=${PANDUARAH_API_URL:-}
key=${PANDUARAH_ANON_KEY:-}
# Nilai disisipkan ke JavaScript apa adanya, jadi hanya bentuk yang aman yang diterima.
printf '%s' "$url" | grep -Eqx 'https://[A-Za-z0-9.-]+(:[0-9]{1,5})?' ||
  fail "PANDUARAH_API_URL harus https://<domain API> (sekarang: '$url')."
printf '%s' "$key" | grep -Eqx '[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' ||
  fail "PANDUARAH_ANON_KEY bukan JWT."

rm -rf /srv/admin /srv/visitor
cp -a /opt/panduarah/www/. /srv/
find /srv/admin /srv/visitor -type f \( -name '*.js' -o -name '*.html' -o -name '*.json' -o -name '*.webmanifest' \) \
  -exec sed -i "s|__PANDUARAH_API_URL__|$url|g; s|__PANDUARAH_ANON_KEY__|$key|g" {} +
if grep -rlq __PANDUARAH_ /srv/admin /srv/visitor; then
  fail "penanda konfigurasi masih tersisa di build statis."
fi

exec "$@"
