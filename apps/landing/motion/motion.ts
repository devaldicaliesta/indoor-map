// Motion graphic PanduArah untuk landing page (T-505): logo → denah → peta 3D → rute dan orang
// mini → penutup. Digambar di canvas 1280 × 720 dan direkam menjadi WebM oleh
// `scripts/landing-motion.mjs`; tidak ikut build produksi landing.
import { type CrowdFacing, renderCrowdSprite, seededRandom, uniqueLooks } from '@indoor/map-core';
import logoUrl from '../../../packages/ui/src/brand/panduarah-logo.svg?url';
import '../src/index.css';

const W = 1280;
const H = 720;
/** Lama satu putaran; adegan terakhir kembali ke logo agar video berulang mulus. */
export const DURATION_MS = 15_000;

const C = {
  canvas: '#f2f3ef',
  ink: '#111418',
  muted: '#545b64',
  line: '#d5d9de',
  corridor: '#eceeea',
  surface: '#ffffff',
  signal: '#ffc20e',
  route: '#1463ff',
};

type Pt = [number, number];
interface Room {
  x: number;
  y: number;
  w: number;
  d: number;
  color: string;
  h: number;
}

// Denah mal kecil (meter): koridor tengah timur–barat dan satu cabang utara–selatan.
const FOOT: Pt[] = [
  [0, 0],
  [64, 0],
  [64, 40],
  [0, 40],
];
const PALETTE = ['#f6c9c4', '#c9def5', '#d5e8c8', '#fbe2b8', '#e3d4f2', '#c8ece6', '#f4d0e2'];
const ROOMS: Room[] = [];
for (const [row, y, d] of [
  [0, 1, 15],
  [1, 24, 15],
] as const) {
  let x = 1;
  let i = row * 3;
  for (const w of [9, 7, 10, 8, 9, 7, 8]) {
    if (x > 28 && x < 36) x = 36; // cabang koridor utara–selatan
    ROOMS.push({ x, y, w: w - 0.6, d, color: PALETTE[i % PALETTE.length] ?? C.surface, h: 4 });
    x += w;
    i += 1;
  }
}

const ease = (t: number) =>
  t < 0 ? 0 : t > 1 ? 1 : t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const span = (ms: number, start: number, end: number) => clamp((ms - start) / (end - start));

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
canvas.width = W;
canvas.height = H;

/** Proyeksi isometrik; `tilt` 0 = denah datar dari atas, 1 = isometrik penuh. */
function project([x, y]: Pt, z: number, tilt: number, scale: number): Pt {
  const cx = 640;
  const cy = 345;
  const mx = x - 32;
  const my = y - 20;
  const angle = (-30 * Math.PI * tilt) / 180;
  const rx = mx * Math.cos(angle) - my * Math.sin(angle);
  const ry = mx * Math.sin(angle) + my * Math.cos(angle);
  const squash = 1 - 0.45 * tilt;
  return [cx + rx * scale, cy + ry * scale * squash - z * scale * 1.15 * tilt];
}

/** Garis melewati titik-titik pada path yang sedang dibuat. */
function trace(points: readonly Pt[]) {
  for (const [i, [x, y]] of points.entries()) {
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
}

function poly(points: Pt[], fill: string | null, stroke: string | null, width = 1) {
  ctx.beginPath();
  trace(points);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function shade(hex: string, f: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
  return `rgb(${c.join(',')})`;
}

function box(room: Room, height: number, tilt: number, scale: number) {
  const { x, y, w, d } = room;
  const base: Pt[] = [
    [x, y],
    [x + w, y],
    [x + w, y + d],
    [x, y + d],
  ];
  const bottom = base.map((p) => project(p, 0, tilt, scale));
  const top = base.map((p) => project(p, height, tilt, scale));
  if (height > 0.05) {
    // Sisi selatan dan timur yang terlihat dari kamera.
    const south = [bottom[3], bottom[2], top[2], top[3]] as Pt[];
    const east = [bottom[1], bottom[2], top[2], top[1]] as Pt[];
    poly(south, shade(room.color, 0.82), 'rgba(17,20,24,.25)');
    poly(east, shade(room.color, 0.72), 'rgba(17,20,24,.25)');
  }
  poly(top, room.color, 'rgba(17,20,24,.35)');
}

// Jalur rute (meter) dari pintu masuk barat ke toko di sisi utara timur.
const ROUTE: Pt[] = [
  [2, 20],
  [32, 20],
  [32, 21],
  [52, 21],
  [52, 17],
];
const routeLength = ROUTE.slice(1).reduce(
  (sum, p, i) => sum + Math.hypot(p[0] - (ROUTE[i]?.[0] ?? 0), p[1] - (ROUTE[i]?.[1] ?? 0)),
  0,
);
function along(path: Pt[], distance: number): { at: Pt; dx: number } {
  let left = distance;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1] as Pt;
    const b = path[i] as Pt;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= len) {
      const t = len ? left / len : 0;
      return { at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dx: b[0] - a[0] };
    }
    left -= len;
  }
  const last = path[path.length - 1] as Pt;
  return { at: last, dx: 1 };
}

// Orang mini: tampilan unik dari map-core, berjalan bolak-balik di koridor.
const looks = uniqueLooks(9, seededRandom('panduarah-motion'));
const sprites = await Promise.all(
  looks.flatMap((look) =>
    (['stand', 'stepA', 'stepB'] as const).flatMap((frame) =>
      (['left', 'right'] as CrowdFacing[]).map(async (facing) => {
        const image = renderCrowdSprite(look, frame, facing);
        const bitmap = await createImageBitmap(
          new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
        );
        return [`${looks.indexOf(look)}-${frame}-${facing}`, bitmap] as const;
      }),
    ),
  ),
).then((entries) => new Map(entries));
const WALKERS = looks.map((_, i) => ({
  lane: i % 2 === 0 ? 19 : 21.2,
  offset: (i * 9.7) % 60,
  speed: 3.2 + (i % 4) * 0.5,
  dir: i % 3 === 0 ? -1 : 1,
}));

const logo = new Image();
logo.src = logoUrl;
await logo.decode();

function caption(text: string, sub: string, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = C.ink;
  ctx.fillRect(56, 600, 8, 64);
  ctx.font = 'bold 34px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.fillText(text, 84, 630);
  ctx.fillStyle = C.muted;
  ctx.font = '24px "Atkinson Hyperlegible", system-ui, sans-serif';
  ctx.fillText(sub, 84, 662);
  ctx.restore();
}

function drawLogo(scale: number, alpha: number, x: number, y: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const w = 520 * scale;
  ctx.drawImage(logo, x - w / 2, y - (w * 404) / 1538 / 2, w, (w * 404) / 1538);
  ctx.restore();
}

function frame(ms: number) {
  const t = ms % DURATION_MS;
  ctx.fillStyle = C.canvas;
  ctx.fillRect(0, 0, W, H);
  // Kisi halus seperti kertas denah.
  ctx.strokeStyle = 'rgba(17,20,24,.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const intro = 1 - span(t, 2000, 2600);
  const outro = span(t, 13_000, 14_200);
  if (intro > 0) {
    // Frame pertama sudah menampilkan logo (juga gambar awal saat video dimuat).
    drawLogo(1, intro, 640, 330);
    ctx.save();
    ctx.globalAlpha = intro;
    ctx.fillStyle = C.muted;
    ctx.font = '30px "Atkinson Hyperlegible", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Indoor Navigation', 640, 445);
    ctx.restore();
  }

  const plan = t > 2400 && t < 14_400;
  if (plan) {
    const fade = (1 - outro) * ease(span(t, 2400, 2900));
    const tilt = ease(span(t, 5200, 6800));
    const scale = 13 + 1.2 * ease(span(t, 9000, 12_500));
    const rise = ease(span(t, 6200, 7800));
    const draw = ease(span(t, 2600, 5000));
    ctx.save();
    ctx.globalAlpha = fade;
    // Lantai dan koridor.
    poly(
      FOOT.map((p) => project(p, 0, tilt, scale)),
      C.surface,
      null,
    );
    poly(
      [
        [0, 17],
        [64, 17],
        [64, 23],
        [0, 23],
      ].map((p) => project(p as Pt, 0, tilt, scale)),
      C.corridor,
      null,
    );
    poly(
      [
        [29, 0],
        [35, 0],
        [35, 40],
        [29, 40],
      ].map((p) => project(p as Pt, 0, tilt, scale)),
      C.corridor,
      null,
    );
    // Tepi gedung digambar sebelum ruang agar tidak memotong ruang yang terangkat.
    poly(
      FOOT.map((p) => project(p, 0, tilt, scale)),
      null,
      C.ink,
      2.5,
    );
    // Ruang: garis denah tergambar satu per satu, lalu terangkat menjadi 3D berwarna.
    const ordered = [...ROOMS].sort((a, b) => a.x + a.y - (b.x + b.y));
    ordered.forEach((room, i) => {
      const local = clamp(draw * ROOMS.length - i);
      if (local <= 0) return;
      if (rise > 0) {
        box({ ...room, color: room.color }, room.h * rise, tilt, scale);
      } else {
        ctx.save();
        ctx.globalAlpha = fade * local;
        poly(
          [
            [room.x, room.y],
            [room.x + room.w, room.y],
            [room.x + room.w, room.y + room.d],
            [room.x, room.y + room.d],
          ].map((p) => project(p as Pt, 0, tilt, scale)),
          null,
          C.ink,
          1.5,
        );
        ctx.restore();
      }
    });

    // Rute: "Anda di sini" lalu garis rute biru bertepi putih dengan pola aliran.
    const routeT = ease(span(t, 8600, 10_600));
    if (routeT > 0) {
      const visible: Pt[] = [];
      const end = routeLength * routeT;
      let acc = 0;
      visible.push(ROUTE[0] as Pt);
      for (let i = 1; i < ROUTE.length; i++) {
        const a = ROUTE[i - 1] as Pt;
        const b = ROUTE[i] as Pt;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (acc + len <= end) visible.push(b);
        else {
          const f = (end - acc) / len;
          visible.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
          break;
        }
        acc += len;
      }
      const screen = visible.map((p) => project(p, 0.05, tilt, scale));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [color, width] of [
        [C.surface, 12],
        [C.route, 8],
      ] as const) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        trace(screen);
        ctx.stroke();
      }
      ctx.setLineDash([10, 14]);
      ctx.lineDashOffset = -t / 30;
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      trace(screen);
      ctx.stroke();
      ctx.setLineDash([]);
      if (routeT >= 1) {
        const [dx, dy] = project(ROUTE[ROUTE.length - 1] as Pt, 0.05, tilt, scale);
        ctx.fillStyle = C.route;
        ctx.strokeStyle = C.surface;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(dx, dy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    const pinT = ease(span(t, 8000, 8600));
    if (pinT > 0) {
      const [px, py] = project(ROUTE[0] as Pt, 0.05, tilt, scale);
      const pulse = 18 + 10 * ((t / 900) % 1);
      ctx.fillStyle = `rgba(255,194,14,${0.45 * (1 - ((t / 900) % 1))})`;
      ctx.beginPath();
      ctx.arc(px, py, pulse * pinT, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.signal;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 12 * pinT, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Orang mini muncul setelah peta 3D jadi.
    const crowdT = span(t, 7800, 8400);
    if (crowdT > 0) {
      ctx.globalAlpha = fade * crowdT;
      ctx.imageSmoothingEnabled = false;
      WALKERS.forEach((walker, i) => {
        const distance = (walker.offset + (t / 1000) * walker.speed) % 120;
        const forward = distance < 60;
        const x = walker.dir > 0 === forward ? 2 + (distance % 60) : 62 - (distance % 60);
        const [sx, sy] = project([x, walker.lane], 0, tilt, scale);
        const moving = walker.dir > 0 === forward;
        const facing: CrowdFacing = moving ? 'right' : 'left';
        const step = Math.floor(t / 160) % 2 === 0 ? 'stepA' : 'stepB';
        const sprite = sprites.get(`${i}-${step}-${facing}`);
        if (!sprite) return;
        const size = 1.25;
        ctx.drawImage(
          sprite,
          sx - (sprite.width * size) / 2,
          sy - sprite.height * size,
          sprite.width * size,
          sprite.height * size,
        );
      });
      ctx.imageSmoothingEnabled = true;
    }
    ctx.restore();

    // Logo kecil di sudut selama adegan peta.
    drawLogo(0.42, fade, 170, 64);
    caption(
      'Denah jadi peta',
      'Floor plan to map',
      ease(span(t, 2900, 3400)) * (1 - span(t, 5000, 5300)),
    );
    caption(
      'Peta 2D dan 3D',
      '2D and 3D maps',
      ease(span(t, 5400, 5900)) * (1 - span(t, 7800, 8100)),
    );
    caption(
      'Rute langkah demi langkah',
      'Step-by-step directions',
      ease(span(t, 8200, 8700)) * (1 - span(t, 12_600, 13_000)),
    );
  }

  if (outro > 0) {
    // Berakhir persis seperti frame pertama (logo + "Indoor Navigation") agar video berulang mulus.
    drawLogo(1, ease(span(t, 13_400, 14_000)), 640, 330);
    const types = ease(span(t, 13_700, 14_100)) * (1 - ease(span(t, 14_500, 14_800)));
    const tagline = ease(span(t, 14_600, 14_950));
    ctx.save();
    ctx.fillStyle = C.muted;
    ctx.font = '30px "Atkinson Hyperlegible", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = types;
    ctx.fillText('Mal · Rumah sakit · Kampus · Bandara · Event', 640, 445);
    ctx.globalAlpha = tagline;
    ctx.fillText('Indoor Navigation', 640, 445);
    ctx.restore();
  }
}

/** Waktu animasi dimulai dari 0 saat perekam memanggil `window.startMotion()`. */
let started = 0;
function loop(now: number) {
  frame(started ? now - started : 0);
  requestAnimationFrame(loop);
}
declare global {
  interface Window {
    startMotion: () => void;
    motionReady: boolean;
    seekMotion: (ms: number) => void;
  }
}
window.startMotion = () => {
  started = performance.now();
};
window.seekMotion = (ms: number) => frame(ms);
await Promise.all([
  document.fonts.load('bold 34px "Atkinson Hyperlegible"'),
  document.fonts.load('30px "Atkinson Hyperlegible"'),
]);
window.motionReady = true;
// Saat direkam per frame (`?record`) hanya `seekMotion` yang menggambar.
if (!new URLSearchParams(location.search).has('record')) requestAnimationFrame(loop);
