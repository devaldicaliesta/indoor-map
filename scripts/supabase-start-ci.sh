#!/usr/bin/env bash
set -uo pipefail

for attempt in 1 2 3; do
  if pnpm exec supabase start -x studio,imgproxy,vector,logflare; then
    exit 0
  fi
  echo "::warning::supabase start gagal (percobaan $attempt/3), mengulang"
  pnpm exec supabase stop --no-backup || true
  docker ps -aq --filter name=supabase_ | xargs -r docker rm -f || true
  sleep $((attempt * 5))
done

echo "::error::supabase start gagal setelah 3 percobaan"
exit 1
