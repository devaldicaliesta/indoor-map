import json
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

from app.server import make_handler
from tests.sample import sample_dxf

ORIGIN = "http://admin.local"


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        tokens = {"sah"}
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), make_handler({ORIGIN}, lambda token: token in tokens)
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


if __name__ == "__main__":
    unittest.main()
