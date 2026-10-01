import { describe, expect, it } from 'vitest';
import {
  addPath,
  applyGraphPatch,
  EARTH_RADIUS_M,
  type NavGraph,
  normalizeHeading,
  originPointUrl,
  type Position,
  snapOriginPoint,
  type VenueId,
} from '../src';

const RAD = Math.PI / 180;
const BASE: Position = [106.8, -6.175];
const KX = RAD * EARTH_RADIUS_M * Math.cos(BASE[1] * RAD);
const KY = RAD * EARTH_RADIUS_M;
const m = (x: number, y: number): Position => [BASE[0] + x / KX, BASE[1] + y / KY];
const xy = (p: Position) => [(p[0] - BASE[0]) * KX, (p[1] - BASE[1]) * KY];

function ids() {
  let n = 0;
  return () => `n${++n}`;
}

// Koridor lurus y = 0 dari x = 0 sampai 20 di lantai f1.
const empty: NavGraph = { nodes: {}, edges: {} };
const corridor = applyGraphPatch(
  empty,
  addPath(empty, [m(0, 0), m(20, 0)], { floorId: 'f1', newId: ids() }),
);

describe('snapOriginPoint', () => {
  it('memecah edge di titik terdekat bila jauh dari node', () => {
    const snap = snapOriginPoint(corridor, 'f1', m(8, 3), () => 'baru');
    expect(snap?.nodeId).toBe('baru');
    expect(snap?.distanceM).toBeCloseTo(3, 1);
    const [x = 0, y = 0] = xy(snap?.coordinates ?? BASE);
    expect(x).toBeCloseTo(8, 1);
    expect(y).toBeCloseTo(0, 1);
    const after = applyGraphPatch(corridor, snap?.patch ?? { nodes: [], edges: [] });
    expect(Object.keys(after.edges)).toHaveLength(2);
  });

  it('memakai node yang ada bila titik terdekat < 0,5 m darinya', () => {
    const start = Object.values(corridor.nodes).find(
      (n) => Math.abs(xy(n.coordinates)[0] ?? 9) < 0.01,
    );
    const snap = snapOriginPoint(corridor, 'f1', m(-2, 1), () => 'baru');
    expect(snap?.nodeId).toBe(start?.id);
    expect(snap?.patch.nodes).toHaveLength(0);
  });

  it('tanpa jalur di lantai itu atau terlalu jauh: null', () => {
    expect(snapOriginPoint(corridor, 'f2', m(8, 3), () => 'x')).toBeNull();
    expect(snapOriginPoint(corridor, 'f1', m(8, 40), () => 'x')).toBeNull();
  });
});

describe('titik asal', () => {
  it('arah hadap dinormalkan ke 0–359,9°', () => {
    expect([0, 359.96, 360, -90, 725.04].map(normalizeHeading)).toEqual([0, 0, 0, 270, 5]);
  });

  it('URL QR memakai deep link ?o=', () => {
    expect(
      originPointUrl(
        'https://peta.contoh.id/',
        '10000000-0000-4000-8000-000000000001' as VenueId,
        '0123456789ab',
      ),
    ).toBe('https://peta.contoh.id/v/10000000-0000-4000-8000-000000000001?o=0123456789ab');
  });
});
