import type { FloorUnit, Pt, VenueBuilder } from './builder';

/**
 * Tata letak bebas untuk venue demo: koridor mengikuti polyline atau cincin (lurus, siku, atau
 * melengkung), unit berderet di satu atau dua sisinya mengikuti lengkungan, dan bentuk dasar
 * (persegi, elips, sektor cincin) dalam meter dari pusat venue.
 */

export const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

/** Titik pada elips di sudut `a` (radian, 0 = timur, berlawanan jarum jam). */
export const onEllipse = (rx: number, ry: number, a: number, cx = 0, cy = 0): Pt => [
  cx + rx * Math.cos(a),
  cy + ry * Math.sin(a),
];

export const ellipse = (rx: number, ry: number, n = 64, cx = 0, cy = 0): Pt[] =>
  Array.from({ length: n }, (_, i) => onEllipse(rx, ry, (i / n) * 2 * Math.PI, cx, cy));

/** Busur elips dari `a0` ke `a1` dengan `steps` ruas. */
export const arc = (rx: number, ry: number, a0: number, a1: number, steps: number): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => onEllipse(rx, ry, a0 + ((a1 - a0) * i) / steps));

/** Sektor cincin elips: busur luar lalu busur dalam dibalik. */
export const sector = (
  inner: readonly [number, number],
  outer: readonly [number, number],
  a0: number,
  a1: number,
  steps = 8,
): Pt[] => [...arc(outer[0], outer[1], a0, a1, steps), ...arc(inner[0], inner[1], a1, a0, steps)];

export const deg = (d: number) => (d * Math.PI) / 180;

/** Dibulatkan ke sentimeter supaya koordinat stabil antar-pemanggilan. */
export const r2 = (p: Pt): Pt => [Number(p[0].toFixed(2)), Number(p[1].toFixed(2))];

/** Sudut titik terhadap pusat elips setelah dinormalkan ke lingkaran, 0–360°. */
export const angleOf = ([x, y]: Pt, rx = 1, ry = 1) => {
  const a = (Math.atan2(y / ry, x / rx) * 180) / Math.PI;
  return a < 0 ? a + 360 : a;
};

/** Selisih sudut terkecil dalam derajat. */
export const angleGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

export interface RunSpec {
  key: string;
  floorId: string;
  buildingId: string;
  /** Awalan kode unit, misalnya `MS-GF-W`; unit kiri diberi `A`, kanan `B`. */
  code: string;
  points: readonly Pt[];
  closed?: boolean;
  /** Lebar koridor (m). */
  width: number;
  /** Lebar unit sepanjang koridor dan kedalamannya per sisi; `false` = sisi itu kosong. */
  unitWidth: number;
  left: number | false;
  right: number | false;
  /** Jarak antar-unit (m); celahnya bisa dipakai jalur tembus. */
  spacing?: number;
  /** Unit yang tidak dibuat; dipanggil dengan titik tengah slot di garis tengah koridor. */
  skip?: (mid: Pt, side: 'left' | 'right') => boolean;
  /** Atribut tambahan untuk setiap unit (tinggi, warna). */
  unitExtra?: Parameters<VenueBuilder['unit']>[7];
  /** Gambar poligon koridor (default ya). */
  corridor?: boolean;
}

export interface RunSlot {
  mid: Pt;
  /** Normal kiri satuan di titik tengah slot. */
  normal: Pt;
  path: string;
}

export interface Run {
  units: FloorUnit[];
  left: FloorUnit[];
  right: FloorUnit[];
  slots: RunSlot[];
  /** Celah antar-unit (bila `spacing` > 0), untuk jalur tembus. */
  gaps: RunSlot[];
  first: string;
  last: string;
  length: number;
  nearest(p: Pt): string;
}

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const unitVec = (a: Pt): Pt => mul(a, 1 / (len(a) || 1));
const leftNormal = (d: Pt): Pt => unitVec([-d[1], d[0]]);

/** Sudut belok (derajat) di sebuah verteks antara arah masuk dan keluar. */
const turnDeg = (din: Pt, dout: Pt) => {
  const a = Math.atan2(din[0] * dout[1] - din[1] * dout[0], din[0] * dout[0] + din[1] * dout[1]);
  return Math.abs((a * 180) / Math.PI);
};

export function corridorRun(v: VenueBuilder, spec: RunSpec): Run {
  const pts = spec.points;
  const n = pts.length;
  const segCount = spec.closed ? n : n - 1;
  const segs = Array.from({ length: segCount }, (_, i) => {
    const a = pts[i] as Pt;
    const b = pts[(i + 1) % n] as Pt;
    return { a, b, dir: unitVec(sub(b, a)), length: len(sub(b, a)) };
  });
  const starts: number[] = [];
  let total = 0;
  for (const seg of segs) {
    starts.push(total);
    total += seg.length;
  }
  const segAt = (s: number) => {
    let i = segs.length - 1;
    while (i > 0 && (starts[i] as number) > s) i -= 1;
    return i;
  };
  const pointAt = (s: number): Pt => {
    const i = segAt(s);
    const seg = segs[i] as (typeof segs)[number];
    return add(seg.a, mul(seg.dir, s - (starts[i] as number)));
  };
  const normalAt = (s: number): Pt => leftNormal((segs[segAt(s)] as (typeof segs)[number]).dir);

  // Belokan tajam: slot di sekitarnya dikosongkan agar unit dua kaki tidak saling menimpa.
  const depth = Math.max(spec.left || 0, spec.right || 0);
  const corners: number[] = [];
  for (let i = spec.closed ? 0 : 1; i < (spec.closed ? n : n - 1); i += 1) {
    const din = (segs[(i - 1 + segCount) % segCount] as (typeof segs)[number]).dir;
    const dout = (segs[i] as (typeof segs)[number]).dir;
    if (turnDeg(din, dout) > 25) corners.push(starts[i] as number);
  }
  const clearance = spec.width / 2 + depth;
  const nearCorner = (s0: number, s1: number) =>
    corners.some((c) =>
      [c, c - total, c + total].some((cc) => s1 > cc - clearance && s0 < cc + clearance),
    );

  // Slot unit sepanjang koridor.
  const minGap = spec.spacing ?? 0.2;
  const count = Math.floor((total + (spec.closed ? 0 : minGap)) / (spec.unitWidth + minGap));
  // Di cincin sisa panjang dibagi rata ke semua celah, bukan menumpuk di satu tempat.
  const gap = spec.closed ? (total - count * spec.unitWidth) / count : minGap;
  const used = count * spec.unitWidth + (count - (spec.closed ? 0 : 1)) * gap;
  const offset = spec.closed ? 0 : (total - used) / 2;

  type Stop = { s: number; id: string };
  const stops: Stop[] = [];
  const slots: RunSlot[] = [];
  const gaps: RunSlot[] = [];
  const units: FloorUnit[] = [];
  const left: FloorUnit[] = [];
  const right: FloorUnit[] = [];
  const counters = { left: 0, right: 0 };
  const hw = spec.width / 2;

  for (let i = 0; i < count; i += 1) {
    const s0 = offset + i * (spec.unitWidth + gap);
    const s1 = s0 + spec.unitWidth;
    const sm = (s0 + s1) / 2;
    const mid = pointAt(sm);
    const path = v.at(`${spec.key}:slot:${i}`, spec.floorId, r2(mid));
    stops.push({ s: sm, id: path });
    const normal = normalAt(sm);
    slots.push({ mid, normal, path });
    if (minGap >= 1 && (spec.closed || i < count - 1)) {
      const sg = s1 + gap / 2;
      const gapPath = v.at(`${spec.key}:gap:${i}`, spec.floorId, r2(pointAt(sg % total)));
      stops.push({ s: sg % total, id: gapPath });
      gaps.push({ mid: pointAt(sg % total), normal: normalAt(sg % total), path: gapPath });
    }
    if (nearCorner(s0, s1)) continue;
    for (const side of ['left', 'right'] as const) {
      const d = spec[side];
      if (d === false) continue;
      if (spec.skip?.(mid, side)) continue;
      const sign = side === 'left' ? 1 : -1;
      const n0 = mul(normalAt(s0), sign);
      const n1 = mul(normalAt(Math.min(s1, total - 1e-6)), sign);
      const p0 = pointAt(s0);
      const p1 = pointAt(Math.min(s1, total - 1e-6));
      const ring = [
        add(p0, mul(n0, hw)),
        add(p1, mul(n1, hw)),
        add(p1, mul(n1, hw + d)),
        add(p0, mul(n0, hw + d)),
      ].map(r2);
      counters[side] += 1;
      const code = `${spec.code}${side === 'left' ? 'A' : 'B'}${String(counters[side]).padStart(2, '0')}`;
      const door = r2(add(mid, mul(normal, sign * hw)));
      const unit = v.unit(
        `${spec.key}:unit:${side}:${i}`,
        spec.floorId,
        spec.buildingId,
        code,
        ring,
        door,
        path,
        spec.unitExtra,
      );
      units.push(unit);
      (side === 'left' ? left : right).push(unit);
    }
  }

  // Verteks polyline ikut jadi node supaya jalur mengikuti belokan koridor.
  for (let i = 0; i < n; i += 1) {
    if (!spec.closed && i === n - 1) {
      stops.push({ s: total, id: v.at(`${spec.key}:vertex:${i}`, spec.floorId, r2(pts[i] as Pt)) });
      continue;
    }
    const s = starts[i] as number;
    if (stops.some((stop) => Math.abs(stop.s - s) < 0.5)) continue;
    stops.push({ s, id: v.at(`${spec.key}:vertex:${i}`, spec.floorId, r2(pts[i] as Pt)) });
  }
  stops.sort((a, b) => a.s - b.s);
  for (let i = 1; i < stops.length; i += 1) {
    v.link((stops[i - 1] as Stop).id, (stops[i] as Stop).id, spec.floorId);
  }
  if (spec.closed && stops.length > 2) {
    v.link((stops[stops.length - 1] as Stop).id, (stops[0] as Stop).id, spec.floorId);
  }

  if (spec.corridor !== false)
    corridorPolygons(
      v,
      spec,
      segs.map((s) => s.dir),
    );

  const first = (stops[0] as Stop).id;
  const last = (stops[stops.length - 1] as Stop).id;
  return {
    units,
    left,
    right,
    slots,
    gaps,
    first,
    last,
    length: total,
    nearest(p) {
      let best = first;
      let bestD = Number.POSITIVE_INFINITY;
      for (const stop of stops) {
        const d = len(sub(v.meterOf(stop.id), p));
        if (d < bestD) {
          bestD = d;
          best = stop.id;
        }
      }
      return best;
    },
  };
}

/** Poligon koridor dari offset kiri/kanan bersudut miter; cincin dipotong per ±40 m. */
function corridorPolygons(v: VenueBuilder, spec: RunSpec, dirs: readonly Pt[]) {
  const pts = spec.points;
  const n = pts.length;
  const hw = spec.width / 2;
  const offsetAt = (i: number): Pt => {
    const prev = spec.closed ? dirs[(i - 1 + dirs.length) % dirs.length] : dirs[i - 1];
    const next = spec.closed ? dirs[i % dirs.length] : dirs[i];
    const nPrev = prev ? leftNormal(prev) : undefined;
    const nNext = next ? leftNormal(next) : undefined;
    if (!nPrev) return mul(nNext as Pt, hw);
    if (!nNext) return mul(nPrev, hw);
    const m = unitVec(add(nPrev, nNext));
    const cos = m[0] * nNext[0] + m[1] * nNext[1];
    return mul(m, hw / Math.max(cos, 0.35));
  };
  const leftAt = (i: number) => r2(add(pts[i % n] as Pt, offsetAt(i % n)));
  const rightAt = (i: number) => r2(sub(pts[i % n] as Pt, offsetAt(i % n)));
  if (!spec.closed) {
    const idx = Array.from({ length: n }, (_, i) => i);
    v.area(`${spec.key}:corridor`, spec.floorId, 'corridor', [
      ...idx.map(leftAt),
      ...[...idx].reverse().map(rightAt),
    ]);
    return;
  }
  const pieces = Math.max(3, Math.round(n / 8));
  for (let p = 0; p < pieces; p += 1) {
    const from = Math.round((p * n) / pieces);
    const to = Math.round(((p + 1) * n) / pieces);
    const idx = Array.from({ length: to - from + 1 }, (_, i) => from + i);
    v.area(`${spec.key}:corridor:${p}`, spec.floorId, 'corridor', [
      ...idx.map(leftAt),
      ...[...idx].reverse().map(rightAt),
    ]);
  }
}
