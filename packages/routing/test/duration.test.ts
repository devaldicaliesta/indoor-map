import { describe, expect, it } from 'vitest';
import {
  ACCESSIBLE_WALK_SPEED_MPS,
  type RouteLeg,
  routeMinutes,
  routeSeconds,
  WALK_SPEED_MPS,
} from '../src';
import { connector, FLOORS } from './fixtures/route-legs';

const levelOf = (floorId: string) => FLOORS.find((f) => f.id === floorId)?.level ?? 0;

const walked = (floorId: string, distanceM: number): RouteLeg => ({
  kind: 'walk',
  floorId,
  coordinates: [],
  nodeIds: [],
  distanceM,
});

describe('estimasi waktu tempuh', () => {
  it('jalan kaki: jarak dibagi kecepatan, dibulatkan ke atas per menit', () => {
    const seconds = routeSeconds([walked('a-gf', 120)], { accessible: false, levelOf });
    expect(seconds).toBeCloseTo(120 / WALK_SPEED_MPS);
    expect(routeMinutes(seconds)).toBe(2);
  });

  it('rute aksesibel memakai kecepatan lebih lambat', () => {
    const seconds = routeSeconds([walked('a-gf', 120)], { accessible: true, levelOf });
    expect(seconds).toBeCloseTo(120 / ACCESSIBLE_WALK_SPEED_MPS);
    expect(routeMinutes(seconds)).toBe(3);
  });

  it('waktu konektor berbeda per jenis dan jumlah lantai', () => {
    const time = (kind: 'elevator' | 'escalator' | 'stairs', to: string) =>
      routeSeconds([connector(kind, 'a-gf', to)], { accessible: false, levelOf });
    expect(time('elevator', 'a-l2')).toBe(55);
    expect(time('escalator', 'a-l1')).toBe(30);
    expect(time('stairs', 'a-l2')).toBe(40);
    expect(time('stairs', 'a-l2')).toBe(
      routeSeconds([connector('stairs', 'a-l2', 'a-gf')], { accessible: false, levelOf }),
    );
    expect(
      routeSeconds([connector('building_door', 'out', 'a-gf')], { accessible: false, levelOf }),
    ).toBe(10);
  });

  it('rute pendek tetap minimal 1 menit; menit naik seiring jarak', () => {
    expect(routeMinutes(0)).toBe(1);
    const minutes = [30, 100, 300, 600].map((d) =>
      routeMinutes(routeSeconds([walked('a-gf', d)], { accessible: false, levelOf })),
    );
    expect(minutes).toEqual([1, 2, 5, 9]);
  });

  it('menjumlahkan bagian berjalan dan konektor', () => {
    const legs = [walked('a-gf', 60), connector('elevator', 'a-gf', 'a-l1'), walked('a-l1', 60)];
    expect(routeSeconds(legs, { accessible: false, levelOf })).toBeCloseTo(100 + 50);
  });
});
