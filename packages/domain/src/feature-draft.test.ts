import { describe, expect, it } from 'vitest';
import type { MapFeatureProperties } from './feature';
import { changeFeatureKind, nextUnitCode } from './feature-draft';

describe('nextUnitCode', () => {
  it('melanjutkan nomor tertinggi dengan awalan yang sama, tidak peka huruf besar/kecil', () => {
    expect(nextUnitCode('GU-L1', [])).toBe('GU-L1-001');
    expect(nextUnitCode('GU-L1', ['GU-L1-002', 'gu-l1-010', 'GU-GF-099', 'LOBI'])).toBe(
      'GU-L1-011',
    );
  });

  it('awalan dengan karakter regex tetap aman', () => {
    expect(nextUnitCode('A.B', ['AXB-005'])).toBe('A.B-001');
  });
});

describe('changeFeatureKind', () => {
  const unit: MapFeatureProperties = {
    id: 'a',
    kind: 'unit',
    floorId: 'f',
    name: 'Ruang',
    unitCode: 'GU-GF-001',
    unitStatus: 'occupied',
    areaM2: 80,
  };

  it('unit → koridor: atribut unit dibuang, nama tetap', () => {
    expect(changeFeatureKind(unit, { kind: 'corridor' }, () => 'X')).toEqual({
      id: 'a',
      kind: 'corridor',
      floorId: 'f',
      name: 'Ruang',
    });
  });

  it('koridor → unit: kode baru dan status kosong', () => {
    const corridor: MapFeatureProperties = { id: 'b', kind: 'corridor', floorId: 'f' };
    expect(changeFeatureKind(corridor, { kind: 'unit' }, () => 'GU-GF-002')).toMatchObject({
      kind: 'unit',
      unitCode: 'GU-GF-002',
      unitStatus: 'vacant',
    });
  });

  it('unit → unit mempertahankan atribut; area luar mendapat subjenis', () => {
    expect(changeFeatureKind(unit, { kind: 'unit' }, () => 'X')).toEqual(unit);
    expect(
      changeFeatureKind(
        { id: 'c', kind: 'non_walkable', floorId: 'f' },
        { kind: 'outdoor_area', subtype: 'garden' },
        () => 'X',
      ),
    ).toMatchObject({ kind: 'outdoor_area', subtype: 'garden' });
  });

  it('pintu → fasilitas memakai jenis yang dipilih; fasilitas → pintu membuang jenisnya', () => {
    const door: MapFeatureProperties = { id: 'd', kind: 'door', floorId: 'f', name: 'Utama' };
    const facility = changeFeatureKind(door, { kind: 'facility', facilityTypeId: 't1' }, () => 'X');
    expect(facility).toEqual({
      id: 'd',
      kind: 'facility',
      floorId: 'f',
      name: 'Utama',
      facilityTypeId: 't1',
    });
    expect(changeFeatureKind(facility, { kind: 'exit' }, () => 'X')).toEqual({
      id: 'd',
      kind: 'exit',
      floorId: 'f',
      name: 'Utama',
    });
  });

  it('fasilitas → fasilitas: jenis tetap bila tidak dipilih ulang, berganti bila dipilih', () => {
    const facility: MapFeatureProperties = {
      id: 'e',
      kind: 'facility',
      floorId: 'f',
      facilityTypeId: 't1',
    };
    expect(changeFeatureKind(facility, { kind: 'facility' }, () => 'X').facilityTypeId).toBe('t1');
    expect(
      changeFeatureKind(facility, { kind: 'facility', facilityTypeId: 't2' }, () => 'X')
        .facilityTypeId,
    ).toBe('t2');
  });

  it('fasilitas tanpa jenis ditolak', () => {
    const door: MapFeatureProperties = { id: 'd', kind: 'door', floorId: 'f' };
    expect(() => changeFeatureKind(door, { kind: 'facility' }, () => 'X')).toThrow();
  });

  it('objek 3D mendapat model bawaan; ganti jenis membuang skala dan rotasi', () => {
    const landmark: MapFeatureProperties = { id: 'c', kind: 'landmark', floorId: 'f' };
    expect(changeFeatureKind(landmark, { kind: 'model3d' }, () => 'X')).toEqual({
      id: 'c',
      kind: 'model3d',
      floorId: 'f',
      model: 'builtin:tree',
    });
    const model: MapFeatureProperties = {
      id: 'c',
      kind: 'model3d',
      floorId: 'f',
      model: 'builtin:bench',
      modelScale: 2,
      modelRotation: 45,
    };
    expect(changeFeatureKind(model, { kind: 'model3d' }, () => 'X')).toEqual(model);
    expect(changeFeatureKind(model, { kind: 'model3d', model: 'builtin:car' }, () => 'X')).toEqual({
      ...model,
      model: 'builtin:car',
    });
    expect(changeFeatureKind(model, { kind: 'landmark' }, () => 'X')).toEqual({
      id: 'c',
      kind: 'landmark',
      floorId: 'f',
    });
  });
});
