import type { Position } from './geometry';

interface Cell {
  x: number;
  y: number;
  /** Setengah sisi sel. */
  h: number;
  /** Jarak bertanda pusat sel ke tepi poligon (positif di dalam). */
  d: number;
  /** Jarak terjauh yang mungkin dicapai titik mana pun di dalam sel. */
  max: number;
}

function segmentDistanceSq(px: number, py: number, a: Position, b: Position): number {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) [x, y] = b;
    else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = px - x;
  dy = py - y;
  return dx * dx + dy * dy;
}

/** Jarak titik ke tepi terdekat; positif bila di dalam poligon (lubang dihitung di luar). */
function signedDistance(px: number, py: number, rings: readonly (readonly Position[])[]): number {
  let inside = false;
  let minSq = Number.POSITIVE_INFINITY;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i] as Position;
      const b = ring[j] as Position;
      if (a[1] > py !== b[1] > py && px < ((b[0] - a[0]) * (py - a[1])) / (b[1] - a[1]) + a[0]) {
        inside = !inside;
      }
      minSq = Math.min(minSq, segmentDistanceSq(px, py, a, b));
    }
  }
  return (inside ? 1 : -1) * Math.sqrt(minSq);
}

function cell(x: number, y: number, h: number, rings: readonly (readonly Position[])[]): Cell {
  const d = signedDistance(x, y, rings);
  return { x, y, h, d, max: d + h * Math.SQRT2 };
}

/** Pusat massa cincin luar; titik awal yang baik untuk poligon cembung. */
function centroidCell(rings: readonly (readonly Position[])[]): Cell {
  const ring = rings[0] ?? [];
  let area = 0;
  let x = 0;
  let y = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i] as Position;
    const b = ring[j] as Position;
    const f = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * f;
    y += (a[1] + b[1]) * f;
    area += f * 3;
  }
  const first = ring[0] ?? [0, 0];
  return area === 0 ? cell(first[0], first[1], 0, rings) : cell(x / area, y / area, 0, rings);
}

/** Antrean prioritas (heap) sel dengan `max` terbesar lebih dulu. */
class CellQueue {
  private readonly items: Cell[] = [];

  push(item: Cell) {
    const items = this.items;
    let i = items.length;
    items.push(item);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      const above = items[parent] as Cell;
      if (above.max >= item.max) break;
      items[i] = above;
      i = parent;
    }
    items[i] = item;
  }

  pop(): Cell | undefined {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (!top || !last || items.length === 0) return top;
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      if (left >= items.length) break;
      const right = left + 1;
      const child =
        right < items.length && (items[right] as Cell).max > (items[left] as Cell).max
          ? right
          : left;
      const larger = items[child] as Cell;
      if (larger.max <= last.max) break;
      items[i] = larger;
      i = child;
    }
    items[i] = last;
    return top;
  }
}

/**
 * Titik label di dalam poligon: pusat lingkaran terbesar yang muat di dalamnya
 * ("pole of inaccessibility"). Berbeda dari pusat massa, titik ini tidak jatuh di luar unit
 * berbentuk L atau U. `precision` dalam satuan koordinat (derajat); 1e-6 ≈ 0,1 m.
 */
export function labelPoint(rings: readonly (readonly Position[])[], precision = 1e-6): Position {
  const outer = rings[0] ?? [];
  if (outer.length === 0) return [0, 0];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const [x, y] of outer) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const size = Math.min(maxX - minX, maxY - minY);
  if (size === 0) return [minX, minY];

  const queue = new CellQueue();
  const h = size / 2;
  for (let x = minX; x < maxX; x += size) {
    for (let y = minY; y < maxY; y += size) queue.push(cell(x + h, y + h, h, rings));
  }
  let best = centroidCell(rings);
  const center = cell(minX + (maxX - minX) / 2, minY + (maxY - minY) / 2, 0, rings);
  if (center.d > best.d) best = center;

  for (let current = queue.pop(); current; current = queue.pop()) {
    if (current.d > best.d) best = current;
    if (current.max - best.d <= precision) continue;
    const half = current.h / 2;
    queue.push(cell(current.x - half, current.y - half, half, rings));
    queue.push(cell(current.x + half, current.y - half, half, rings));
    queue.push(cell(current.x - half, current.y + half, half, rings));
    queue.push(cell(current.x + half, current.y + half, half, rings));
  }
  return [best.x, best.y];
}
