#!/usr/bin/env bash
# One-command deploy of a PanduArah web app to Google Cloud Run.
#
#   export SUPABASE_URL=https://<ref>.supabase.co
#   export SUPABASE_ANON_KEY=sb_publishable_...      # publishable key, safe in the browser
#   deploy/cloud-run/deploy.sh                       # deploys the Visitor app
#   APP=admin SERVICE=panduarah-admin deploy/cloud-run/deploy.sh
#
# Prerequisites: gcloud CLI logged in (gcloud auth login) with a project that has billing enabled.
set -euo pipefail

APP=${APP:-visitor}
SERVICE=${SERVICE:-panduarah-${APP}}
REGION=${REGION:-asia-southeast2}
REPO=${REPO:-panduarah}
PROJECT=${PROJECT:-$(gcloud config get-value project 2>/dev/null)}

fail() { echo "deploy: $*" >&2; exit 1; }

case "$APP" in visitor | admin | landing | vendor) ;; *) fail "APP must be visitor, admin, landing or vendor (got '$APP')" ;; esac
[ -n "$PROJECT" ] || fail "no Google Cloud project: run 'gcloud config set project <id>' or set PROJECT"
[ -n "${SUPABASE_URL:-}" ] || fail "SUPABASE_URL is not set"
[ -n "${SUPABASE_ANON_KEY:-}" ] || fail "SUPABASE_ANON_KEY is not set"
case "$SUPABASE_ANON_KEY" in sb_secret_* | *service_role*) fail "that looks like a secret key; use the publishable/anon key" ;; esac
[ -f deploy/cloud-run/Dockerfile ] || fail "run this from the repository root"

echo "==> Project $PROJECT, region $REGION, app $APP -> service $SERVICE"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  --project "$PROJECT"

if ! gcloud artifacts repositories describe "$REPO" --location "$REGION" --project "$PROJECT" >/dev/null 2>&1; then
  echo "==> Creating Artifact Registry repository $REPO"
  gcloud artifacts repositories create "$REPO" --repository-format=docker \
    --location "$REGION" --project "$PROJECT"
fi

subs="_APP=$APP,_SERVICE=$SERVICE,_REGION=$REGION,_REPO=$REPO,_SUPABASE_URL=$SUPABASE_URL,_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
# Only the landing page and vendor dashboard use VISITOR_URL (link to the Visitor app).
[ -z "${VISITOR_URL:-}" ] || subs="$subs,_VISITOR_URL=$VISITOR_URL"
gcloud builds submit --project "$PROJECT" --config deploy/cloud-run/cloudbuild.yaml --substitutions "$subs" .

url=$(gcloud run services describe "$SERVICE" --region "$REGION" --project "$PROJECT" --format 'value(status.url)')
echo "==> Live: $url"
[ "$APP" = visitor ] && echo "    Demo venue: $url/v/demo"
exit 0
