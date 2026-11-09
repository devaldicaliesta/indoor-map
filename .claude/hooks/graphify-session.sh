#!/usr/bin/env bash
# Membangun graf pengetahuan kode (graphify) di awal sesi agar Claude bisa
# bertanya ke graf alih-alih membaca banyak file mentah. Murni AST lokal,
# tanpa API key, ±15 detik dari nol dan inkremental sesudahnya.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

GRAPHIFY_SPEC='graphifyy[sql]==0.9.104'

if ! command -v graphify >/dev/null 2>&1; then
  # Hanya pasang otomatis di sesi cloud; di mesin lokal pengembang memasang sendiri.
  [ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || { echo "graphify belum terpasang: uv tool install '$GRAPHIFY_SPEC'" >&2; exit 0; }
  if command -v uv >/dev/null 2>&1; then
    uv tool install -q "$GRAPHIFY_SPEC" >/dev/null 2>&1
  else
    pip install -q --user "$GRAPHIFY_SPEC" >/dev/null 2>&1
  fi
  export PATH="$HOME/.local/bin:$PATH"
  command -v graphify >/dev/null 2>&1 || { echo "gagal memasang graphify" >&2; exit 0; }
fi

graphify extract . --code-only >/dev/null 2>&1 \
  && graphify cluster-only . --no-label --no-viz >/dev/null 2>&1 \
  || echo "graphify: gagal membangun graf" >&2
exit 0
