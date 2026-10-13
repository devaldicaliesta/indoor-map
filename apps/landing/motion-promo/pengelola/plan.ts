// Menggambar denah lantai (2D atau 3D) beserta rute, penanda "Anda di sini", tujuan, dan
// penutupan. Dipakai di kanvas Admin, gedung 3D, dan peta HP.
import { C, closureHatch, icon, mix, poly, trace } from '../shared/draw';
import {
  type Block,
  drawBlocks,
  floorPoly,
  type IsoCam,
  iso,
  partial,
  pathLength,
  rectPts,
} from '../shared/iso';
import type { Pt } from '../shared/stage';
import { CONNECTORS, CORRIDORS, type Connector, FLOOR_D, FLOOR_W, UNITS, type Unit } from './floor';

export interface PlanOpts {
  z?: number;
  /** Tinggi ekstrusi unit (0 = denah datar). */
  unitH?: number;
  /** Jumlah unit yang sudah berwarna (pecahan = unit berikutnya sedang terisi). */
  filled?: number;
  /** Warna unit yang belum terisi; `null` = hanya garis. */
  emptyFill?: string | null;
  /** 0..1: denah pudar seperti lantai yang tidak aktif. */
  ghost?: number;
  /** 0..1: arsir penutupan di lift A. */
  closedA?: number;
  highlight?: Unit | null;
  slab?: boolean;
}

function connectorColor(c: Connector) {
  return c.kind === 'escalator' || c.kind === 'stairs' ? C.connector : '#d9e2f2';
}

export function drawPlan(ctx: CanvasRenderingContext2D, cam: IsoCam, o: PlanOpts = {}) {
  const z = o.z ?? 0;
  const ghost = o.ghost ?? 0;
  // Lantai tidak aktif digambar datar agar lantai lain tetap terbaca di belakangnya.
  const h = ghost > 0.5 ? 0 : (o.unitH ?? 0);
  ctx.save();
  ctx.globalAlpha *= 1 - 0.72 * ghost;
  const foot = rectPts(0, 0, FLOOR_W, FLOOR_D);
  if (o.slab !== false) {
    if (h > 0 && cam.tilt > 0) {
      drawBlocks(ctx, cam, [
        { x: 0, y: 0, w: FLOOR_W, d: FLOOR_D, z: z - 0.6, h: 0.6, color: '#e7e9e4' },
      ]);
    }
    floorPoly(ctx, cam, foot, z, C.surface, C.ink, ghost > 0.5 ? 1 : 2);
  }
  for (const corridor of CORRIDORS) floorPoly(ctx, cam, corridor, z, C.corridor);
  const blocks: Block[] = [];
  UNITS.forEach((u, i) => {
    const fill = Math.max(0, Math.min(1, (o.filled ?? UNITS.length) - i));
    const base = o.emptyFill === undefined ? '#f7f7f4' : o.emptyFill;
    const color =
      o.highlight === u ? C.signalSoft : fill > 0 ? mix(base ?? '#ffffff', u.color, fill) : base;
    if (h > 0 && cam.tilt > 0 && color) {
      blocks.push({
        x: u.x,
        y: u.y,
        w: u.w,
        d: u.d,
        z,
        h: h * (0.4 + 0.6 * Math.max(fill, ghost)),
        color,
      });
    } else {
      floorPoly(
        ctx,
        cam,
        rectPts(u.x, u.y, u.w, u.d),
        z,
        color,
        o.highlight === u ? C.ink : C.unitLine,
        1,
      );
    }
  });
  for (const c of CONNECTORS) {
    const color = connectorColor(c);
    if (h > 0 && cam.tilt > 0)
      blocks.push({ x: c.x, y: c.y, w: c.w, d: c.d, z, h: h * 0.9, color });
    else floorPoly(ctx, cam, rectPts(c.x, c.y, c.w, c.d), z, color, C.wall, 1);
  }
  if (blocks.length) drawBlocks(ctx, cam, blocks);
  if ((o.closedA ?? 0) > 0) {
    const lift = CONNECTORS[0] as Connector;
    ctx.save();
    ctx.globalAlpha *= o.closedA ?? 0;
    const top = z + (h > 0 && cam.tilt > 0 ? h * 0.9 : 0) + 0.02;
    floorPoly(
      ctx,
      cam,
      rectPts(lift.x - 0.6, lift.y - 0.6, lift.w + 1.2, lift.d + 1.2),
      top,
      closureHatch(ctx),
      C.danger,
      2,
    );
    ctx.restore();
  }
  ctx.restore();
}

/** Ikon kecil di atas konektor (lift) agar terbaca di peta HP. */
export function connectorIcons(
  ctx: CanvasRenderingContext2D,
  cam: IsoCam,
  z: number,
  size: number,
) {
  for (const c of CONNECTORS) {
    if (c.kind !== 'liftA' && c.kind !== 'liftB') continue;
    const [x, y] = iso(cam, [c.x + c.w / 2, c.y + c.d / 2], z);
    icon(ctx, 'arrow-up-down', x, y, size, C.ink, 2);
  }
}

/** Garis rute: tepi putih, isi `--route`, pola aliran putus-putus yang bergerak. */
export function drawRoute(
  ctx: CanvasRenderingContext2D,
  cam: IsoCam,
  path: readonly Pt[],
  o: { z?: number; progress?: number; t: number; width: number; alpha?: number; zEnd?: number },
) {
  const total = pathLength(path);
  const visible = partial(path, total * (o.progress ?? 1));
  if (visible.length < 2) return;
  const screen = visible.map((p, i) => {
    const f = visible.length > 1 ? i / (visible.length - 1) : 0;
    return iso(cam, p, (o.z ?? 0) + ((o.zEnd ?? o.z ?? 0) - (o.z ?? 0)) * f + 0.05);
  });
  strokeRoute(ctx, screen, o.width, o.t, o.alpha ?? 1);
}

export function strokeRoute(
  ctx: CanvasRenderingContext2D,
  screen: readonly Pt[],
  width: number,
  t: number,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [color, w] of [
    ['rgba(20,99,255,.18)', width * 3.2],
    [C.surface, width + 4],
    [C.route, width],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    trace(ctx, screen);
    ctx.stroke();
  }
  ctx.setLineDash([width * 1.4, width * 2]);
  ctx.lineDashOffset = -t * width * 6;
  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = Math.max(1.5, width * 0.32);
  ctx.beginPath();
  trace(ctx, screen);
  ctx.stroke();
  ctx.restore();
}

/** Penanda "Anda di sini" (kuning, dari QR titik asal), berdenyut. */
export function youAreHere(
  ctx: CanvasRenderingContext2D,
  [x, y]: Pt,
  r: number,
  t: number,
  alpha = 1,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const phase = (t / 1.15) % 1;
  ctx.fillStyle = `rgba(255,194,14,${0.5 * (1 - phase)})`;
  ctx.beginPath();
  ctx.arc(x, y, r * (1.3 + phase * 1.6), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.signal;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = Math.max(2, r * 0.26);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Penanda tujuan: cincin `--route` berisi putih. */
export function destinationMark(ctx: CanvasRenderingContext2D, [x, y]: Pt, r: number, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = C.surface;
  ctx.strokeStyle = C.route;
  ctx.lineWidth = r * 0.45;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Stiker QR kuning berdiri di titik asal; `pop` 0..1 untuk animasi muncul. */
export function qrSticker(ctx: CanvasRenderingContext2D, [x, y]: Pt, size: number, pop: number) {
  if (pop <= 0) return;
  const s = size * pop;
  ctx.save();
  ctx.translate(x, y - s * 0.55);
  ctx.fillStyle = C.ink;
  ctx.fillRect(-1.5, s * 0.5, 3, s * 0.55);
  poly(
    ctx,
    [
      [-s / 2, -s / 2],
      [s / 2, -s / 2],
      [s / 2, s / 2],
      [-s / 2, s / 2],
    ],
    C.signal,
    C.ink,
    Math.max(1.5, s * 0.06),
  );
  const cell = s / 9;
  ctx.fillStyle = C.ink;
  const bits = [0b1110111, 0b1010101, 0b1110111, 0b0001000, 0b1101011, 0b0010100, 0b1110101];
  bits.forEach((row, r) => {
    for (let c = 0; c < 7; c++) {
      if ((row >> (6 - c)) & 1)
        ctx.fillRect(-s / 2 + cell * (c + 1), -s / 2 + cell * (r + 1), cell, cell);
    }
  });
  ctx.restore();
}
