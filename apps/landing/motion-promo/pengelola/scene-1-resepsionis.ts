// Adegan 1: meja resepsionis isometrik, antrean orang mini dengan balon "?" yang terus
// bertambah, dan penghitung pertanyaan. Akhir adegan: kamera mendekat ke monitor di meja.
import { backOut, clamp, easeIn, easeInOut, easeOut, hash, lerp, span } from '../shared/anim';
import { C, FONT, floating, noShadow, paperGrid, poly, rrect, text } from '../shared/draw';
import { type Block, drawBlocks, floorPoly, type IsoCam, iso, rectPts } from '../shared/iso';
import type { Pt, Rect } from '../shared/stage';
import type { Layout, SceneArgs, SceneModule, Sfx } from './scene';

const ZOOM = 1.3;
const MONITOR = { x: 12.6, y: 6.6, w: 1.8, z: 1.15, h: 0.95 };
const LOBBY = { w: 28, d: 22 };

/** 0..1: kamera mendekat ke monitor, berlanjut ke awal adegan 2. */
export function zoomProgress(t: number, dur: number) {
  return easeIn(span(t, dur - ZOOM, dur + 0.9));
}

function camera(layout: Layout, portrait: boolean, t: number, dur: number): IsoCam {
  const v = layout.visual;
  const base = portrait ? 33 : 37;
  const push = 1 + 0.07 * easeInOut(t / dur);
  const zoom = zoomProgress(t, dur);
  const scale = base * push * (1 + 5 * zoom);
  const mx = MONITOR.x + MONITOR.w / 2;
  const focus: [number, number] = [lerp(13.5, mx, zoom), lerp(11, MONITOR.y, zoom)];
  // Monitor berada di atas meja: geser kamera turun agar pusat layarnya tetap di tengah visual.
  const lift = zoom * (MONITOR.z + MONITOR.h / 2) * scale * 1.15;
  const cy = v.y + v.h * (portrait ? 0.6 : 0.54) + lift;
  return { cx: v.x + v.w / 2, cy, scale, angle: -30, tilt: 1, ox: focus[0], oy: focus[1] };
}

function screenQuad(cam: IsoCam): [Pt, Pt, Pt, Pt] {
  const { x, y, w, z, h } = MONITOR;
  return [
    iso(cam, [x, y], z),
    iso(cam, [x + w, y], z),
    iso(cam, [x + w, y], z + h),
    iso(cam, [x, y], z + h),
  ];
}

/** Kotak pembatas layar monitor (dipakai adegan 2 untuk zoom masuk ke Admin). */
export function monitorScreen(layout: Layout, portrait: boolean, t: number, dur: number): Rect {
  const q = screenQuad(camera(layout, portrait, t, dur));
  const xs = q.map((p) => p[0]);
  const ys = q.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

const QUEUE: [number, number][] = [
  [12.2, 10.4],
  [10.4, 12.6],
  [8.4, 14.6],
  [6.4, 16.6],
  [4.4, 18.6],
];
/** Pengunjung lain di kursi tunggu dan yang lewat. */
const WAITING: [number, number][] = [
  [21.5, 11.6],
  [23.8, 11.6],
  [22.6, 15.6],
];

function bubble(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, pop: number) {
  if (pop <= 0) return;
  const s = size * backOut(pop);
  ctx.save();
  ctx.translate(x, y);
  floating(ctx, 0.6);
  rrect(ctx, -s * 0.55, -s * 1.05, s * 1.1, s * 0.9, s * 0.18, C.surface, C.ink, 2);
  noShadow(ctx);
  poly(
    ctx,
    [
      [-s * 0.12, -s * 0.16],
      [s * 0.12, -s * 0.16],
      [0, 0],
    ],
    C.surface,
  );
  text(ctx, '?', 0, -s * 0.6, {
    size: s * 0.66,
    weight: 700,
    family: FONT.kinetic,
    align: 'center',
  });
  ctx.restore();
}

function counter(ctx: CanvasRenderingContext2D, a: SceneArgs) {
  const { stage, t, beat, copy } = a;
  // 37 → 58 → 112 di ketukan, lalu terus naik pelan agar tidak pernah diam.
  const stops: [number, number][] = [
    [0, 37],
    [beat * 4, 58],
    [beat * 8, 112],
    [beat * 20, 131],
  ];
  let value = 37;
  for (let i = 1; i < stops.length; i++) {
    const [t0, v0] = stops[i - 1] as [number, number];
    const [t1, v1] = stops[i] as [number, number];
    if (t >= t0)
      value = lerp(v0, v1, i < 3 ? easeOut(span(t, t0, t0 + beat * 1.5)) : span(t, t0, t1));
  }
  const n = Math.floor(value);
  const card = stage.portrait
    ? { x: stage.safe.x, y: a.layout.visual.y + 10, w: 430, h: 150 }
    : { x: a.layout.text.x, y: a.layout.text.y + 230, w: 430, h: 160 };
  const leave = easeIn(span(t, a.dur - 0.5, a.dur));
  ctx.save();
  ctx.globalAlpha = 1 - leave;
  floating(ctx);
  rrect(ctx, card.x, card.y, card.w, card.h, 8, C.surface);
  noShadow(ctx);
  ctx.fillStyle = C.danger;
  ctx.fillRect(card.x, card.y + 18, 6, card.h - 36);
  const bump = 1 + 0.08 * (1 - easeOut(span(t % beat, 0, beat * 0.6)));
  ctx.save();
  ctx.translate(card.x + 32, card.y + card.h * 0.45);
  ctx.scale(bump, bump);
  text(ctx, String(n), 0, 0, { size: 92, weight: 700, family: FONT.kinetic });
  ctx.restore();
  text(ctx, copy.questionsToday, card.x + 34, card.y + card.h - 30, {
    size: 28,
    family: FONT.kinetic,
    color: C.muted,
  });
  ctx.restore();
}

function lobby(ctx: CanvasRenderingContext2D, cam: IsoCam) {
  floorPoly(ctx, cam, rectPts(0, 0, LOBBY.w, LOBBY.d), 0, '#e9ebe6', C.wall, 1.5);
  ctx.strokeStyle = 'rgba(17,20,24,.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 2; x < LOBBY.w; x += 2) {
    const [ax, ay] = iso(cam, [x, 0]);
    const [bx, by] = iso(cam, [x, LOBBY.d]);
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  for (let y = 2; y < LOBBY.d; y += 2) {
    const [ax, ay] = iso(cam, [0, y]);
    const [bx, by] = iso(cam, [LOBBY.w, y]);
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  ctx.stroke();
  floorPoly(ctx, cam, rectPts(2, 9.5, 14, 11), 0, 'rgba(201,211,224,.35)');
  const back: Block[] = [
    { x: 0, y: 0, w: LOBBY.w, d: 0.4, h: 3.4, color: '#dfe2dc' },
    { x: 1.2, y: 1.2, w: 1.2, d: 1.2, h: 1.4, color: '#b9d7a8' },
    { x: 25.4, y: 1.2, w: 1.2, d: 1.2, h: 1.4, color: '#b9d7a8' },
    { x: 20.5, y: 12, w: 5, d: 1, h: 0.55, color: '#c9def5' },
    { x: 20.5, y: 16, w: 5, d: 1, h: 0.55, color: '#c9def5' },
  ];
  drawBlocks(ctx, cam, back);
  const sign = [
    iso(cam, [4, 0.4], 2),
    iso(cam, [10, 0.4], 2),
    iso(cam, [10, 0.4], 3),
    iso(cam, [4, 0.4], 3),
  ];
  poly(ctx, sign, C.ink);
  const [sx, sy] = iso(cam, [5, 0.4], 2.5);
  ctx.save();
  ctx.fillStyle = C.signal;
  ctx.beginPath();
  ctx.arc(sx, sy, cam.scale * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  text(ctx, 'i', sx, sy + 1, {
    size: cam.scale * 0.45,
    weight: 700,
    family: FONT.kinetic,
    align: 'center',
  });
  for (let k = 0; k < 3; k++) {
    const a = iso(cam, [6.2 + k * 1.2, 0.4], 2.65);
    const b = iso(cam, [7 + k * 1.2, 0.4], 2.65);
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = Math.max(2, cam.scale * 0.08);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
}

function deskAndMonitor(ctx: CanvasRenderingContext2D, cam: IsoCam) {
  const desk: Block[] = [
    { x: 9, y: 6.5, w: 9, d: 1.6, h: 1.1, color: '#c9d3e0' },
    { x: 16.4, y: 8.1, w: 1.6, d: 3, h: 1.1, color: '#c9d3e0' },
    {
      x: MONITOR.x,
      y: MONITOR.y - 0.35,
      w: MONITOR.w,
      d: 0.3,
      z: MONITOR.z,
      h: MONITOR.h,
      color: '#2a2f36',
    },
  ];
  drawBlocks(ctx, cam, desk);
  // Layar monitor: Admin kecil yang diperbesar di adegan 2.
  const q = screenQuad(cam);
  poly(ctx, q, C.canvas, C.ink, 2);
  const at = (u: number, v: number): [number, number] => {
    const top = [lerp(q[3][0], q[2][0], u), lerp(q[3][1], q[2][1], u)] as const;
    const bottom = [lerp(q[0][0], q[1][0], u), lerp(q[0][1], q[1][1], u)] as const;
    return [lerp(top[0], bottom[0], v), lerp(top[1], bottom[1], v)];
  };
  poly(ctx, [at(0, 0), at(0.13, 0), at(0.13, 1), at(0, 1)], C.surface);
  poly(ctx, [at(0.13, 0), at(1, 0), at(1, 0.08), at(0.13, 0.08)], C.surface);
  poly(ctx, [at(0.38, 0.3), at(0.78, 0.3), at(0.78, 0.72), at(0.38, 0.72)], C.surface, C.wall, 1);
}

export const scene1: SceneModule = {
  draw(a) {
    const { ctx, stage, t, dur, beat, assets, layout } = a;
    paperGrid(ctx, stage.W, stage.H, t);
    const cam = camera(layout, stage.portrait, t, dur);
    const zoom = zoomProgress(t, dur);
    const people = clamp(1 - zoom * 2.2);
    lobby(ctx, cam);
    const size = cam.scale / 23;
    // Petugas di balik meja digambar sebelum meja agar tertutup sebagian.
    const [staffX, staffY] = iso(cam, [16, 5.2]);
    assets.crowd.draw(ctx, 8, staffX, staffY, { facing: 'left', size });
    deskAndMonitor(ctx, cam);
    ctx.save();
    ctx.globalAlpha = people;
    WAITING.forEach(([x, y], i) => {
      const [px, py] = iso(cam, [x, y + 0.4]);
      assets.crowd.draw(ctx, 5 + i, px, py + Math.sin(t * 2 + i) * 1.5, {
        facing: i % 2 ? 'left' : 'right',
        size,
      });
    });
    QUEUE.forEach(([x, y], i) => {
      const at = i * beat * 1.5;
      const arrive = easeOut(span(t, at - beat * 2.2, at));
      const from: [number, number] = [x - 4.5, Math.min(LOBBY.d - 0.5, y + 4.5)];
      const p: [number, number] = [lerp(from[0], x, arrive), lerp(from[1], y, arrive)];
      const [px, py] = iso(cam, p);
      assets.crowd.draw(ctx, i, px, py, { facing: 'right', walking: arrive < 1, t, size });
      const popAt = i < 2 ? -1 : at + beat * 0.5;
      const pop = span(t, popAt, popAt + 0.35);
      const bob = Math.sin(t * 3 + i) * 3;
      bubble(ctx, px + size * 6, py - assets.crowd.height * size - 8 + bob, size * 34, pop);
    });
    // Balon "?" kecil naik terus dari antrean, beberapa per ketukan.
    for (let k = 0; k < 30; k++) {
      const born = k * beat * 0.5 + beat;
      const age = t - born;
      if (age < 0 || age > 2.4) continue;
      const [qx, qy] = QUEUE[k % QUEUE.length] as [number, number];
      const [bx, by] = iso(cam, [qx + (hash(k) - 0.5) * 4, qy + (hash(k + 9) - 0.5) * 2], 2.8);
      ctx.save();
      ctx.globalAlpha *= clamp(1 - age / 2.4);
      bubble(ctx, bx, by - age * 50 * size, size * 20, span(age, 0, 0.3));
      ctx.restore();
    }
    ctx.restore();
    counter(ctx, a);
  },
  sfx(dur, beat) {
    const out: Sfx[] = QUEUE.slice(2).map((_, i) => ({
      t: (i + 2) * beat * 1.5 + beat * 0.5,
      kind: 'pop',
    }));
    out.push({ t: dur - ZOOM + 0.2, kind: 'whoosh' });
    return out;
  },
};
