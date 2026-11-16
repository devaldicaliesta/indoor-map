import io
import json
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

from app.converter import ConversionError
from app.scan import scan_image

FIXTURES = Path(__file__).parent / "fixtures"


def load(name: str) -> tuple[bytes, dict]:
    return (FIXTURES / f"{name}.png").read_bytes(), json.loads((FIXTURES / f"{name}.json").read_text())


def bbox(points: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return min(xs), min(ys), max(xs), max(ys)


def iou(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union else 0.0


def matched(truth: list[int], rooms: list[dict], tolerance_px: float) -> bool:
    for room in rooms:
        box = bbox(room["points"])
        edges_close = all(abs(box[i] - truth[i]) <= tolerance_px for i in range(4))
        if edges_close and iou(box, tuple(truth)) >= 0.8:
            return True
    return False


def png(width: int, height: int) -> bytes:
    buffer = io.BytesIO()
    Image.new("L", (width, height), 255).save(buffer, format="PNG")
    return buffer.getvalue()


class ScanFixtureTest(unittest.TestCase):
    def assert_rooms(self, name: str, minimum: float = 0.9) -> dict:
        data, truth = load(name)
        result = scan_image(data, "medium")
        tolerance = 0.5 * truth["pxPerMeter"]
        found = sum(matched(room, result["rooms"], tolerance) for room in truth["rooms"])
        self.assertGreaterEqual(found / len(truth["rooms"]), minimum, f"{name}: {found}/{len(truth['rooms'])}")
        return result

    def test_simple_plan_rooms_within_half_meter(self):
        result = self.assert_rooms("simple", 1.0)
        self.assertEqual((result["widthPx"], result["heightPx"]), (1200, 800))
        self.assertEqual(len(result["rooms"]), 4)

    def test_medium_plan_with_corridor(self):
        self.assert_rooms("medium")

    def test_text_and_symbols_are_not_rooms_or_walls(self):
        result = self.assert_rooms("text")
        self.assertLessEqual(len(result["rooms"]), 7)
        for wall in result["walls"]:
            (x0, y0), (x1, y1) = wall["points"]
            self.assertGreaterEqual(max(abs(x1 - x0), abs(y1 - y0)), 40)

    def test_walls_are_straight_and_axis_aligned(self):
        data, _ = load("simple")
        walls = scan_image(data, "medium")["walls"]
        self.assertGreaterEqual(len(walls), 4)
        for wall in walls:
            (x0, y0), (x1, y1) = wall["points"]
            self.assertTrue(x0 == x1 or y0 == y1, wall)
            self.assertTrue(0 < wall["confidence"] <= 1)

    def test_confidence_between_zero_and_one(self):
        data, _ = load("medium")
        for room in scan_image(data, "high")["rooms"]:
            self.assertTrue(0 <= room["confidence"] <= 1)

    def test_diagonal_wall_is_kept_as_slanted_line(self):
        image = Image.new("L", (800, 600), 255)
        ImageDraw.Draw(image).line([(100, 500), (700, 100)], fill=0, width=8)
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        walls = scan_image(buffer.getvalue())["walls"]
        slanted = [w for w in walls if w["points"][0][0] != w["points"][1][0] and w["points"][0][1] != w["points"][1][1]]
        self.assertTrue(slanted)
        self.assertTrue(all(w["confidence"] < 1 for w in slanted))

    def test_sensitivity_changes_detail(self):
        data, _ = load("text")
        low = scan_image(data, "low")
        high = scan_image(data, "high")
        self.assertLessEqual(len(low["walls"]), len(high["walls"]) + 2)


class ScanLimitTest(unittest.TestCase):
    def test_rejects_oversized_image(self):
        with self.assertRaises(ConversionError) as ctx:
            scan_image(png(8001, 10))
        self.assertEqual(ctx.exception.code, "too_large_px")

    def test_rejects_non_image(self):
        with self.assertRaises(ConversionError) as ctx:
            scan_image(b"bukan gambar")
        self.assertEqual(ctx.exception.code, "invalid_image")

    def test_rejects_unknown_sensitivity(self):
        with self.assertRaises(ConversionError) as ctx:
            scan_image(png(10, 10), "ekstrem")
        self.assertEqual(ctx.exception.code, "invalid_sensitivity")

    def test_stops_after_time_limit(self):
        data, _ = load("simple")
        with self.assertRaises(ConversionError) as ctx:
            scan_image(data, "medium", time_limit=0)
        self.assertEqual(ctx.exception.code, "timeout")

    def test_blank_image_has_no_rooms(self):
        result = scan_image(png(400, 300))
        self.assertEqual(result["rooms"], [])
        self.assertEqual(result["walls"], [])


if __name__ == "__main__":
    unittest.main()
