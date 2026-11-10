// Adegan 5: server di dalam garis luar gedung dengan gembok; titik data berputar di antara
// Admin, Info Point, HP pengunjung, dan server, tidak pernah keluar dinding. Chip: on-premise,
// backup harian, lisensi per paket.
import { backOut, clamp, easeInOut, easeOut, span } from '../shared/anim';
import {
  C,
  FONT,
  floating,
  icon,
  noShadow,
  paperGrid,
  rrect,
  strokeOnce,
  text,
  trace,
} from '../shared/draw';
import type { IconName } from '../shared/icon-paths';
import {
  along,
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
import { qrSticker } from './plan';
import type { SceneArgs, SceneModule, Sfx } from './scene';

const IN = 0.7;
const SITE = { w: 32, d: 22 };
const K = { outline: 0.5, rack: 1.5, lock: 3, loop: 3.5, chips: [5, 6, 7] };
const OUTLINE: Pt[] = [
  [0, 0],
  [SITE.w, 0],
  [SITE.w, SITE.d],
  [0, SITE.d],
  [0, 0],
];
/** Lingkar data: server → Admin → Info Point → HP → server. */
const LOOP: Pt[] = [
  [16, 11],
  [6, 5.2],
  [26, 5.2],
  [25.5, 17.5],
  [7, 17.5],
  [16, 11],
];

function camera(a: SceneArgs, t: number): IsoCam {
  const v = a.layout.visual;
  const portrait = a.stage.portrait;
  const scale = (portrait ? 22 : 24) * (1 + 0.05 * easeInOut(t / a.dur));
  const cam: IsoCam = {
    cx: 0,
    cy: 0,
    scale,
    angle: -30 + 8 * easeInOut(t / a.dur),
    tilt: 1,
    ox: SITE.w / 2,
    oy: SITE.d / 2,
  };
  const center: Pt = portrait
    ? [v.x + v.w / 2, v.y + v.h * 0.34]
    : [v.x + v.w / 2, v.y + v.h * 0.5];
  return { ...cam, cx: center[0], cy: center[1] + scale * 1.5 };
}

function devices(ctx: CanvasRenderingContext2D, cam: IsoCam, t: number, appear: number) {
  const blocks: Block[] = [
    { x: 4.5, y: 4, w: 3, d: 1.4, h: 1, color: '#c9d3e0' },
    { x: 5.2, y: 4.1, w: 1.6, d: 0.3, z: 1, h: 1, color: '#2a2f36' },
    { x: 25.3, y: 4.3, w: 1.4, d: 1.4, h: 2.4, color: '#2a2f36' },
    { x: 14, y: 9.5, w: 4, d: 3, h: 5.5 * appear, color: '#2a2f36' },
    { x: 19, y: 10.3, w: 1.6, d: 1.6, h: 1.4 * appear, color: '#3a4048' },
  ];
  drawBlocks(ctx, cam, blocks);
  if (appear <= 0) return;
  // Laci server dan lampu yang berkedip mengikuti ketukan.
  for (let i = 0; i < 6; i++) {
    const z = 0.6 + i * 0.8;
    if (z > 5.3 * appear) break;
    const a = iso(cam, [14.2, 12.5], z);
    const b = iso(cam, [17.8, 12.5], z);
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = Math.max(1, cam.scale * 0.06);
    strokeOnce(ctx, [a, b]);
    const on = Math.floor(t * 3.5 + i * 1.7) % 3 !== 0;
    const led = iso(cam, [17.3, 12.5], z + 0.35);
    ctx.fillStyle = on ? '#3ddc97' : '#1d5a43';
    ctx.beginPath();
    ctx.arc(led[0], led[1], Math.max(2, cam.scale * 0.12), 0, Math.PI * 2);
    ctx.fill();
  }
  // Layar Admin kecil dan HP pengunjung di dalam gedung.
  const screen = [
    iso(cam, [5.3, 4.4], 1.1),
    iso(cam, [6.7, 4.4], 1.1),
    iso(cam, [6.7, 4.4], 1.9),
    iso(cam, [5.3, 4.4], 1.9),
  ];
  ctx.fillStyle = C.surface;
  ctx.beginPath();
  trace(ctx, screen);
  ctx.fill();
  const [px, py] = iso(cam, [25.5, 17.5], 1.2);
  rrect(
    ctx,
    px - cam.scale * 0.5,
    py - cam.scale * 0.9,
    cam.scale,
    cam.scale * 1.8,
    cam.scale * 0.18,
    C.ink,
  );
  rrect(
    ctx,
    px - cam.scale * 0.38,
    py - cam.scale * 0.75,
    cam.scale * 0.76,
    cam.scale * 1.5,
    2,
    '#c9def5',
  );
  qrSticker(ctx, iso(cam, [7, 17.5], 0), cam.scale * 1.3, 1);
}

function dataLoop(ctx: CanvasRenderingContext2D, cam: IsoCam, t: number, p: number) {
  if (p <= 0) return;
  const total = pathLength(LOOP);
  ctx.save();
  ctx.setLineDash([cam.scale * 0.5, cam.scale * 0.5]);
  ctx.lineDashOffset = -t * cam.scale * 2;
  ctx.strokeStyle = 'rgba(20,99,255,.45)';
  ctx.lineWidth = Math.max(2, cam.scale * 0.14);
  strokeOnce(
    ctx,
    partial(LOOP, total * p).map((q) => iso(cam, q, 0.4)),
  );
  ctx.restore();
  for (let k = 0; k < 7; k++) {
    const d = (((t * 9 + (k * total) / 7) % total) + total) % total;
    if (d > total * p) continue;
    const { at, dir } = along(LOOP, d);
    const [x, y] = iso(cam, at, 0.4);
    const [hx, hy] = iso(cam, [at[0] + dir[0] * 0.01, at[1] + dir[1] * 0.01], 0.4);
    const angle = Math.atan2(hy - y, hx - x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const s = Math.max(5, cam.scale * 0.42);
    ctx.fillStyle = k % 2 ? C.route : C.signal;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.7, -s * 0.65);
    ctx.lineTo(-s * 0.35, 0);
    ctx.lineTo(-s * 0.7, s * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function chips(a: SceneArgs, beat: number) {
  const { ctx, stage, layout, t, copy } = a;
  const icons: IconName[] = ['server', 'archive', 'key-round'];
  const size = stage.portrait ? 42 : 40;
  const h = size * 1.9;
  copy.onPrem.forEach((label, i) => {
    const pop = backOut(span(t, (K.chips[i] ?? 0) * beat, (K.chips[i] ?? 0) * beat + 0.35));
    if (pop <= 0) return;
    ctx.font = `700 ${size}px ${FONT.kinetic}`;
    const w = ctx.measureText(label).width + size * 2.6;
    const x = stage.portrait ? layout.visual.x : layout.text.x;
    const y = stage.portrait
      ? layout.visual.y + layout.visual.h * 0.7 + i * (h + 20)
      : layout.text.y + 230 + i * (h + 20);
    ctx.save();
    ctx.translate(x, y + h / 2);
    ctx.scale(pop, pop);
    floating(ctx);
    rrect(ctx, 0, -h / 2, w, h, 8, C.surface);
    noShadow(ctx);
    icon(ctx, icons[i] ?? 'check', size * 1.05, 0, size * 0.9, C.ok, 2.2);
    text(ctx, label, size * 1.9, 1, { size, weight: 700, family: FONT.kinetic });
    ctx.restore();
  });
}

export const scene5: SceneModule = {
  draw(a) {
    const { ctx, stage, t, beat } = a;
    const b = (n: number) => n * beat;
    paperGrid(ctx, stage.W, stage.H, t);
    const cam = camera(a, t);
    const outline = easeInOut(span(t, b(K.outline), b(K.outline + 2.5)));
    floorPoly(ctx, cam, rectPts(-1, -1, SITE.w + 2, SITE.d + 2), 0, 'rgba(255,255,255,.7)');
    // Garis luar gedung tergambar mengelilingi tapak, lalu dinding rendah terangkat.
    const walls = clamp((outline - 0.85) / 0.15);
    if (walls > 0) {
      const t2 = 0.35;
      drawBlocks(ctx, cam, [
        { x: 0, y: 0, w: SITE.w, d: t2, h: 2.2 * walls, color: '#dfe2dc' },
        { x: SITE.w - t2, y: 0, w: t2, d: SITE.d, h: 2.2 * walls, color: '#dfe2dc' },
      ]);
    }
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = Math.max(2.5, cam.scale * 0.16);
    ctx.lineJoin = 'round';
    strokeOnce(
      ctx,
      partial(OUTLINE, pathLength(OUTLINE) * outline).map((p) => iso(cam, p, 0)),
    );
    const rack = easeOut(span(t, b(K.rack), b(K.rack + 1)));
    dataLoop(ctx, cam, t, easeInOut(span(t, b(K.loop), b(K.loop + 2))));
    devices(ctx, cam, t, rack);
    if (walls > 0) {
      drawBlocks(ctx, cam, [
        { x: 0, y: 0, w: 0.35, d: SITE.d, h: 1.1 * walls, color: '#e6e8e3' },
        { x: 0, y: SITE.d - 0.35, w: SITE.w, d: 0.35, h: 1.1 * walls, color: '#e6e8e3' },
      ]);
    }
    // Gembok di atas server.
    const lock = backOut(span(t, b(K.lock), b(K.lock) + 0.4));
    if (lock > 0) {
      const [lx, ly] = iso(cam, [16, 11], 5.5 + 2.2 + Math.sin(t * 2) * 0.2);
      const r = cam.scale * 1.15 * lock;
      ctx.save();
      floating(ctx);
      ctx.fillStyle = C.signal;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fill();
      noShadow(ctx);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      icon(ctx, 'lock', lx, ly, r * 1.1, C.ink, 2.4);
      ctx.restore();
    }
    // Awan pudar di luar gedung: data tidak dikirim ke sana.
    const [ox, oy] = iso(cam, [SITE.w + 5, -3], 4);
    ctx.save();
    ctx.globalAlpha = 0.5 * easeOut(span(t, b(K.loop), b(K.loop + 1)));
    icon(ctx, 'cloud-off', ox, oy, cam.scale * 2.6, C.muted, 1.6);
    ctx.restore();
    chips(a, beat);
    if (t < IN) {
      const p = easeInOut(span(t, 0, IN));
      ctx.save();
      ctx.globalAlpha = 1 - p;
      ctx.translate(0, -stage.H * 0.25 * p);
      a.drawPrev(a.prevDur + t);
      ctx.restore();
    }
  },
  sfx(_dur, beat) {
    const b = (n: number) => n * beat;
    const out: Sfx[] = [
      { t: 0, kind: 'whoosh' },
      { t: b(K.rack), kind: 'pop' },
      { t: b(K.lock), kind: 'ding' },
      ...K.chips.map((k) => ({ t: b(k), kind: 'pop' as const })),
    ];
    return out;
  },
};
