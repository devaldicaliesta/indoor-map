// HP pengunjung dengan Visitor PanduArah (docs/05 "Visitor: HP", visitor-mall.jpg): kolom cari,
// ID/EN, pemilih lantai, peta, dan sheet bawah berisi Dari/Ke, jarak, chip lantai, langkah.
// Koordinat virtual 390 × 844.
import { C, FONT, floating, icon, noShadow, rrect, text } from '../shared/draw';
import type { IconName } from '../shared/icon-paths';
import { type IsoCam, iso } from '../shared/iso';
import type { Pt } from '../shared/stage';
import type { Copy } from './copy';
import { DESTINATION, DESTINATION_UNIT, FLOOR_D, FLOOR_W, LIFT_A } from './floor';
import {
  connectorIcons,
  destinationMark,
  drawPlan,
  drawRoute,
  qrSticker,
  youAreHere,
} from './plan';

export const PHONE_W = 390;
export const PHONE_H = 844;

export interface PhoneState {
  t: number;
  /** 0..1: kamera pemindai QR (1 = selesai, peta tampil). */
  scan: number;
  floor: 1 | 3;
  path: readonly Pt[];
  /** 0..1 panjang rute yang sudah tergambar. */
  progress: number;
  origin: Pt;
  closedA: number;
  steps: readonly string[];
  stepIcons: readonly IconName[];
  activeStep: number;
  distance: string;
  /** 0..1 sheet bawah naik. */
  sheet: number;
  /** 0..1 pemberitahuan penutupan di sheet. */
  notice: number;
  noticeText: string;
  view: MapView;
  /** Nama tujuan di sheet; bawaan tujuan utama. */
  destination?: string;
}

/** Bagian denah yang tampil di peta HP (meter) dan perbesarannya (px per meter). */
export interface MapView {
  ox: number;
  oy: number;
  scale: number;
}
export const WHOLE_FLOOR: MapView = { ox: FLOOR_W / 2 - 2.5, oy: FLOOR_D / 2, scale: 6.9 };
const mapCam = (v: MapView): IsoCam => ({ cx: 180, cy: 292, angle: -14, tilt: 0.55, ...v });

function scanner(ctx: CanvasRenderingContext2D, copy: Copy, s: PhoneState) {
  ctx.fillStyle = '#2b3036';
  ctx.fillRect(0, 0, PHONE_W, PHONE_H);
  // Dinding lobi kabur di belakang stiker QR.
  ctx.fillStyle = '#3a4048';
  ctx.fillRect(0, 520, PHONE_W, 324);
  ctx.fillStyle = '#454c55';
  ctx.fillRect(40, 140, 120, 300);
  qrSticker(ctx, [195, 470], 170, 1);
  const p = Math.min(1, s.scan / 0.85);
  const box = 230 - 20 * p;
  const x = 195 - box / 2;
  const y = 330 - box / 2 + 30;
  ctx.strokeStyle = C.surface;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (const [cx, cy, dx, dy] of [
    [x, y, 1, 1],
    [x + box, y, -1, 1],
    [x, y + box, 1, -1],
    [x + box, y + box, -1, -1],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * 34);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * 34, cy);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,194,14,.85)';
  ctx.fillRect(x + 12, y + 12 + (box - 24) * ((s.t * 1.8) % 1), box - 24, 3);
  rrect(ctx, 70, 640, 250, 44, 8, 'rgba(17,20,24,.75)');
  icon(ctx, 'scan-line', 100, 662, 20, C.surface, 2);
  text(ctx, copy.visitor.scanLabel, 118, 663, {
    size: 16,
    color: C.surface,
    family: FONT.visitor,
    weight: 700,
  });
  if (s.scan > 0.85) {
    ctx.fillStyle = `rgba(255,255,255,${1 - (s.scan - 0.85) / 0.15})`;
    ctx.fillRect(0, 0, PHONE_W, PHONE_H);
  }
}

function mapView(ctx: CanvasRenderingContext2D, copy: Copy, s: PhoneState) {
  ctx.fillStyle = C.canvas;
  ctx.fillRect(0, 0, PHONE_W, PHONE_H);
  const cam = mapCam(s.view);
  drawPlan(ctx, cam, {
    unitH: 3,
    closedA: s.closedA,
    highlight: s.floor === 3 ? DESTINATION_UNIT : null,
  });
  connectorIcons(ctx, cam, 2.8, 15);
  drawRoute(ctx, cam, s.path, { progress: s.progress, t: s.t, width: 7, z: 0.1 });
  if (s.closedA > 0) {
    // Label "Ditutup" di atas lift A agar penutupan terbaca walau HP kecil di layar.
    const [lx, ly] = iso(cam, [LIFT_A[0], LIFT_A[1]], 4);
    ctx.save();
    ctx.globalAlpha *= s.closedA;
    ctx.font = `700 15px ${FONT.visitor}`;
    const w = ctx.measureText(copy.visitor.closed).width + 20;
    rrect(ctx, lx - w / 2, ly - 40, w, 28, 4, C.danger);
    text(ctx, copy.visitor.closed, lx, ly - 25.5, {
      size: 15,
      weight: 700,
      color: C.surface,
      align: 'center',
      family: FONT.visitor,
    });
    ctx.restore();
  }
  if (s.floor === 3) destinationMark(ctx, iso(cam, DESTINATION, 0.1), 9, s.progress > 0.95 ? 1 : 0);
  if (s.floor === 1) {
    youAreHere(ctx, iso(cam, s.origin, 0.1), 9, s.t);
  }
  // Kolom cari mengambang + ID/EN.
  floating(ctx);
  rrect(ctx, 22, 62, 252, 46, 4, C.surface, C.ink, 1.5);
  rrect(ctx, 284, 62, 84, 46, 4, C.surface);
  noShadow(ctx);
  icon(ctx, 'search', 44, 85, 20, C.ink);
  text(ctx, copy.visitor.search, 62, 86, { size: 17, color: C.muted, family: FONT.visitor });
  rrect(ctx, 284, 62, 42, 46, 4, C.ink);
  text(ctx, 'ID', 305, 86, {
    size: 15,
    weight: 700,
    color: C.surface,
    align: 'center',
    family: FONT.visitor,
  });
  text(ctx, 'EN', 347, 86, {
    size: 15,
    weight: 700,
    color: C.muted,
    align: 'center',
    family: FONT.visitor,
  });
  // Pemilih lantai vertikal di tepi kanan.
  floating(ctx);
  rrect(ctx, 322, 124, 46, 132, 4, C.surface);
  noShadow(ctx);
  ['L3', 'L2', 'L1'].forEach((label, i) => {
    const active = (s.floor === 3 && i === 0) || (s.floor === 1 && i === 2);
    if (active) rrect(ctx, 322, 124 + i * 44, 46, 44, 4, C.ink);
    text(ctx, label, 345, 146 + i * 44, {
      size: 15,
      weight: 700,
      align: 'center',
      color: active ? C.surface : C.ink,
      family: FONT.mono,
    });
  });
  sheet(ctx, copy, s);
}

function sheet(ctx: CanvasRenderingContext2D, copy: Copy, s: PhoneState) {
  if (s.sheet <= 0) return;
  const top = 470 + (1 - s.sheet) * 380;
  floating(ctx, 1.4);
  rrect(ctx, 0, top, PHONE_W, PHONE_H - top + 20, 8, C.surface);
  noShadow(ctx);
  rrect(ctx, 175, top + 10, 40, 5, 3, C.line);
  const x = 24;
  let y = top + 42;
  text(ctx, copy.visitor.from, x, y, { size: 15, color: C.muted, family: FONT.visitor });
  youAreHere(ctx, [x + 66, y], 6, 0);
  text(ctx, copy.visitor.youAreHere, x + 80, y, { size: 16, weight: 700, family: FONT.visitor });
  y += 34;
  text(ctx, copy.visitor.to, x, y, { size: 15, color: C.muted, family: FONT.visitor });
  destinationMark(ctx, [x + 66, y], 6);
  text(ctx, s.destination ?? copy.visitor.destination, x + 80, y, {
    size: 16,
    weight: 700,
    family: FONT.visitor,
  });
  icon(ctx, 'arrow-up-down', 352, y - 17, 20, C.ink);
  y += 38;
  if (s.notice > 0) {
    ctx.save();
    ctx.globalAlpha = s.notice;
    rrect(ctx, x - 6, y - 18, PHONE_W - 2 * x + 12, 36, 4, '#fdf1ee');
    icon(ctx, 'octagon-x', x + 12, y, 18, C.danger, 2);
    text(ctx, s.noticeText, x + 30, y + 1, {
      size: 15,
      weight: 700,
      color: C.danger,
      family: FONT.visitor,
    });
    ctx.restore();
    y += 44 * s.notice;
  }
  text(ctx, s.distance, x, y, { size: 17, weight: 700, family: FONT.visitor });
  ['L1', 'L3'].forEach((label, i) => {
    const cx = x + 64 + i * 46;
    rrect(ctx, cx, y - 14, 40, 28, 4, C.surface, C.line);
    text(ctx, label, cx + 20, y + 1, { size: 14, family: FONT.mono, align: 'center' });
  });
  y += 42;
  s.steps.forEach((label, i) => {
    const sy = y + i * 46;
    if (sy > PHONE_H - 20) return;
    if (i === s.activeStep) rrect(ctx, x - 8, sy - 20, PHONE_W - 2 * x + 16, 40, 4, C.signalSoft);
    icon(ctx, s.stepIcons[i] ?? 'arrow-up', x + 12, sy, 20, C.ink);
    text(ctx, label, x + 38, sy + 1, {
      size: 17,
      family: FONT.visitor,
      weight: i === s.activeStep ? 700 : 400,
    });
  });
}

/** HP utuh: bingkai, isi layar, dan pulau kamera. `w` = lebar layar di kanvas. */
export function drawPhone(
  ctx: CanvasRenderingContext2D,
  copy: Copy,
  s: PhoneState,
  x: number,
  y: number,
  w: number,
) {
  const k = w / PHONE_W;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  floating(ctx, 3);
  rrect(ctx, -12, -12, PHONE_W + 24, PHONE_H + 24, 56, C.ink);
  noShadow(ctx);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, PHONE_W, PHONE_H, 44);
  ctx.clip();
  if (s.scan < 1) scanner(ctx, copy, s);
  else mapView(ctx, copy, s);
  ctx.restore();
  rrect(ctx, PHONE_W / 2 - 54, 12, 108, 30, 15, C.ink);
  text(ctx, '08.31', 52, 28, {
    size: 14,
    weight: 700,
    color: s.scan < 1 ? C.surface : C.ink,
    family: FONT.visitor,
  });
  ctx.restore();
}
