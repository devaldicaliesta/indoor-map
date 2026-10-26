"""Layanan HTTP konversi CAD. Tanpa state: berkas dikirim di badan permintaan dan tidak disimpan.

POST /inspect          badan = DXF → {layers, unit, metersPerUnit, extents}
POST /render?layer=…   badan = DXF → {svg, widthPx, heightPx, extents}
GET  /health
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from collections.abc import Callable
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from app.converter import ConversionError, inspect_dxf, render_svg

# Sama dengan batas berkas denah di Admin dan bucket Storage.
MAX_BYTES = 50 * 1024 * 1024

# Hasil pemeriksaan token: "ok", "unauthorized" (sesi tidak sah), atau "forbidden" (lisensi
# instalasi tidak memuat fitur impor CAD).
TokenCheck = Callable[[str], str]

CAD_FEATURE = "cad_import"


def supabase_access_check(url: str, anon_key: str) -> TokenCheck:
    """Token harus sesi Supabase yang masih berlaku, dan lisensi instalasi memuat `cad_import`.

    Fitur dibaca lewat RPC `license_features()` atas nama pemanggil, jadi kunci di UI Admin tidak
    bisa dilewati dengan memanggil layanan ini langsung. Layanan tetap tidak menyimpan data.
    """
    base = url.rstrip("/")
    headers = {"Authorization": "", "apikey": anon_key}

    def call(request: urllib.request.Request) -> tuple[int, bytes]:
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as error:
            return error.code, b""
        except (urllib.error.URLError, TimeoutError):
            return 0, b""

    def check(token: str) -> str:
        auth = {**headers, "Authorization": f"Bearer {token}"}
        status, _ = call(urllib.request.Request(f"{base}/auth/v1/user", headers=auth))
        if status != 200:
            return "unauthorized"
        status, body = call(
            urllib.request.Request(
                f"{base}/rest/v1/rpc/license_features",
                data=b"{}",
                method="POST",
                headers={**auth, "Content-Type": "application/json"},
            )
        )
        if status in (401, 403):
            return "unauthorized"
        try:
            features = json.loads(body) if status == 200 else []
        except ValueError:
            features = []
        return "ok" if isinstance(features, list) and CAD_FEATURE in features else "forbidden"

    return check


def make_handler(allowed_origins: set[str], check_token: TokenCheck | None):
    class Handler(BaseHTTPRequestHandler):
        server_version = "cad-converter"

        def _cors(self) -> None:
            origin = self.headers.get("Origin", "")
            if origin and ("*" in allowed_origins or origin in allowed_origins):
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
                self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

        def _json(self, status: int, body: dict) -> None:
            payload = json.dumps(body).encode("utf-8")
            self.send_response(status)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def _fail(self, status: int, code: str, message: str) -> None:
            self._json(status, {"code": code, "message": message})

        def do_OPTIONS(self) -> None:  # noqa: N802
            self.send_response(204)
            self._cors()
            self.end_headers()

        def do_GET(self) -> None:  # noqa: N802
            if urlparse(self.path).path == "/health":
                self._json(200, {"ok": True})
            else:
                self._fail(404, "not_found", "Alamat tidak dikenal.")

        def do_POST(self) -> None:  # noqa: N802
            url = urlparse(self.path)
            if url.path not in ("/inspect", "/render"):
                self._fail(404, "not_found", "Alamat tidak dikenal.")
                return
            if check_token is not None:
                auth = self.headers.get("Authorization", "")
                token = auth.removeprefix("Bearer ").strip()
                access = check_token(token) if token else "unauthorized"
                if access == "unauthorized":
                    self._fail(401, "unauthorized", "Sesi tidak berlaku. Masuk lagi.")
                    return
                if access != "ok":
                    self._fail(
                        403,
                        "feature_locked",
                        "Impor denah CAD (DXF) tidak termasuk paket lisensi ini.",
                    )
                    return
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0:
                self._fail(400, "empty", "Berkas kosong.")
                return
            if length > MAX_BYTES:
                self._fail(413, "too_large", "Berkas terlalu besar. Maksimal 50 MB.")
                return
            data = self.rfile.read(length)
            try:
                if url.path == "/inspect":
                    self._json(200, inspect_dxf(data).as_json())
                else:
                    query = parse_qs(url.query)
                    max_px = int(query.get("maxPx", ["4000"])[0])
                    self._json(200, render_svg(data, query.get("layer", []), max_px))
            except ConversionError as error:
                status = 415 if error.code in ("dwg_unsupported", "invalid_dxf") else 422
                self._fail(status, error.code, error.message)
            except ValueError:
                self._fail(400, "invalid", "Parameter tidak valid.")

    return Handler


def main() -> None:
    origins = {o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()}
    url = os.environ.get("SUPABASE_URL")
    anon = os.environ.get("SUPABASE_ANON_KEY")
    check = supabase_access_check(url, anon) if url and anon else None
    if check is None and os.environ.get("ALLOW_ANONYMOUS") != "1":
        raise SystemExit("SUPABASE_URL dan SUPABASE_ANON_KEY wajib diisi (atau ALLOW_ANONYMOUS=1).")
    port = int(os.environ.get("PORT", "8090"))
    server = ThreadingHTTPServer(("0.0.0.0", port), make_handler(origins, check))
    print(f"cad-converter mendengarkan di :{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
