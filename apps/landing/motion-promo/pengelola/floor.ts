// Satu denah lantai fiktif (meter) yang dipakai di semua adegan: kanvas Admin, gedung 3D, dan
// peta di HP pengunjung. Koridor timur–barat di tengah; lift A di barat, lift B di timur.
import { CATEGORY } from '../shared/draw';
import type { Pt } from '../shared/stage';

export const FLOOR_W = 60;
export const FLOOR_D = 36;

export interface Unit {
  x: number;
  y: number;
  w: number;
  d: number;
  color: string;
  code: string;
}

const north: [number, number][] = [
  [1, 8],
  [9.5, 8],
  [18, 8.5],
  [33.5, 8.5],
  [42.5, 8],
  [51, 8],
];
const south: [number, number][] = [
  [1, 9.5],
  [16.5, 11],
  [32.5, 14],
  [52, 3.5],
];

export const UNITS: Unit[] = [
  ...north.map(([x, w], i) => ({
    x,
    y: 1,
    w,
    d: 13,
    color: CATEGORY[i % 7] as string,
    code: `N${i}`,
  })),
  ...south.map(([x, w], i) => ({
    x,
    y: 22,
    w,
    d: 13,
    color: CATEGORY[(i + 3) % 7] as string,
    code: `S${i}`,
  })),
];

export const CORRIDORS: Pt[][] = [
  [
    [0, 15],
    [FLOOR_W, 15],
    [FLOOR_W, 21],
    [0, 21],
  ],
  [
    [27, 0],
    [33, 0],
    [33, 15],
    [27, 15],
  ],
];

export interface Connector {
  x: number;
  y: number;
  w: number;
  d: number;
  kind: 'liftA' | 'liftB' | 'escalator' | 'stairs';
}
export const CONNECTORS: Connector[] = [
  { x: 11, y: 22, w: 4.5, d: 4.5, kind: 'liftA' },
  { x: 47, y: 22, w: 4.5, d: 4.5, kind: 'liftB' },
  { x: 27.5, y: 22, w: 4, d: 9, kind: 'escalator' },
  { x: 56, y: 22, w: 3, d: 6, kind: 'stairs' },
];
export const LIFT_A: Pt = [13.25, 24.25];
export const LIFT_B: Pt = [49.25, 24.25];

/** Ruang tujuan di lantai 3 (unit utara keempat) dan pintunya di koridor. */
export const DESTINATION_UNIT = UNITS[3] as Unit;
export const DESTINATION: Pt = [37.75, 10];
export const ENTRANCE: Pt = [2, 18];

export const ROUTE_L1_A: Pt[] = [ENTRANCE, [13.25, 18], LIFT_A];
export const ROUTE_L3_A: Pt[] = [LIFT_A, [13.25, 18], [37.75, 18], DESTINATION];
export const ROUTE_L1_B: Pt[] = [ENTRANCE, [49.25, 18], LIFT_B];
export const ROUTE_L3_B: Pt[] = [LIFT_B, [49.25, 18], [37.75, 18], DESTINATION];

/** Graf jalur: simpul di garis tengah koridor plus simpul pintu tiap unit. */
export const NAV_NODES: Pt[] = [];
export const NAV_EDGES: [number, number][] = [];
{
  const spine = [2, 7, 13.25, 22, 30, 37.75, 44, 49.25, 55, 58];
  spine.forEach((x, i) => {
    NAV_NODES.push([x, 18]);
    if (i) NAV_EDGES.push([i - 1, i]);
  });
  for (const u of UNITS) {
    const cx = u.x + u.w / 2;
    const near = spine.reduce(
      (best, x, i) => (Math.abs(x - cx) < Math.abs((spine[best] ?? 0) - cx) ? i : best),
      0,
    );
    NAV_NODES.push([cx, u.y < 15 ? 15 : 21]);
    NAV_EDGES.push([near, NAV_NODES.length - 1]);
  }
  NAV_NODES.push([30, 4]);
  NAV_EDGES.push([4, NAV_NODES.length - 1]);
}
