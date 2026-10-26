import json
import threading
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from app.server import make_handler, supabase_access_check
from tests.sample import sample_dxf

ORIGIN = "http://admin.local"


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        tokens = {"sah": "ok", "tanpa-fitur": "forbidden"}
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0),
            make_handler({ORIGIN}, lambda token: tokens.get(token, "unauthorized")),
        )
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.server.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def post(self, path, body, token="sah"):
        request = urllib.request.Request(
            self.base + path,
            data=body,
            method="POST",
            headers={"Authorization": f"Bearer {token}", "Origin": ORIGIN},
        )
        try:
            with urllib.request.urlopen(request) as response:
                return response.status, json.loads(response.read()), response.headers
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read()), error.headers

    def test_inspect_and_render(self):
        status, body, headers = self.post("/inspect", sample_dxf())
        self.assertEqual(status, 200)
        self.assertEqual(body["unit"], "mm")
        self.assertEqual(headers["Access-Control-Allow-Origin"], ORIGIN)
        status, body, _ = self.post("/render?layer=DINDING&layer=PINTU&maxPx=1000", sample_dxf())
        self.assertEqual((status, body["widthPx"], body["heightPx"]), (200, 1000, 500))

    def test_session_required(self):
        status, body, _ = self.post("/inspect", sample_dxf(), token="palsu")
        self.assertEqual((status, body["code"]), (401, "unauthorized"))

    def test_license_without_cad_import(self):
        for path in ("/inspect", "/render?layer=DINDING"):
            status, body, _ = self.post(path, sample_dxf(), token="tanpa-fitur")
            self.assertEqual((status, body["code"]), (403, "feature_locked"))

    def test_missing_token(self):
        status, body, _ = self.post("/inspect", sample_dxf(), token="")
        self.assertEqual((status, body["code"]), (401, "unauthorized"))

    def test_dwg_and_garbage(self):
        status, body, _ = self.post("/inspect", b"AC1032" + b"\0" * 64)
        self.assertEqual((status, body["code"]), (415, "dwg_unsupported"))
        status, body, _ = self.post("/inspect", b"xyz")
        self.assertEqual((status, body["code"]), (415, "invalid_dxf"))
        status, body, _ = self.post("/render?layer=TIDAK_ADA", sample_dxf())
        self.assertEqual((status, body["code"]), (422, "empty_layers"))

    def test_unknown_origin_gets_no_cors(self):
        request = urllib.request.Request(self.base + "/health", headers={"Origin": "http://lain"})
        with urllib.request.urlopen(request) as response:
            self.assertIsNone(response.headers["Access-Control-Allow-Origin"])


# Fitur lisensi per token, seperti yang dikembalikan RPC license_features() untuk sesi itu.
FEATURES = {"lengkap": ["3d", "cad_import"], "dasar": ["3d"]}


class FakeSupabase(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _token(self):
        return self.headers.get("Authorization", "").removeprefix("Bearer ")

    def _reply(self, status, body):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):  # noqa: N802
        known = self.path == "/auth/v1/user" and self._token() in FEATURES
        self._reply(200 if known else 401, {})

    def do_POST(self):  # noqa: N802
        self.rfile.read(int(self.headers.get("Content-Length") or 0))
        if self.path != "/rest/v1/rpc/license_features" or self._token() not in FEATURES:
            self._reply(401, {})
        else:
            self._reply(200, FEATURES[self._token()])


class AccessCheckTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), FakeSupabase)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.check = staticmethod(
            supabase_access_check(f"http://127.0.0.1:{cls.server.server_address[1]}/", "anon")
        )

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def test_feature_from_license(self):
        self.assertEqual(self.check("lengkap"), "ok")
        self.assertEqual(self.check("dasar"), "forbidden")

    def test_invalid_session(self):
        self.assertEqual(self.check("palsu"), "unauthorized")

    def test_supabase_unreachable(self):
        check = supabase_access_check("http://127.0.0.1:9", "anon")
        self.assertEqual(check("lengkap"), "unauthorized")


if __name__ == "__main__":
    unittest.main()
