#!/usr/bin/env bash
# Menerapkan migrasi supabase/migrations yang belum tercatat, satu transaksi per file, dengan
# tabel catatan yang sama dengan Supabase CLI. Dijalankan di container `migrate` (compose.yml).
set -euo pipefail

psql_q() { psql -v ON_ERROR_STOP=1 -X -q "$@"; }

psql_q <<'SQL'
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);
SQL

applied=0
for file in /migrations/*.sql; do
  base=$(basename "$file" .sql)
  version=${base%%_*}
  name=${base#*_}
  done_already=$(psql_q -At -c "select 1 from supabase_migrations.schema_migrations where version = '$version'")
  [ -n "$done_already" ] && continue
  echo "migrasi $base"
  {
    cat "$file"
    printf "\ninsert into supabase_migrations.schema_migrations (version, name) values ('%s', '%s');\n" "$version" "$name"
  } | psql_q --single-transaction -f -
  applied=$((applied + 1))
done
echo "$applied migrasi baru diterapkan"

# Alamat Edge Function dari dalam database (pemberitahuan akun terkunci, check-in lisensi).
psql_q -v url="$FUNCTIONS_URL" <<'SQL'
insert into app.server_settings (key, value) values ('functions_url', :'url')
on conflict (key) do update set value = excluded.value;
SQL
