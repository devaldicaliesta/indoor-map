import re
import unittest

from app.converter import ConversionError, inspect_dxf, is_dwg, render_svg
from tests.sample import sample_dxf


class InspectTest(unittest.TestCase):
    def test_layers_units_and_extents(self):
        result = inspect_dxf(sample_dxf()).as_json()
        self.assertEqual(
            result["layers"],
            [
                {"name": "DINDING", "entities": 2},
                {"name": "FURNITUR", "entities": 1},
                {"name": "PINTU", "entities": 1},
            ],
        )
        self.assertEqual(result["unit"], "mm")
        self.assertAlmostEqual(result["metersPerUnit"], 0.001)
        self.assertEqual([round(v) for v in result["extents"]], [0, 0, 26000, 10000])

    def test_unitless_file_has_no_scale(self):
        result = inspect_dxf(sample_dxf(0)).as_json()
        self.assertIsNone(result["unit"])
        self.assertIsNone(result["metersPerUnit"])

    def test_dwg_is_rejected_with_guidance(self):
        data = b"AC1032" + b"\0" * 100
        self.assertTrue(is_dwg(data))
        with self.assertRaises(ConversionError) as caught:
            inspect_dxf(data)
        self.assertEqual(caught.exception.code, "dwg_unsupported")
        self.assertIn("DXF atau PDF", caught.exception.message)

    def test_garbage_is_rejected(self):
        with self.assertRaises(ConversionError) as caught:
            inspect_dxf(b"bukan dxf sama sekali")
        self.assertEqual(caught.exception.code, "invalid_dxf")


class RenderTest(unittest.TestCase):
    def test_only_selected_layers_with_matching_aspect(self):
        result = render_svg(sample_dxf(), ["DINDING", "PINTU"], max_px=2000)
        self.assertEqual((result["widthPx"], result["heightPx"]), (2000, 1000))
        self.assertEqual([round(v) for v in result["extents"]], [0, 0, 20000, 10000])
        self.assertIn("<svg", result["svg"])
        self.assertIn('width="2000" height="1000"', result["svg"])

    def test_lines_are_three_pixels_wide(self):
        for max_px in (1000, 4000):
            result = render_svg(sample_dxf(), ["DINDING"], max_px=max_px)
            width = int(re.search(r"stroke-width: (\d+)", result["svg"]).group(1))
            self.assertAlmostEqual(width / 1_000_000 * max_px, 3, delta=0.1)

    def test_layer_choice_changes_extents(self):
        everything = render_svg(sample_dxf(), ["DINDING", "PINTU", "FURNITUR"], max_px=2600)
        self.assertEqual((everything["widthPx"], everything["heightPx"]), (2600, 1000))

    def test_size_is_clamped(self):
        self.assertEqual(render_svg(sample_dxf(), ["DINDING"], max_px=99999)["widthPx"], 8000)

    def test_empty_choice_is_rejected(self):
        for layers in ([], ["TIDAK_ADA"]):
            with self.assertRaises(ConversionError):
                render_svg(sample_dxf(), layers)


if __name__ == "__main__":
    unittest.main()
