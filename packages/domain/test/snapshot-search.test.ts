import { describe, expect, it } from 'vitest';
import { buildSnapshot, createSnapshotSearch } from '../src';
import { IDS, RADIOLOGY_UNITS, sampleSnapshotSource } from './fixtures/snapshot-source';

const snapshot = buildSnapshot(sampleSnapshotSource());
const search = createSnapshotSearch(snapshot);
const first = (query: string) => search(query)[0];
const unitCode = (id: string | undefined) =>
  snapshot.features.features.find((f) => f.id === id)?.properties.unitCode ?? '';

describe('createSnapshotSearch', () => {
  it('"radilogi" dan "radiologi" menemukan Radiologi', () => {
    expect(first('radilogi')).toMatchObject({ kind: 'location', id: IDS.radiology });
    expect(first('Radiologi')).toMatchObject({ kind: 'location', id: IDS.radiology });
  });

  it('kode lokasi, kode unit, alias, dan field yang dapat dicari menemukan lokasinya', () => {
    for (const query of ['rad-01', unitCode(RADIOLOGY_UNITS[1]), 'rontgen', '1203']) {
      expect(first(query)).toMatchObject({ kind: 'location', id: IDS.radiology });
    }
  });

  it('unit yang ditempati lokasi tidak muncul sendiri; unit kosong bisa dicari dengan kodenya', () => {
    const occupied = search(unitCode(RADIOLOGY_UNITS[0]));
    expect(occupied.some((hit) => hit.kind === 'unit')).toBe(false);
    const vacant = snapshot.features.features.find(
      (f) => f.properties.kind === 'unit' && !RADIOLOGY_UNITS.includes(f.id),
    );
    expect(first(vacant?.properties.unitCode ?? '')).toEqual(
      expect.objectContaining({ kind: 'unit', id: vacant?.id }),
    );
  });

  it('kategori dan jenis fasilitas bisa dicari lewat nama dan aliasnya', () => {
    expect(first('pemeriksaan')).toMatchObject({ kind: 'category', id: IDS.examCategory });
    expect(first('periksa')).toMatchObject({ kind: 'category', id: IDS.examCategory });
    expect(first('WC')).toMatchObject({ kind: 'facility_type', id: IDS.toiletType });
  });

  it('lokasi nonaktif permanen tidak pernah muncul', () => {
    expect(search('apotek lama')).toEqual([]);
    expect(search('APT-OLD')).toEqual([]);
    expect(search('obat lama')).toEqual([]);
  });

  it('jumlah hasil dibatasi', () => {
    expect(search('gf', 5)).toHaveLength(5);
    expect(search('gf').length).toBeGreaterThan(5);
  });
});
