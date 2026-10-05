# Image paket instalasi. Target `web`: Caddy (HTTPS + gateway) dengan build statis Admin dan
# Visitor. Target `functions`: Edge Runtime berisi Edge Function dan paket domain yang diimpornya.
FROM node:22-slim AS build
WORKDIR /repo
RUN corepack enable
COPY . .
# CA proxy perusahaan (deploy/ca/*.crt, opsional) agar unduhan dependensi lolos pemeriksaan TLS.
RUN cat deploy/ca/*.crt > /build-ca.pem 2>/dev/null || : > /build-ca.pem
ENV NODE_EXTRA_CA_CERTS=/build-ca.pem
# Skrip install tidak dibutuhkan untuk build (satu-satunya, CLI supabase, tidak dipakai di sini).
RUN pnpm install --frozen-lockfile --ignore-scripts
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_CAD_CONVERTER_URL
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_ANON_KEY" \
  && pnpm --filter @indoor/admin --filter @indoor/visitor build
# Paket domain mandiri (dengan node_modules nyata) untuk import relatif Edge Function.
RUN pnpm --filter @indoor/domain deploy --legacy --prod /out/domain

FROM caddy:2.10-alpine AS web
COPY --from=build /repo/apps/admin/dist /srv/admin
COPY --from=build /repo/apps/visitor/dist /srv/visitor
COPY deploy/Caddyfile /etc/caddy/Caddyfile

FROM supabase/edge-runtime:v1.76.2 AS functions
COPY --from=build /out/domain /srv/packages/domain
COPY supabase/functions /srv/supabase/functions
COPY deploy/functions/main /srv/main
CMD ["start", "--main-service", "/srv/main"]

# Sama dengan services/cad-converter/Dockerfile, ditambah CA proxy dari deploy/ca untuk pip.
FROM python:3.12-slim AS cad
WORKDIR /srv
COPY deploy/ca /tmp/ca
RUN cat /etc/ssl/certs/ca-certificates.crt /tmp/ca/*.crt > /tmp/build-ca.pem 2>/dev/null || true
COPY services/cad-converter/requirements.txt .
RUN PIP_CERT=/tmp/build-ca.pem pip install --no-cache-dir -r requirements.txt && rm -rf /tmp/ca /tmp/build-ca.pem
COPY services/cad-converter/app ./app
RUN useradd --system --no-create-home converter
USER converter
ENV PORT=8090
EXPOSE 8090
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8090/health')"
CMD ["python", "-m", "app.server"]
