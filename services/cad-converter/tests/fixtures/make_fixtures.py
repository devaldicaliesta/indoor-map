"""Membuat ulang fixture denah uji: python -m tests.fixtures.make_fixtures (dari services/cad-converter).

Setiap denah disertai berkas JSON berisi persegi ruang sebenarnya [x0, y0, x1, y1] pada garis
tengah dinding, dalam piksel, dan skala piksel per meter.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
WALL = 8
DOOR = 40
PX_PER_M = 40


def wall(draw: ImageDraw.ImageDraw, x0: int, y0: int, x1: int, y1: int, doors: list[int] = ()) -> None:
    half = WALL // 2
    if y0 == y1:
        cuts = sorted(doors)
        start = x0 - half
        for door in cuts:
            draw.rectangle([start, y0 - half, door - DOOR // 2, y0 + half], fill=0)
            start = door + DOOR // 2
        draw.rectangle([start, y0 - half, x1 + half, y0 + half], fill=0)
    else:
        cuts = sorted(doors)
        start = y0 - half
        for door in cuts:
            draw.rectangle([x0 - half, start, x0 + half, door - DOOR // 2], fill=0)
            start = door + DOOR // 2
        draw.rectangle([x0 - half, start, x0 + half, y1 + half], fill=0)


def save(name: str, image: Image.Image, rooms: list[list[int]]) -> None:
    image.save(HERE / f"{name}.png", optimize=True)
    (HERE / f"{name}.json").write_text(
        json.dumps({"pxPerMeter": PX_PER_M, "rooms": rooms}, indent=2) + "\n", encoding="utf-8"
    )


def simple() -> None:
    image = Image.new("L", (1200, 800), 255)
    draw = ImageDraw.Draw(image)
    left, top, right, bottom, mid_x, mid_y = 100, 100, 1100, 700, 600, 400
    wall(draw, left, top, right, top)
    wall(draw, left, bottom, right, bottom)
    wall(draw, left, top, left, bottom)
    wall(draw, right, top, right, bottom)
    wall(draw, mid_x, top, mid_x, bottom, doors=[250, 550])
    wall(draw, left, mid_y, right, mid_y, doors=[350, 850])
    save(
        "simple",
        image,
        [[left, top, mid_x, mid_y], [mid_x, top, right, mid_y], [left, mid_y, mid_x, bottom], [mid_x, mid_y, right, bottom]],
    )


def medium() -> None:
    image = Image.new("L", (1800, 1200), 255)
    draw = ImageDraw.Draw(image)
    left, right, top, bottom = 100, 1700, 100, 1100
    corridor_top, corridor_bottom = 500, 650
    top_cols = [100, 500, 900, 1300, 1700]
    bottom_cols = [100, 650, 1200, 1700]
    wall(draw, left, top, right, top)
    wall(draw, left, bottom, right, bottom)
    wall(draw, left, top, left, bottom)
    wall(draw, right, top, right, bottom)
    wall(draw, left, corridor_top, right, corridor_top, doors=[300, 700, 1100, 1500])
    wall(draw, left, corridor_bottom, right, corridor_bottom, doors=[375, 925, 1450])
    for x in top_cols[1:-1]:
        wall(draw, x, top, x, corridor_top)
    for x in bottom_cols[1:-1]:
        wall(draw, x, corridor_bottom, x, bottom)
    rooms = [[a, top, b, corridor_top] for a, b in zip(top_cols, top_cols[1:])]
    rooms.append([left, corridor_top, right, corridor_bottom])
    rooms += [[a, corridor_bottom, b, bottom] for a, b in zip(bottom_cols, bottom_cols[1:])]
    save("medium", image, rooms)


def text_heavy() -> None:
    image = Image.new("L", (1600, 1000), 255)
    draw = ImageDraw.Draw(image)
    left, right, top, bottom, mid_y = 100, 1500, 100, 900, 500
    cols = [100, 566, 1033, 1500]
    wall(draw, left, top, right, top)
    wall(draw, left, bottom, right, bottom)
    wall(draw, left, top, left, bottom)
    wall(draw, right, top, right, bottom)
    wall(draw, left, mid_y, right, mid_y, doors=[333, 800, 1266])
    for x in cols[1:-1]:
        wall(draw, x, top, x, bottom, doors=[300, 700])
    rooms = [[a, top, b, mid_y] for a, b in zip(cols, cols[1:])]
    rooms += [[a, mid_y, b, bottom] for a, b in zip(cols, cols[1:])]
    font = ImageFont.load_default(size=22)
    small = ImageFont.load_default(size=13)
    labels = ["RUANG RAPAT 101", "GUDANG ARSIP", "LOBI UTAMA", "KANTOR 104", "DAPUR", "TOILET 106"]
    for (x0, y0, x1, y1), label in zip(rooms, labels):
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        draw.text((cx - 90, cy - 30), label, font=font, fill=0)
        draw.text((cx - 60, cy + 5), f"{(x1 - x0) / PX_PER_M:.1f} x {(y1 - y0) / PX_PER_M:.1f} m", font=small, fill=0)
        for i in range(3):
            draw.ellipse([x0 + 40 + i * 30, y1 - 60, x0 + 55 + i * 30, y1 - 45], outline=0, width=2)
        draw.text((x0 + 20, y0 + 20), "A-01", font=small, fill=0)
    draw.text((left, bottom + 40), "DENAH LANTAI 1  SKALA 1:100  PANDUARAH UJI", font=font, fill=0)
    save("text", image, rooms)


if __name__ == "__main__":
    simple()
    medium()
    text_heavy()
