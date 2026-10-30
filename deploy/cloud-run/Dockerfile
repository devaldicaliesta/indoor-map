# syntax=docker/dockerfile:1
# Cloud Run image for one PanduArah web app (visitor | admin | landing | vendor).
# Build context = repository root:
#   docker build -f deploy/cloud-run/Dockerfile --build-arg APP=visitor \
#     --build-arg VITE_SUPABASE_URL=https://<ref>.supabase.co \
#     --build-arg VITE_SUPABASE_ANON_KEY=sb_publishable_... -t panduarah-visitor .
# VITE_* values are public by design (publishable key) and are compiled into the static bundle.

FROM node:22-slim AS build
ARG APP=visitor
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_VISITOR_URL=""
WORKDIR /repo
RUN corepack enable
COPY . .
# The Supabase CLI postinstall is not needed to build the web apps.
RUN pnpm install --frozen-lockfile --ignore-scripts
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_VISITOR_URL=${VITE_VISITOR_URL}
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_ANON_KEY" \
  || { echo "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY build args are required" >&2; exit 1; }
RUN pnpm --filter "@indoor/${APP}" build \
  && cp -r "apps/${APP}/dist" /site

FROM nginx:stable-alpine AS runtime
# Cloud Run injects $PORT (8080); the nginx image renders templates with envsubst at start.
ENV PORT=8080
COPY deploy/cloud-run/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /site /usr/share/nginx/html
EXPOSE 8080
