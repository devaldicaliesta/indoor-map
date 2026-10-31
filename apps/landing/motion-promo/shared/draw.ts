// Primitif gambar 2D yang dipakai semua adegan: token warna, bentuk, teks, bayangan, arsir.
import { ICONS, type IconName } from './icon-paths';
import type { Pt } from './stage';

/** Token docs/05-desain-ui.md; warna peta mengikuti tabel "Warna peta". */
export const C = {
  ink: '#111418',
  muted: '#545b64',
  line: '#d5d9de',
  surface: '#ffffff',
  canvas: '#f2f3ef',
  signal: '#ffc20e',
  signalSoft: '#ffe9a8',
  route: '#1463ff',
  danger: '#c8321e',
  ok: '#12805c',
  warn: '#b26a00',
  corridor: '#eceeea',
  unitLine: '#bfc5cc',
  connector: '#e3e7ee',
  wall: '#8a929b',
  brand: '#0f4a91',
} as const;

/** Warna kategori lokasi (pastel, ink tetap terbaca di atasnya). */
export const CATEGORY = [
  '#c9def5',
  '#d5e8c8',
  '#fbe2b8',
  '#e3d4f2',
  '#c8ece6',
  '#f6c9c4',
  '#f4d0e2',
];

export const FONT = {
  kinetic: '"Figtree", system-ui, sans-serif',
  admin: '"IBM Plex Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
  visitor: '"Atkinson Hyperlegible", system-ui, sans-serif',
} as const;

export function trace(ctx: CanvasRenderingContext2D, points: readonly Pt[]) {
  for (const [i, [x, y]] of points.entries()) {
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
}

export function poly(
  ctx: CanvasRenderingContext2D,
  points: readonly Pt[],
  fill: string | CanvasPattern | null,
  stroke: string | null = null,
  width = 1,
) {
  ctx.beginPath();
  trace(ctx, points);
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

export function rrect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasPattern | null,
  stroke: string | null = null,
  width = 1,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
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

/** Bayangan elemen mengambang (docs/05: hanya untuk yang melayang di atas peta). */
export function floating(ctx: CanvasRenderingContext2D, scale = 1) {
  ctx.shadowColor = 'rgba(0,0,0,.14)';
  ctx.shadowBlur = 14 * scale;
  ctx.shadowOffsetY = 4 * scale;
}
export function noShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

interface TextOpts {
  size: number;
  weight?: 400 | 700;
  color?: string;
  family?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
}
export function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  o: TextOpts,
) {
  ctx.font = `${o.weight ?? 400} ${o.size}px ${o.family ?? FONT.admin}`;
  ctx.fillStyle = o.color ?? C.ink;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.baseline ?? 'middle';
  ctx.fillText(value, x, y);
}
export function measure(ctx: CanvasRenderingContext2D, value: string, o: TextOpts) {
  ctx.font = `${o.weight ?? 400} ${o.size}px ${o.family ?? FONT.admin}`;
  return ctx.measureText(value).width;
}

const paths = new Map<IconName, Path2D>();
/** Ikon Lucide berpusat di (x, y), stroke 1,75 seperti di aplikasi. */
export function icon(
  ctx: CanvasRenderingContext2D,
  name: IconName,
  x: number,
  y: number,
  size: number,
  color: string = C.ink,
  stroke = 1.75,
) {
  let path = paths.get(name);
  if (!path) {
    path = new Path2D(ICONS[name]);
    paths.set(name, path);
  }
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(path);
  ctx.restore();
}

/** Komponen RGB dari `#rrggbb` atau `rgb(r,g,b)`. */
function rgb(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    const n = Number.parseInt(color.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const [r = 0, g = 0, b = 0] = (color.match(/[\d.]+/g) ?? []).map(Number);
  return [r, g, b];
}

export function shade(color: string, f: number) {
  return `rgb(${rgb(color)
    .map((v) => Math.round(Math.min(255, v * f)))
    .join(',')})`;
}
export function mix(a: string, b: string, t: number) {
  const pa = rgb(a);
  const pb = rgb(b);
  return `rgb(${pa.map((v, i) => Math.round(v + ((pb[i] ?? 0) - v) * t)).join(',')})`;
}

let hatch: CanvasPattern | null = null;
/** Arsir penutupan: garis miring `--danger` 40%. */
export function closureHatch(ctx: CanvasRenderingContext2D): CanvasPattern {
  if (hatch) return hatch;
  const tile = document.createElement('canvas');
  tile.width = 12;
  tile.height = 12;
  const t = tile.getContext('2d') as CanvasRenderingContext2D;
  t.fillStyle = 'rgba(200,50,30,.14)';
  t.fillRect(0, 0, 12, 12);
  t.strokeStyle = 'rgba(200,50,30,.55)';
  t.lineWidth = 3;
  for (const o of [-12, 0, 12]) {
    t.beginPath();
    t.moveTo(o, 12);
    t.lineTo(o + 12, 0);
    t.stroke();
  }
  hatch = ctx.createPattern(tile, 'repeat') as CanvasPattern;
  return hatch;
}

/** Kisi halus seperti kertas denah, bergeser pelan agar latar tidak pernah diam. */
export function paperGrid(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  step = 48,
) {
  ctx.fillStyle = C.canvas;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(17,20,24,.05)';
  ctx.lineWidth = 1;
  const off = (t * 6) % step;
  ctx.beginPath();
  for (let x = -step + off; x < W + step; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = -step + off * 0.5; y < H + step; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
}

export function strokeOnce(ctx: CanvasRenderingContext2D, points: readonly Pt[]) {
  if (points.length < 2) return;
  ctx.beginPath();
  trace(ctx, points);
  ctx.stroke();
}
