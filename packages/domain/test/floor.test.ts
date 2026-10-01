import { describe, expect, it } from 'vitest';
import { checkFloorInput, initialFloorView, sortFloorsTopDown } from '../src';

describe('lantai', () => {
  it('B1 (level −1) di bawah GF, lantai atas di atas', () => {
    const floors = [
      { name: 'GF', level: 0, sortOrder: 0 },
      { name: 'L2', level: 2, sortOrder: 0 },
      { name: 'B1', level: -1, sortOrder: 0 },
      { name: 'L1', level: 1, sortOrder: 0 },
    ];
    expect(sortFloorsTopDown(floors).map((f) => f.name)).toEqual(['L2', 'L1', 'GF', 'B1']);
  });

  it('level bilangan bulat boleh negatif; tinggi 2–30 m; nama wajib', () => {
    expect(checkFloorInput({ name: 'B1', level: -1, heightM: 3.5 })).toEqual([]);
    expect(checkFloorInput({ name: ' ', level: 1.5, heightM: 0 })).toEqual([
      'name_required',
      'level_integer',
      'height_range',
    ]);
  });
});

describe('initialFloorView', () => {
  const buildings = [
    { id: 'a', defaultFloorId: null },
    { id: 'b', defaultFloorId: 'b-l2' },
  ];
  const floors = [
    { id: 'a-b1', buildingId: 'a', level: -1, sortOrder: 0 },
    { id: 'a-gf', buildingId: 'a', level: 0, sortOrder: 0 },
    { id: 'b-gf', buildingId: 'b', level: 0, sortOrder: 0 },
    { id: 'b-l2', buildingId: 'b', level: 2, sortOrder: 0 },
  ];

  it('memakai gedung dan lantai default', () => {
    expect(initialFloorView('b', buildings, floors)).toEqual({ buildingId: 'b', floorId: 'b-l2' });
  });

  it('tanpa default: gedung pertama, lantai level 0', () => {
    expect(initialFloorView(null, buildings, floors)).toEqual({ buildingId: 'a', floorId: 'a-gf' });
  });

  it('venue tanpa gedung atau lantai', () => {
    expect(initialFloorView(null, [], [])).toBeNull();
    expect(initialFloorView(null, [{ id: 'x', defaultFloorId: null }], [])).toBeNull();
  });
});
