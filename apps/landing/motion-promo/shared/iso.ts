// Proyeksi isometrik seperti video landing (motion.ts `project`/`box`), dengan kamera yang bisa
// digeser, diputar, dan diperbesar, serta sisi kotak yang dipilih dari arah pandang kamera.
import { poly, shade } from './draw';
import type { Pt } from './stage';

export interface IsoCam {
  /** Titik layar tempat pusat dunia (`ox`, `oy`) digambar. */
  cx: number;
  cy: number;
  /** Piksel per meter. */
  scale: number;
  /** Rotasi denah dalam derajat (landing: −30). */
  angle: number;
  /** 0 = denah datar dari atas, 1 = isometrik penuh. */
  tilt: number;
  ox: number;
  oy: number;
}

export function iso(cam: IsoCam, [x, y]: Pt, z = 0): Pt {
  const a = (cam.angle * Math.PI * cam.tilt) / 180;
  const mx = x - cam.ox;
  const my = y - cam.oy;
  const rx = mx * Math.cos(a) - my * Math.sin(a);
  const ry = mx * Math.sin(a) + my * Math.cos(a);
  const squash = 1 - 0.45 * cam.tilt;
  return [
    cam.cx + rx * cam.scale,
    cam.cy + ry * cam.scale * squash - z * cam.scale * 1.15 * cam.tilt,
  ];
}

/** Kedalaman layar: makin besar makin dekat ke penonton (digambar belakangan). */
export function depth(cam: IsoCam, [x, y]: Pt) {
  const a = (cam.angle * Math.PI * cam.tilt) / 180;
  return (x - cam.ox) * Math.sin(a) + (y - cam.oy) * Math.cos(a);
}

export interface Block {
  x: number;
  y: number;
  w: number;
  d: number;
  /** Ketinggian alas (meter). */
  z?: number;
  h: number;
  color: string;
  edge?: string;
  /** Isi atap; bawaan `color`. */
  top?: string | CanvasPattern;
}

export function blockDepth(cam: IsoCam, b: Block) {
  return depth(cam, [b.x + b.w / 2, b.y + b.d / 2]);
}

export function drawBlock(ctx: CanvasRenderingContext2D, cam: IsoCam, b: Block) {
  const z0 = b.z ?? 0;
  const base: Pt[] = [
    [b.x, b.y],
    [b.x + b.w, b.y],
    [b.x + b.w, b.y + b.d],
    [b.x, b.y + b.d],
  ];
  const edge = b.edge ?? 'rgba(17,20,24,.28)';
  const lo = base.map((p) => iso(cam, p, z0));
  const hi = base.map((p) => iso(cam, p, z0 + b.h));
  if (b.h > 0.02 && cam.tilt > 0.01) {
    const a = (cam.angle * Math.PI * cam.tilt) / 180;
    // Sisi i menghubungkan sudut i → i+1; normal luarnya: utara, timur, selatan, barat.
    const normals: Pt[] = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    normals.forEach(([nx, ny], i) => {
      const toward = nx * Math.sin(a) + ny * Math.cos(a);
      if (toward <= 0.001) return;
      const j = (i + 1) % 4;
      const face = [lo[i], lo[j], hi[j], hi[i]] as Pt[];
      poly(ctx, face, shade(b.color, ny !== 0 ? 0.86 : 0.74), edge);
    });
  }
  poly(ctx, hi, b.top ?? b.color, edge);
}

/** Gambar banyak kotak dari belakang ke depan. */
export function drawBlocks(ctx: CanvasRenderingContext2D, cam: IsoCam, blocks: readonly Block[]) {
  const sorted = [...blocks].sort(
    (p, q) => (p.z ?? 0) - (q.z ?? 0) || blockDepth(cam, p) - blockDepth(cam, q),
  );
  for (const b of sorted) drawBlock(ctx, cam, b);
}

/** Poligon datar pada ketinggian `z` (lantai, koridor, area). */
export function floorPoly(
  ctx: CanvasRenderingContext2D,
  cam: IsoCam,
  points: readonly Pt[],
  z: number,
  fill: string | CanvasPattern | null,
  stroke: string | null = null,
  width = 1,
) {
  poly(
    ctx,
    points.map((p) => iso(cam, p, z)),
    fill,
    stroke,
    width,
  );
}

export function rectPts(x: number, y: number, w: number, d: number): Pt[] {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + d],
    [x, y + d],
  ];
}

/** Titik pada polyline sejauh `distance`, plus arah segmen saat itu. */
export function along(path: readonly Pt[], distance: number): { at: Pt; dir: Pt } {
  let left = Math.max(0, distance);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Pt;
    const b = path[i] as Pt;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= len) {
      const t = len ? left / len : 0;
      return {
        at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
        dir: [b[0] - a[0], b[1] - a[1]],
      };
    }
    left -= len;
  }
  const last = path[path.length - 1] as Pt;
  const prev = path[path.length - 2] ?? last;
  return { at: last, dir: [last[0] - prev[0], last[1] - prev[1]] };
}

export function pathLength(path: readonly Pt[]) {
  let sum = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Pt;
    const b = path[i] as Pt;
    sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return sum;
}

/** Potongan awal polyline sepanjang `distance`. */
export function partial(path: readonly Pt[], distance: number): Pt[] {
  const out: Pt[] = [];
  let left = distance;
  for (let i = 0; i < path.length; i++) {
    const p = path[i] as Pt;
    if (i === 0) {
      out.push(p);
      continue;
    }
    const a = path[i - 1] as Pt;
    const len = Math.hypot(p[0] - a[0], p[1] - a[1]);
    if (left >= len) {
      out.push(p);
      left -= len;
    } else {
      const t = len ? left / len : 0;
      out.push([a[0] + (p[0] - a[0]) * t, a[1] + (p[1] - a[1]) * t]);
      break;
    }
  }
  return out;
}
