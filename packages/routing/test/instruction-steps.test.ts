import type { InstructionAction } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { type RouteLeg, type RouteStep, routeSteps, type WalkLeg } from '../src';
import { connector, FLOORS, m, RAD, walk } from './fixtures/route-legs';

const steps = (...legs: RouteLeg[]) => routeSteps({ legs }, FLOORS);
const actions = (list: readonly RouteStep[]) => list.map((step) => step.action);
const TURNS: readonly InstructionAction[] = [
  'turn_left',
  'turn_right',
  'slight_left',
  'slight_right',
];

/** 20 m ke utara, lalu berubah arah `deg` derajat (positif = searah jarum jam) sejauh 20 m. */
function bend(deg: number): WalkLeg {
  const r = deg * RAD;
  return walk('a-gf', [m(0, 0), m(0, 20), m(20 * Math.sin(r), 20 + 20 * Math.cos(r))]);
}

describe('routeSteps: berjalan di satu lantai', () => {
  it('mulai, satu langkah lurus yang menggabungkan ruas sejajar, lalu tiba', () => {
    const points = [m(0, 0), m(0, 10), m(0, 25), m(0, 40)];
    const result = steps(walk('a-gf', points));
    expect(actions(result)).toEqual(['start', 'straight', 'arrive']);
    expect(result[0]).toMatchObject({ floorId: 'a-gf', buildingId: 'a', coordinates: [points[0]] });
    expect(result[1]).toMatchObject({ floorId: 'a-gf', buildingId: 'a', coordinates: points });
    expect(result[1]?.distanceM).toBeCloseTo(40, 3);
    expect(result[2]).toMatchObject({ floorId: 'a-gf', coordinates: [points[3]], distanceM: 0 });
  });

  it.each([
    [10, []],
    [-14, []],
    [16, ['slight_right']],
    [-20, ['slight_left']],
    [29, ['slight_right']],
    [31, ['turn_right']],
    [-45, ['turn_left']],
    [90, ['turn_right']],
    [-170, ['turn_left']],
  ])('perubahan arah %i° menjadi %j', (deg, turns) => {
    const result = steps(bend(deg));
    expect(actions(result).filter((action) => TURNS.includes(action))).toEqual(turns);
    const straight = result.filter((step) => step.action === 'straight');
    expect(straight.reduce((sum, step) => sum + step.distanceM, 0)).toBeCloseTo(40, 3);
  });

  it('langkah belok membawa titik beloknya; langkah lurus membawa ruasnya', () => {
    const leg = bend(90);
    const [a, corner, b] = leg.coordinates;
    expect(steps(leg)).toEqual([
      { action: 'start', floorId: 'a-gf', buildingId: 'a', coordinates: [a], distanceM: 0 },
      {
        action: 'straight',
        floorId: 'a-gf',
        buildingId: 'a',
        coordinates: [a, corner],
        distanceM: expect.closeTo(20, 3),
      },
      {
        action: 'turn_right',
        floorId: 'a-gf',
        buildingId: 'a',
        coordinates: [corner],
        distanceM: 0,
      },
      {
        action: 'straight',
        floorId: 'a-gf',
        buildingId: 'a',
        coordinates: [corner, b],
        distanceM: expect.closeTo(20, 3),
      },
      { action: 'arrive', floorId: 'a-gf', buildingId: 'a', coordinates: [b], distanceM: 0 },
    ]);
  });

  it('simpangan gambar jalur di bawah 1 m tidak menjadi belokan', () => {
    const jog = walk('a-gf', [m(0, 0), m(20, 0), m(21, 0.6), m(22, 0), m(40, 0)]);
    const result = steps(jog);
    expect(actions(result)).toEqual(['start', 'straight', 'arrive']);
    expect(result[1]?.coordinates).toHaveLength(5);
  });

  it('pintu 4 m dari koridor tetap menjadi lurus lalu belok', () => {
    // Berjalan ke selatan lalu ke timur: timur ada di sebelah kiri.
    const fromDoor = walk('a-gf', [m(0, 4), m(0, 0), m(70, 0)]);
    expect(actions(steps(fromDoor))).toEqual([
      'start',
      'straight',
      'turn_left',
      'straight',
      'arrive',
    ]);
  });

  it('titik kembar berurutan (titik bebas tepat di jalur) diabaikan', () => {
    const result = steps(walk('a-gf', [m(0, 0), m(0, 0), m(0, 10)]));
    expect(actions(result)).toEqual(['start', 'straight', 'arrive']);
    expect(result[1]?.distanceM).toBeCloseTo(10, 3);
  });

  it('asal sama dengan tujuan: hanya mulai dan tiba', () => {
    expect(actions(steps(walk('a-gf', [m(0, 0)])))).toEqual(['start', 'arrive']);
  });
});

describe('routeSteps: konektor dan pintu gedung', () => {
  it.each([
    ['elevator', 'a-gf', 'a-l2', 'elevator_up'],
    ['elevator', 'a-l2', 'a-l1', 'elevator_down'],
    ['escalator', 'a-gf', 'a-l1', 'escalator_up'],
    ['escalator', 'a-l1', 'a-gf', 'escalator_down'],
    ['stairs', 'a-l1', 'a-l2', 'stairs_up'],
    ['stairs', 'a-l2', 'a-gf', 'stairs_down'],
  ] as const)('%s dari %s ke %s menjadi %s di lantai tujuan', (kind, from, to, action) => {
    const result = steps(
      walk(from, [m(0, 0), m(0, 10)]),
      connector(kind, from, to),
      walk(to, [m(0, 10), m(10, 10)]),
    );
    // Arah setelah konektor tidak dibandingkan dengan arah sebelumnya: tidak ada belokan.
    expect(actions(result)).toEqual(['start', 'straight', action, 'straight', 'arrive']);
    expect(result[2]).toEqual({
      action,
      floorId: to,
      buildingId: 'a',
      coordinates: [m(0, 10)],
      distanceM: 0,
    });
  });

  it('keluar dan masuk gedung lewat Area Luar; arah berjalan berlanjut melewati pintu', () => {
    const result = steps(
      walk('a-gf', [m(0, 0), m(10, 0)]),
      connector('building_door', 'a-gf', 'out'),
      walk('out', [m(10.5, 0), m(10.5, 20)]),
      connector('building_door', 'out', 'b-gf'),
      walk('b-gf', [m(10.5, 20.5), m(10.5, 30)]),
    );
    expect(actions(result)).toEqual([
      'start',
      'straight',
      'exit_building',
      'turn_left',
      'straight',
      'enter_building',
      'straight',
      'arrive',
    ]);
    expect(result[2]).toMatchObject({ floorId: 'out', buildingId: 'a', coordinates: [m(10.5, 0)] });
    expect(result[3]).toMatchObject({ floorId: 'out', buildingId: null });
    expect(result[5]).toMatchObject({
      floorId: 'b-gf',
      buildingId: 'b',
      coordinates: [m(10.5, 20.5)],
    });
    expect(result.at(-1)).toMatchObject({ floorId: 'b-gf', buildingId: 'b' });
  });

  it('pintu langsung antar-gedung: keluar lalu masuk', () => {
    const result = steps(
      walk('a-gf', [m(0, 0), m(10, 0)]),
      connector('building_door', 'a-gf', 'b-gf'),
      walk('b-gf', [m(10, 0), m(20, 0)]),
    );
    expect(actions(result)).toEqual([
      'start',
      'straight',
      'exit_building',
      'enter_building',
      'straight',
      'arrive',
    ]);
    expect(result[2]).toMatchObject({ buildingId: 'a', floorId: 'b-gf' });
    expect(result[3]).toMatchObject({ buildingId: 'b', floorId: 'b-gf' });
  });

  it('asal tepat di pemberhentian lift: tanpa langkah lurus sebelum lift', () => {
    const result = steps(
      walk('a-gf', [m(0, 0)]),
      connector('elevator', 'a-gf', 'a-l1'),
      walk('a-l1', [m(0, 0), m(0, 10)]),
    );
    expect(actions(result)).toEqual(['start', 'elevator_up', 'straight', 'arrive']);
  });
});
