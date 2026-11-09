// Kerangka Admin yang digambar ulang dari aplikasi asli (apps/admin, tangkapan layar
// admin-editor.jpg): sidebar menu, bar venue, kursor, toast. Koordinat virtual 1280 × 800.
import { easeInOut, lerp, span } from '../shared/anim';
import { C, floating, icon, noShadow, rrect, text } from '../shared/draw';
import type { IconName } from '../shared/icon-paths';
import type { Rect } from '../shared/stage';
import type { Copy } from './copy';

export const ADMIN_W = 1280;
export const ADMIN_H = 800;

const NAV_ICONS: IconName[] = [
  'building',
  'map',
  'map-pin',
  'octagon-x',
  'qr-code',
  'send',
  'settings',
  'users',
  'shield-check',
];

/** Kamera di dalam layar: titik fokus (px Admin) dan perbesaran, dengan keyframe waktu. */
export interface ViewKey {
  t: number;
  fx: number;
  fy: number;
  zoom: number;
}

export function viewAt(keys: readonly ViewKey[], t: number): ViewKey {
  const first = keys[0] as ViewKey;
  if (t <= first.t) return first;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1] as ViewKey;
    const b = keys[i] as ViewKey;
    if (t <= b.t) {
      const e = easeInOut(span(t, a.t, b.t));
      return { t, fx: lerp(a.fx, b.fx, e), fy: lerp(a.fy, b.fy, e), zoom: lerp(a.zoom, b.zoom, e) };
    }
  }
  return keys[keys.length - 1] as ViewKey;
}

/** Gambar isi Admin ke `rect` layar dengan kamera `view`; isi dipotong di tepi layar monitor. */
export function inAdminView(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  view: ViewKey,
  draw: () => void,
) {
  const base = rect.w / ADMIN_W;
  const s = base * view.zoom;
  // Fokus diusahakan di tengah, tetapi layar tidak boleh menampilkan area di luar Admin.
  const half = { w: rect.w / 2 / s, h: rect.h / 2 / s };
  const fx = Math.min(Math.max(view.fx, half.w), ADMIN_W - half.w);
  const fy = Math.min(Math.max(view.fy, half.h), ADMIN_H - half.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.scale(s, s);
  ctx.translate(-fx, -fy);
  draw();
  ctx.restore();
}

/** Bingkai monitor desktop di sekeliling `screen`. */
export function monitorFrame(ctx: CanvasRenderingContext2D, screen: Rect, alpha = 1) {
  const pad = Math.max(6, screen.w * 0.012);
  ctx.save();
  ctx.globalAlpha *= alpha;
  floating(ctx, 2);
  rrect(
    ctx,
    screen.x - pad,
    screen.y - pad,
    screen.w + pad * 2,
    screen.h + pad * 2,
    pad * 1.4,
    C.ink,
  );
  noShadow(ctx);
  ctx.restore();
}

export function drawSidebar(
  ctx: CanvasRenderingContext2D,
  copy: Copy,
  active: number,
  logo: HTMLImageElement,
) {
  ctx.fillStyle = C.surface;
  ctx.fillRect(0, 0, 160, ADMIN_H);
  ctx.fillStyle = C.line;
  ctx.fillRect(159, 0, 1, ADMIN_H);
  ctx.drawImage(logo, 12, 9, 80, 21);
  text(ctx, 'Admin', 96, 22, { size: 10, color: C.muted });
  copy.admin.nav.forEach((label, i) => {
    const y = 56 + i * 22;
    if (i === active) rrect(ctx, 4, y - 10, 152, 21, 4, C.signalSoft);
    icon(ctx, NAV_ICONS[i] as IconName, 18, y, 12, C.ink);
    text(ctx, label, 30, y + 0.5, { size: 11.5, weight: i === active ? 700 : 400 });
  });
  icon(ctx, 'chevron-right', 18, 784, 12, C.muted);
  text(ctx, copy.admin.collapse, 30, 784, { size: 11, color: C.muted });
}

export function drawTopBar(ctx: CanvasRenderingContext2D, copy: Copy) {
  ctx.fillStyle = C.surface;
  ctx.fillRect(160, 0, ADMIN_W - 160, 33);
  ctx.fillStyle = C.line;
  ctx.fillRect(160, 32, ADMIN_W - 160, 1);
  rrect(ctx, 170, 5, 150, 23, 4, C.surface, C.ink, 1);
  text(ctx, copy.admin.venue, 178, 17, { size: 11, weight: 700 });
  icon(ctx, 'chevron-down', 308, 17, 11, C.ink);
  text(ctx, copy.admin.account, 1244, 12, { size: 10.5, weight: 700, align: 'right' });
  text(ctx, 'Admin', 1244, 24, { size: 9.5, color: C.muted, align: 'right' });
  icon(ctx, 'chevron-down', 1258, 17, 11, C.ink);
}

export function statusDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string,
  size = 10.5,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, label, x + 7, y + 0.5, { size });
}

export function button(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  kind: 'primary' | 'outline' | 'ghost',
  press = 0,
) {
  const inset = press * 1.5;
  const fill = kind === 'primary' ? (press > 0 ? '#f2b500' : C.signal) : C.surface;
  rrect(
    ctx,
    x + inset,
    y + inset,
    w - inset * 2,
    h - inset * 2,
    4,
    kind === 'ghost' ? null : fill,
    kind === 'outline' ? C.line : null,
  );
  text(ctx, label, x + w / 2, y + h / 2 + 0.5, { size: 11.5, weight: 700, align: 'center' });
}

/** Toast keberhasilan seperti sonner di Admin. */
export function toast(ctx: CanvasRenderingContext2D, label: string, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, alpha * 1.4);
  const y = 712 + (1 - alpha) * 24;
  floating(ctx);
  rrect(ctx, 960, y, 300, 44, 8, C.surface, C.line);
  noShadow(ctx);
  icon(ctx, 'circle-check', 984, y + 22, 16, C.ok, 2);
  text(ctx, label, 1002, y + 22.5, { size: 12.5, weight: 700 });
  ctx.restore();
}

/** Kursor panah dengan lingkar klik. */
export function cursor(ctx: CanvasRenderingContext2D, x: number, y: number, click: number) {
  if (click > 0 && click < 1) {
    ctx.strokeStyle = `rgba(17,20,24,${0.45 * (1 - click)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6 + click * 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.25, 1.25);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 15);
  ctx.lineTo(4, 11.5);
  ctx.lineTo(7, 17.5);
  ctx.lineTo(9.5, 16.3);
  ctx.lineTo(6.6, 10.6);
  ctx.lineTo(11.5, 10.6);
  ctx.closePath();
  ctx.fillStyle = C.ink;
  ctx.strokeStyle = C.surface;
  ctx.lineWidth = 1.4;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Posisi kursor di antara titik-titik tujuan (detik → px Admin). */
export function cursorPath(
  keys: readonly { t: number; x: number; y: number }[],
  t: number,
): [number, number] {
  const first = keys[0] as { t: number; x: number; y: number };
  if (t <= first.t) return [first.x, first.y];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1] as { t: number; x: number; y: number };
    const b = keys[i] as { t: number; x: number; y: number };
    if (t <= b.t) {
      const e = easeInOut(span(t, a.t, b.t));
      return [lerp(a.x, b.x, e), lerp(a.y, b.y, e)];
    }
  }
  const last = keys[keys.length - 1] as { t: number; x: number; y: number };
  return [last.x, last.y];
}

/** Letak layar Admin: monitor 16:10 di 16:9; panel tegak penuh (diperbesar) di 9:16. */
export function adminScreenRect(portrait: boolean, visual: Rect): Rect {
  if (portrait) return { ...visual };
  const w = Math.min(visual.w * 0.98, (visual.h * 0.9 * ADMIN_W) / ADMIN_H);
  const h = (w * ADMIN_H) / ADMIN_W;
  return { x: visual.x + (visual.w - w) / 2, y: visual.y + (visual.h - h) / 2 - 10, w, h };
}

/** Perbesaran minimum agar isi Admin menutupi seluruh `rect`. */
export function coverZoom(rect: Rect) {
  return Math.max(1, (rect.h * ADMIN_W) / rect.w / ADMIN_H);
}

export function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
}

/** Kaki monitor di bawah layar (hanya 16:9). */
export function monitorStand(ctx: CanvasRenderingContext2D, screen: Rect, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  const cx = screen.x + screen.w / 2;
  const bottom = screen.y + screen.h + screen.w * 0.012;
  ctx.fillStyle = '#2a2f36';
  ctx.beginPath();
  ctx.moveTo(cx - screen.w * 0.05, bottom);
  ctx.lineTo(cx + screen.w * 0.05, bottom);
  ctx.lineTo(cx + screen.w * 0.07, bottom + screen.w * 0.05);
  ctx.lineTo(cx - screen.w * 0.07, bottom + screen.w * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
