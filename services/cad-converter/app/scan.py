"""Scan denah gambar: dinding dan ruang dari gambar raster, dalam koordinat piksel gambar asli.

Semua diproses di server ini; gambar tidak disimpan dan tidak dikirim ke layanan lain.
"""

from __future__ import annotations

import io
import math
import time
from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError

from app.converter import ConversionError

MAX_SIDE_PX = 8000
WORK_SIDE_PX = 2000
TIME_LIMIT_S = 30.0
AXIS_SNAP_DEG = 5.0


@dataclass(frozen=True)
class Sensitivity:
    threshold_c: int
    min_component: float
    door_ratio: float
    min_room_area: float
    hough_threshold: int


SENSITIVITIES = {
    "low": Sensitivity(threshold_c=18, min_component=0.04, door_ratio=5.0, min_room_area=0.004, hough_threshold=60),
    "medium": Sensitivity(threshold_c=12, min_component=0.025, door_ratio=7.0, min_room_area=0.002, hough_threshold=40),
    "high": Sensitivity(threshold_c=7, min_component=0.015, door_ratio=9.0, min_room_area=0.001, hough_threshold=25),
}


class Deadline:
    def __init__(self, seconds: float) -> None:
        self.end = time.monotonic() + seconds

    def check(self) -> None:
        if time.monotonic() > self.end:
            raise ConversionError("timeout", "Scan melebihi 30 detik. Perkecil gambar atau turunkan kepekaan.")


def image_size(data: bytes) -> tuple[int, int]:
    try:
        with Image.open(io.BytesIO(data)) as image:
            if image.format not in ("PNG", "JPEG"):
                raise ConversionError("invalid_image", "Scan hanya untuk gambar PNG atau JPG.")
            return image.size
    except (UnidentifiedImageError, OSError) as error:
        raise ConversionError("invalid_image", "Berkas bukan gambar PNG atau JPG yang sah.") from error


def decode(data: bytes) -> np.ndarray:
    width, height = image_size(data)
    if max(width, height) > MAX_SIDE_PX:
        raise ConversionError(
            "too_large_px",
            f"Gambar {width}×{height} piksel melebihi batas {MAX_SIDE_PX} piksel sisi terpanjang.",
        )
    gray = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
    if gray is None:
        raise ConversionError("invalid_image", "Gambar tidak bisa dibaca.")
    return gray


def ink_mask(gray: np.ndarray, sensitivity: Sensitivity) -> np.ndarray:
    side = max(gray.shape)
    block = max(15, min(75, (side // 40) | 1))
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    return cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, block, sensitivity.threshold_c
    )


def drop_small(mask: np.ndarray, min_len: float) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    keep = np.zeros(count, dtype=bool)
    sizes = np.maximum(stats[:, cv2.CC_STAT_WIDTH], stats[:, cv2.CC_STAT_HEIGHT])
    keep[1:] = sizes[1:] >= min_len
    return np.where(keep[labels], 255, 0).astype(np.uint8)


def wall_thickness(walls: np.ndarray) -> float:
    contours, _ = cv2.findContours(walls, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    area = float(np.count_nonzero(walls))
    perimeter = sum(cv2.arcLength(c, True) for c in contours)
    return max(1.0, 2.0 * area / perimeter) if perimeter else 1.0


def close_doors(walls: np.ndarray, gap: int) -> np.ndarray:
    horizontal = cv2.morphologyEx(walls, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (gap, 1)))
    vertical = cv2.morphologyEx(walls, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (1, gap)))
    return cv2.bitwise_or(horizontal, vertical)


def orthogonalize(points: np.ndarray, tolerance: float) -> np.ndarray:
    result = points.astype(np.float64).copy()
    count = len(result)
    for i in range(count):
        a, b = result[i], result[(i + 1) % count]
        dx, dy = b[0] - a[0], b[1] - a[1]
        angle = math.degrees(math.atan2(abs(dy), abs(dx)))
        if angle <= AXIS_SNAP_DEG and abs(dy) <= tolerance * 4:
            mid = (a[1] + b[1]) / 2
            a[1] = b[1] = mid
        elif angle >= 90 - AXIS_SNAP_DEG and abs(dx) <= tolerance * 4:
            mid = (a[0] + b[0]) / 2
            a[0] = b[0] = mid
    return result


def room_confidence(contour: np.ndarray, vertices: int) -> float:
    area = cv2.contourArea(contour)
    (_, _), (w, h), _ = cv2.minAreaRect(contour)
    rectangularity = area / (w * h) if w * h > 0 else 0.0
    penalty = 1.0 if vertices <= 8 else 0.85 if vertices <= 16 else 0.65
    return round(max(0.0, min(1.0, rectangularity * penalty)), 2)


def find_rooms(closed: np.ndarray, thickness: float, sensitivity: Sensitivity, deadline: Deadline) -> list[dict]:
    height, width = closed.shape
    free = cv2.bitwise_not(closed)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(free, connectivity=4)
    min_area = sensitivity.min_room_area * width * height
    grow = cv2.getStructuringElement(cv2.MORPH_RECT, (max(1, round(thickness)) | 1,) * 2)
    rooms = []
    for label in range(1, count):
        x, y, w, h, area = stats[label]
        if area < min_area or x == 0 or y == 0 or x + w >= width or y + h >= height:
            continue
        deadline.check()
        region = np.where(labels[y : y + h, x : x + w] == label, 255, 0).astype(np.uint8)
        region = cv2.copyMakeBorder(region, 2, 2, 2, 2, cv2.BORDER_CONSTANT, value=0)
        region = cv2.dilate(region, grow)
        contours, _ = cv2.findContours(region, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue
        contour = max(contours, key=cv2.contourArea)
        epsilon = max(2.0, 0.01 * cv2.arcLength(contour, True))
        approx = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2)
        if len(approx) < 3:
            continue
        points = orthogonalize(approx, thickness) + np.array([x - 2, y - 2])
        rooms.append({"points": points, "confidence": room_confidence(contour, len(approx))})
    return rooms


def skeleton(mask: np.ndarray) -> np.ndarray:
    element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
    image = mask.copy()
    result = np.zeros_like(mask)
    while cv2.countNonZero(image):
        opened = cv2.morphologyEx(image, cv2.MORPH_OPEN, element)
        result = cv2.bitwise_or(result, cv2.subtract(image, opened))
        image = cv2.erode(image, element)
    return result


def snap_segment(x1: float, y1: float, x2: float, y2: float) -> tuple[tuple[float, float, float, float], bool]:
    angle = math.degrees(math.atan2(abs(y2 - y1), abs(x2 - x1)))
    if angle <= AXIS_SNAP_DEG:
        y = (y1 + y2) / 2
        return (min(x1, x2), y, max(x1, x2), y), True
    if angle >= 90 - AXIS_SNAP_DEG:
        x = (x1 + x2) / 2
        return (x, min(y1, y2), x, max(y1, y2)), True
    return (x1, y1, x2, y2), False


def axis_walls(walls: np.ndarray, length: int, thickness: float) -> tuple[list[tuple[float, float, float, float]], np.ndarray]:
    segments: list[tuple[float, float, float, float]] = []
    covered = np.zeros_like(walls)
    max_width = max(4.0, 3.0 * thickness)
    for horizontal in (True, False):
        size = (length, 1) if horizontal else (1, length)
        lines = cv2.morphologyEx(walls, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, size))
        covered = cv2.bitwise_or(covered, lines)
        count, _, stats, _ = cv2.connectedComponentsWithStats(lines, connectivity=8)
        for x, y, w, h, _ in stats[1:]:
            across = h if horizontal else w
            if across > max_width:
                continue
            if horizontal:
                mid = y + (h - 1) / 2
                segments.append((float(x), mid, float(x + w - 1), mid))
            else:
                mid = x + (w - 1) / 2
                segments.append((mid, float(y), mid, float(y + h - 1)))
    return segments, covered


def diagonal_walls(walls: np.ndarray, covered: np.ndarray, min_len: float, thickness: float, sensitivity: Sensitivity):
    grow = max(3, round(thickness) | 1)
    rest = cv2.subtract(walls, cv2.dilate(covered, cv2.getStructuringElement(cv2.MORPH_RECT, (grow, grow))))
    if not cv2.countNonZero(rest):
        return []
    lines = cv2.HoughLinesP(
        skeleton(rest),
        rho=1,
        theta=math.pi / 180,
        threshold=sensitivity.hough_threshold,
        minLineLength=min_len,
        maxLineGap=max(3.0, thickness),
    )
    found = []
    for x1, y1, x2, y2 in (lines.reshape(-1, 4) if lines is not None else []):
        seg, axis = snap_segment(float(x1), float(y1), float(x2), float(y2))
        if not axis:
            found.append(seg)
    return found


def find_walls(walls: np.ndarray, thickness: float, sensitivity: Sensitivity, deadline: Deadline) -> list[dict]:
    side = max(walls.shape)
    min_len = max(10.0, sensitivity.min_component * side)
    straight, covered = axis_walls(walls, max(3, round(min_len)), thickness)
    deadline.check()
    slanted = diagonal_walls(walls, covered, min_len, thickness, sensitivity)
    deadline.check()
    result = []
    for (x1, y1, x2, y2), axis in [(s, True) for s in straight] + [(s, False) for s in slanted]:
        length = math.hypot(x2 - x1, y2 - y1)
        if length < min_len:
            continue
        confidence = min(1.0, 0.4 + length / (0.25 * side)) * (1.0 if axis else 0.75)
        result.append({"points": np.array([[x1, y1], [x2, y2]]), "confidence": round(confidence, 2)})
    return result


def to_original(items: list[dict], scale: float) -> list[dict]:
    return [
        {
            "points": [[round(float(x) / scale, 1), round(float(y) / scale, 1)] for x, y in item["points"]],
            "confidence": item["confidence"],
        }
        for item in items
    ]


def scan_image(data: bytes, sensitivity: str = "medium", time_limit: float = TIME_LIMIT_S) -> dict:
    params = SENSITIVITIES.get(sensitivity)
    if params is None:
        raise ConversionError("invalid_sensitivity", "Kepekaan harus low, medium, atau high.")
    deadline = Deadline(time_limit)
    gray = decode(data)
    height, width = gray.shape
    scale = min(1.0, WORK_SIDE_PX / max(width, height))
    work = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA) if scale < 1 else gray
    deadline.check()
    side = max(work.shape)
    walls = drop_small(ink_mask(work, params), params.min_component * side)
    thickness = wall_thickness(walls)
    deadline.check()
    closed = close_doors(walls, max(3, round(params.door_ratio * thickness)))
    rooms = find_rooms(closed, thickness, params, deadline)
    deadline.check()
    wall_lines = find_walls(walls, thickness, params, deadline)
    return {
        "widthPx": width,
        "heightPx": height,
        "rooms": to_original(rooms, scale),
        "walls": to_original(wall_lines, scale),
    }
