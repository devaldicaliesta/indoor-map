import type { Building, BuildingId, Connector, Floor, FloorId, VenueId } from '@indoor/domain';
import { checkConnector } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { changeKind, type FormPlace, formDraft, formFloorIds, initialForm } from './connector-form';

const venueId = '10000000-0000-4000-8000-000000000001' as VenueId;
const g = '20000000-0000-4000-8000-000000000001' as BuildingId;
function floor(id: string, level: number, buildingId: BuildingId | null = g): Floor {
  return {
    id: id as FloorId,
    venueId,
    buildingId,
    isOutdoor: buildingId === null,
    name: id.toUpperCase(),
    level,
    heightM: 4,
    sortOrder: 0,
    featureCount: 0,
  } as Floor;
}
const FLOORS = [
  floor('b1', -1),
  floor('gf', 0),
  floor('l1', 1),
  floor('l2', 2),
  floor('out', 0, null),
];
const BUILDINGS = [{ id: g, name: 'Gedung Utama', code: 'GU' } as Building];
const at = (id: string): FormPlace => ({
  floor: FLOORS.find((f) => f.id === id) as Floor,
  floors: FLOORS,
  buildings: BUILDINGS,
});

describe('formulir konektor', () => {
  it('konektor baru di GF: lift ke lantai di atasnya, aksesibel, nama bawaan', () => {
    const form = initialForm(null, at('gf'));
    expect(form).toMatchObject({ kind: 'elevator', name: 'Lift', accessible: true });
    expect(formFloorIds(form, at('gf'))).toEqual(['gf', 'l1']);
    expect(checkConnector(formDraft(form, at('gf')), FLOORS)).toEqual([]);
  });

  it('berganti jenis mengikuti nama dan aksesibel bawaan selama belum diubah pengguna', () => {
    const place = at('gf');
    const stairs = changeKind(initialForm(null, place), 'stairs', place);
    expect(stairs).toMatchObject({ name: 'Tangga', accessible: false });
    expect(formFloorIds(stairs, place)).toEqual(['b1', 'gf', 'l1']);
    const named = { ...stairs, name: 'Tangga Timur', nameTouched: true };
    expect(changeKind(named, 'escalator', place).name).toBe('Tangga Timur');
  });

  it('eskalator dari GF memakai lantai lain dan butuh arah; pintu gedung ke Area Luar', () => {
    const place = at('gf');
    const escalator = changeKind(initialForm(null, place), 'escalator', place);
    expect(formFloorIds(escalator, place)).toEqual(['gf', 'l1']);
    expect(checkConnector(formDraft(escalator, place), FLOORS)).toEqual(['direction_required']);
    const door = changeKind(escalator, 'building_door', place);
    expect(door.name).toBe('Pintu Gedung Utama');
    expect(formFloorIds(door, place)).toEqual(['gf', 'out']);
  });

  it('di Area Luar hanya pintu gedung; lantai gedung dipilih', () => {
    const place = at('out');
    const form = initialForm(null, place);
    expect(form.kind).toBe('building_door');
    expect(formFloorIds(form, place)).toEqual(['out']);
    expect(formFloorIds({ ...form, doorFloor: 'gf' }, place)).toEqual(['gf', 'out']);
  });

  it('mengubah konektor memakai pemberhentiannya', () => {
    const connector: Connector = {
      id: 'c1',
      kind: 'stairs',
      name: 'Tangga Barat',
      direction: null,
      accessible: false,
      stops: [
        { floorId: 'l2', nodeId: 'n3' },
        { floorId: 'gf', nodeId: 'n1' },
        { floorId: 'l1', nodeId: 'n2' },
      ],
    };
    const form = initialForm(connector, at('l1'));
    expect(form).toMatchObject({ name: 'Tangga Barat', stairsFrom: 'gf', stairsTo: 'l2' });
    expect(formFloorIds(form, at('l1'))).toEqual(['gf', 'l1', 'l2']);
  });
});
