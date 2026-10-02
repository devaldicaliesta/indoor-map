"""Konversi denah DXF: daftar layer dan satuan, lalu SVG dari layer yang dipilih.

Layer CAD tidak pernah diimpor sebagai fitur vektor; hasilnya hanya gambar denah yang
digeoreferensi di Admin seperti PNG/PDF.
"""

from __future__ import annotations

import io
import re
from collections import Counter
from dataclasses import dataclass

import ezdxf
from ezdxf import bbox, recover, units
from ezdxf.addons.drawing import Frontend, RenderContext, config, layout, svg

# Sisi terpanjang raster; sama dengan target raster PDF di Admin.
DEFAULT_MAX_PX = 4000
MAX_PX = 8000
STROKE_PX = 3

UNIT_NAMES = {
    units.MM: "mm",
    units.CM: "cm",
    units.M: "m",
    units.IN: "in",
    units.FT: "ft",
}


class ConversionError(Exception):
    """Berkas tidak bisa dikonversi; pesannya ditampilkan di Admin."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def is_dwg(data: bytes) -> bool:
    # Berkas DWG selalu diawali versi "AC10xx"; DXF teks diawali kode grup.
    return data[:4] == b"AC10"


def _read(data: bytes) -> ezdxf.document.Drawing:
    if is_dwg(data):
        raise ConversionError(
            "dwg_unsupported",
            "DWG tidak didukung. Simpan sebagai DXF atau PDF dari software CAD "
            "(atau DWG TrueView yang gratis), lalu unggah lagi.",
        )
    try:
        doc, _auditor = recover.read(io.BytesIO(data))
    except (ezdxf.DXFStructureError, ValueError, UnicodeDecodeError) as error:
        raise ConversionError("invalid_dxf", "Berkas bukan DXF yang bisa dibaca.") from error
    return doc


@dataclass
class Inspection:
    layers: list[dict]
    unit: str | None
    meters_per_unit: float | None
    extents: list[float] | None

    def as_json(self) -> dict:
        return {
            "layers": self.layers,
            "unit": self.unit,
            "metersPerUnit": self.meters_per_unit,
            "extents": self.extents,
        }


def _extents(entities) -> list[float] | None:
    box = bbox.extents(entities, fast=True)
    if not box.has_data:
        return None
    return [box.extmin.x, box.extmin.y, box.extmax.x, box.extmax.y]


def inspect_dxf(data: bytes) -> Inspection:
    doc = _read(data)
    msp = doc.modelspace()
    counts = Counter(entity.dxf.layer for entity in msp)
    layers = [
        {"name": name, "entities": count}
        for name, count in sorted(counts.items(), key=lambda item: item[0].lower())
    ]
    code = doc.units
    unit = UNIT_NAMES.get(code)
    meters = units.conversion_factor(code, units.M) if unit else None
    return Inspection(layers, unit, meters, _extents(msp))


def render_svg(data: bytes, layers: list[str], max_px: int = DEFAULT_MAX_PX) -> dict:
    """SVG berukuran piksel dari layer terpilih, dengan ukuran gambar dalam satuan berkas."""
    if not layers:
        raise ConversionError("no_layers", "Pilih minimal satu layer.")
    max_px = max(256, min(max_px, MAX_PX))
    doc = _read(data)
    msp = doc.modelspace()
    chosen = set(layers)
    entities = [entity for entity in msp if entity.dxf.layer in chosen]
    extents = _extents(entities)
    if extents is None:
        raise ConversionError("empty_layers", "Layer yang dipilih tidak berisi gambar.")
    width = extents[2] - extents[0]
    height = extents[3] - extents[1]
    if width <= 0 or height <= 0:
        raise ConversionError("empty_layers", "Layer yang dipilih tidak berisi gambar.")
    scale = max_px / max(width, height)
    width_px = max(1, round(width * scale))
    height_px = max(1, round(height * scale))

    backend = svg.SVGBackend()
    frontend = Frontend(
        RenderContext(doc),
        backend,
        config=config.Configuration(
            background_policy=config.BackgroundPolicy.OFF,
            color_policy=config.ColorPolicy.BLACK,
            lineweight_policy=config.LineweightPolicy.RELATIVE_FIXED,
        ),
    )
    frontend.draw_layout(msp, filter_func=lambda entity: entity.dxf.layer in chosen)
    page = layout.Page(width_px, height_px, layout.Units.px)
    # Tebal garis per seribu lebar halaman; dibuat konstan dalam piksel agar dinding tetap
    # terbaca di atas peta berapa pun ukuran raster dan lineweight di berkas.
    stroke = STROKE_PX * 1000 / max(width_px, height_px)
    text = backend.get_string(page, settings=layout.Settings(fit_page=True, fixed_stroke_width=stroke))
    # Ukuran keluaran ezdxf dalam mm; browser butuh piksel agar raster tepat seukuran ini.
    text = re.sub(
        r'(<svg\b[^>]*?)\swidth="[^"]*"\sheight="[^"]*"',
        rf'\1 width="{width_px}" height="{height_px}"',
        text,
        count=1,
    )
    return {
        "svg": text,
        "widthPx": width_px,
        "heightPx": height_px,
        "extents": extents,
    }
