// Halaman Editor Peta Admin: alat di kiri, daftar fitur, kanvas peta, panel properti/validasi,
// status bar. Keadaan (denah, ruang terisi, graf jalur, validasi, publish) dikendalikan adegan.
import { clamp } from '../shared/anim';
import { C, FONT, icon, poly, rrect, text } from '../shared/draw';
import type { IconName } from '../shared/icon-paths';
import { floorPoly, type IsoCam, iso, rectPts } from '../shared/iso';
import { ADMIN_H, ADMIN_W, button, drawSidebar, drawTopBar, statusDot } from './admin-shell';
import type { Copy } from './copy';
import { CONNECTORS, FLOOR_D, FLOOR_W, NAV_EDGES, NAV_NODES, UNITS } from './floor';
import { drawPlan } from './plan';

export interface EditorState {
  /** 0..1 denah PDF abu-abu diletakkan di kanvas. */
  planIn: number;
  tool: number;
  /** Jumlah unit yang sudah digambar (pecahan = sedang digambar). */
  filled: number;
  /** 0..1 simpul dan edge jalur. */
  graph: number;
  /** Jumlah butir validasi yang sudah hijau (−1 = panel validasi belum tampil). */
  checks: number;
  publishPress: number;
  live: boolean;
}

const TOOLS: IconName[] = [
  'mouse-pointer-2',
  'pentagon',
  'spline',
  'map-pin',
  'waypoints',
  'arrow-up-down',
];
export const EDITOR_CAM: IsoCam = {
  cx: 721,
  cy: 410,
  scale: 11.4,
  angle: 0,
  tilt: 0,
  ox: FLOOR_W / 2,
  oy: FLOOR_D / 2,
};
/** Posisi layar Admin untuk sudut unit ke-i (dipakai kursor saat menggambar). */
export function unitCorner(i: number): [number, number] {
  const u = UNITS[Math.min(UNITS.length - 1, Math.max(0, i))];
  if (!u) return [721, 410];
  return iso(EDITOR_CAM, [u.x + u.w, u.y + u.d]);
}
export const PUBLISH_BUTTON = { x: 1178, y: 39, w: 92, h: 27 };
export const VALIDATE_BUTTON = { x: 1100, y: 39, w: 72, h: 27 };

function toolbarRow(ctx: CanvasRenderingContext2D, copy: Copy, s: EditorState) {
  ctx.fillStyle = C.surface;
  ctx.fillRect(160, 33, ADMIN_W - 160, 40);
  ctx.fillStyle = C.line;
  ctx.fillRect(160, 72, ADMIN_W - 160, 1);
  rrect(ctx, 168, 40, 112, 26, 4, C.surface, C.line);
  text(ctx, copy.admin.building, 176, 53, { size: 11 });
  icon(ctx, 'chevron-down', 268, 53, 11, C.ink);
  ['GF', 'L1', 'L2', 'L3'].forEach((label, i) => {
    const x = 288 + i * 27;
    rrect(ctx, x, 40, 26, 26, 3, i === 1 ? C.ink : C.surface, C.line);
    text(ctx, label, x + 13, 53, {
      size: 10.5,
      weight: 700,
      align: 'center',
      color: i === 1 ? C.surface : C.ink,
    });
  });
  rrect(ctx, 404, 40, 132, 26, 4, C.surface, C.line);
  text(ctx, copy.admin.noReference, 412, 53, { size: 10.5 });
  icon(ctx, 'chevron-down', 524, 53, 11, C.ink);
  statusDot(ctx, 905, 53, copy.admin.geometryValid, C.ok);
  statusDot(ctx, 1000, 53, s.live ? copy.admin.live : copy.admin.draftSaved, C.ok);
  const v = VALIDATE_BUTTON;
  button(ctx, v.x, v.y, v.w, v.h, copy.admin.validate, 'outline');
  const p = PUBLISH_BUTTON;
  button(ctx, p.x, p.y, p.w, p.h, copy.admin.publish, 'primary', s.publishPress);
}

function featurePanel(ctx: CanvasRenderingContext2D, copy: Copy, s: EditorState) {
  ctx.fillStyle = C.surface;
  ctx.fillRect(160, 73, 170, ADMIN_H - 103);
  ctx.fillStyle = C.line;
  ctx.fillRect(188, 73, 1, ADMIN_H - 103);
  ctx.fillRect(330, 73, 1, ADMIN_H - 103);
  TOOLS.forEach((name, i) => {
    const y = 92 + i * 26;
    if (i === s.tool) rrect(ctx, 163, y - 11, 22, 22, 4, C.signalSoft, C.ink, 1);
    icon(ctx, name, 174, y, 13, C.ink);
  });
  icon(ctx, 'undo-2', 174, 260, 12, C.line);
  icon(ctx, 'redo-2', 174, 284, 12, C.line);
  const [tab0, tab1, tab2] = copy.admin.tabs;
  text(ctx, tab0, 198, 88, { size: 10.5, weight: 700 });
  ctx.fillStyle = C.ink;
  ctx.fillRect(196, 96, 30, 2);
  text(ctx, tab1, 240, 88, { size: 10.5, color: C.muted });
  text(ctx, tab2, 292, 88, { size: 10.5, color: C.muted });
  text(ctx, copy.admin.features, 198, 114, { size: 11, weight: 700 });
  rrect(ctx, 196, 124, 126, 24, 4, C.surface, C.line);
  text(ctx, copy.admin.search, 203, 136.5, { size: 9.5, color: C.muted });
  copy.admin.groups.forEach(([label, total], i) => {
    const y = 166 + i * 21;
    const count =
      i === 0 ? Math.floor(s.filled) : s.graph > 0.1 || s.filled >= UNITS.length ? total : 0;
    icon(ctx, 'chevron-right', 202, y, 10, C.ink);
    text(ctx, label, 211, y + 0.5, { size: 11 });
    text(ctx, String(count), 320, y + 0.5, {
      size: 10.5,
      align: 'right',
      family: FONT.mono,
      color: C.muted,
    });
  });
}

function canvasArea(ctx: CanvasRenderingContext2D, copy: Copy, s: EditorState) {
  ctx.fillStyle = C.canvas;
  ctx.fillRect(331, 73, 781, ADMIN_H - 103);
  ctx.save();
  ctx.beginPath();
  ctx.rect(331, 73, 781, ADMIN_H - 103);
  ctx.clip();
  const cam = EDITOR_CAM;
  if (s.planIn > 0) {
    // Denah PDF: kertas abu-abu dengan garis dinding, turun dan memudar masuk.
    ctx.save();
    ctx.globalAlpha = s.planIn;
    ctx.translate(0, (1 - s.planIn) * -40);
    const paper = rectPts(-3, -3, FLOOR_W + 6, FLOOR_D + 6);
    floorPoly(ctx, cam, paper, 0, '#e4e6e1', '#b9bec4', 1);
    for (const u of UNITS)
      floorPoly(ctx, cam, rectPts(u.x, u.y, u.w, u.d), 0, null, '#9aa1a8', 1.2);
    for (const c of CONNECTORS)
      floorPoly(ctx, cam, rectPts(c.x, c.y, c.w, c.d), 0, null, '#9aa1a8', 1.2);
    floorPoly(ctx, cam, rectPts(0, 0, FLOOR_W, FLOOR_D), 0, null, '#7c838b', 2);
    const [px, py] = iso(cam, [-3, -3]);
    rrect(ctx, px, py - 24, 104, 18, 3, C.surface, C.line);
    icon(ctx, 'file-text', px + 10, py - 15, 11, C.danger);
    text(ctx, copy.admin.planFile, px + 19, py - 14.5, { size: 9.5, family: FONT.mono });
    ctx.restore();
  }
  if (s.filled > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(s.filled * 2);
    drawPlan(ctx, cam, { filled: s.filled, emptyFill: null, slab: s.filled >= 1 });
    ctx.restore();
    // Unit yang sedang digambar: garis tepi tergambar mengikuti kursor.
    const current = UNITS[Math.floor(s.filled)];
    const f = s.filled % 1;
    if (current && f > 0) {
      const pts = rectPts(current.x, current.y, current.w, current.d).map((p) => iso(cam, p));
      ctx.save();
      ctx.setLineDash([5, 4]);
      poly(ctx, pts.slice(0, 1 + Math.ceil(f * 3)), null, C.ink, 1.5);
      ctx.restore();
      for (const p of pts) {
        ctx.fillStyle = C.surface;
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1.2;
        ctx.fillRect(p[0] - 2.5, p[1] - 2.5, 5, 5);
        ctx.strokeRect(p[0] - 2.5, p[1] - 2.5, 5, 5);
      }
    }
  }
  if (s.graph > 0) {
    const edges = Math.floor(NAV_EDGES.length * s.graph);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    NAV_EDGES.slice(0, edges).forEach(([a, b]) => {
      const pa = iso(cam, NAV_NODES[a] ?? [0, 0]);
      const pb = iso(cam, NAV_NODES[b] ?? [0, 0]);
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
    });
    ctx.stroke();
    const shown = new Set(NAV_EDGES.slice(0, edges).flat());
    NAV_NODES.forEach((node, i) => {
      if (!shown.has(i)) return;
      const [x, y] = iso(cam, node);
      ctx.fillStyle = i < 10 ? C.surface : C.signal;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x, y, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
  ctx.restore();
  rrect(ctx, 1052, 694, 50, 24, 4, C.surface, C.line);
  rrect(ctx, 1052, 694, 25, 24, 4, C.ink);
  text(ctx, '2D', 1064.5, 706.5, { size: 9.5, weight: 700, align: 'center', color: C.surface });
  text(ctx, '3D', 1089.5, 706.5, { size: 9.5, weight: 700, align: 'center' });
  rrect(ctx, 1077, 724, 25, 36, 4, C.surface, C.line);
  icon(ctx, 'plus', 1089.5, 733, 11, C.ink);
  icon(ctx, 'minus', 1089.5, 751, 11, C.ink);
}

function propertiesPanel(ctx: CanvasRenderingContext2D, copy: Copy, s: EditorState, t: number) {
  ctx.fillStyle = C.surface;
  ctx.fillRect(1112, 73, 168, ADMIN_H - 103);
  ctx.fillStyle = C.line;
  ctx.fillRect(1112, 73, 1, ADMIN_H - 103);
  if (s.checks < 0) {
    const words = copy.admin.selectHint.split(' ');
    let line = '';
    let y = 92;
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      ctx.font = `400 10.5px ${FONT.admin}`;
      if (ctx.measureText(next).width > 148) {
        text(ctx, line, 1122, y, { size: 10.5, color: C.muted });
        line = w;
        y += 15;
      } else line = next;
    }
    text(ctx, line, 1122, y, { size: 10.5, color: C.muted });
    return;
  }
  text(ctx, copy.admin.validationTitle, 1122, 92, { size: 11.5, weight: 700 });
  copy.admin.checks.forEach((label, i) => {
    const y = 118 + i * 26;
    const done = s.checks >= i + 1;
    const running = !done && s.checks > i;
    if (done) icon(ctx, 'circle-check', 1130, y, 14, C.ok, 2.2);
    else {
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(1130, y, 6, 0, Math.PI * 2);
      ctx.stroke();
      if (running) {
        ctx.strokeStyle = C.ink;
        ctx.beginPath();
        ctx.arc(1130, y, 6, t * 9, t * 9 + 1.8);
        ctx.stroke();
      }
    }
    text(ctx, label, 1143, y + 0.5, {
      size: 10.5,
      color: done ? C.ink : C.muted,
      weight: done ? 700 : 400,
    });
  });
}

function statusBar(ctx: CanvasRenderingContext2D, copy: Copy, s: EditorState) {
  ctx.fillStyle = C.surface;
  ctx.fillRect(160, ADMIN_H - 30, ADMIN_W - 160, 30);
  ctx.fillStyle = C.line;
  ctx.fillRect(160, ADMIN_H - 30, ADMIN_W - 160, 1);
  const features = Math.floor(s.filled) + (s.graph > 0.1 ? 11 : 0);
  const edges = Math.floor(NAV_EDGES.length * s.graph);
  const [featureUnit, edgeUnit] = copy.admin.statusUnits;
  text(
    ctx,
    `${copy.admin.snap}   ${features} ${featureUnit}   ${edges} ${edgeUnit}`,
    170,
    ADMIN_H - 15,
    {
      size: 10,
      family: FONT.mono,
    },
  );
}

export function drawEditor(
  ctx: CanvasRenderingContext2D,
  copy: Copy,
  s: EditorState,
  logo: HTMLImageElement,
  t: number,
) {
  ctx.fillStyle = C.canvas;
  ctx.fillRect(0, 0, ADMIN_W, ADMIN_H);
  drawSidebar(ctx, copy, 1, logo);
  drawTopBar(ctx, copy);
  toolbarRow(ctx, copy, s);
  featurePanel(ctx, copy, s);
  canvasArea(ctx, copy, s);
  propertiesPanel(ctx, copy, s, t);
  statusBar(ctx, copy, s);
}
