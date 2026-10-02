"""DXF contoh untuk test: lantai 20 × 10 m dalam milimeter, tiga layer."""

import io

import ezdxf
from ezdxf import units


def sample_dxf(unit: int = units.MM) -> bytes:
    doc = ezdxf.new(units=unit)
    for name in ("DINDING", "PINTU", "FURNITUR"):
        doc.layers.add(name)
    msp = doc.modelspace()
    msp.add_lwpolyline(
        [(0, 0), (20000, 0), (20000, 10000), (0, 10000)], close=True, dxfattribs={"layer": "DINDING"}
    )
    msp.add_line((10000, 0), (10000, 10000), dxfattribs={"layer": "DINDING"})
    msp.add_arc((10000, 5000), 900, 0, 90, dxfattribs={"layer": "PINTU"})
    # Furnitur menjorok di luar dinding agar batas gambar berbeda per pilihan layer.
    msp.add_circle((25000, 5000), 1000, dxfattribs={"layer": "FURNITUR"})
    stream = io.StringIO()
    doc.write(stream)
    return stream.getvalue().encode("utf-8")
