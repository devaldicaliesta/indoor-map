import { describe, expect, it } from 'vitest';
import {
  type BrowseTarget,
  buildSnapshot,
  createSnapshotLookup,
  prepareSnapshotSearch,
  searchSnapshot,
} from '../src';
import { BROWSE_IDS, browseSnapshotSource } from './fixtures/browse-source';
import { IDS } from './fixtures/snapshot-source';

const snapshot = buildSnapshot(browseSnapshotSource());
const lookup = createSnapshotLookup(snapshot);
const search = prepareSnapshotSearch(lookup);
const find = (query: string) => searchSnapshot(search, query);
const radiology: BrowseTarget = { kind: 'location', id: IDS.radiology };
const unit = (code: string) =>
  snapshot.features.features.find((f) => f.properties.unitCode === code)?.id ?? '';

describe('pencarian Visitor', () => {
  it('"radilogi" menemukan "Radiologi"', () => {
    expect(find('radilogi')).toEqual([radiology]);
    expect(find('Radiologi')).toEqual([radiology]);
    expect(find('radio')).toEqual([radiology]);
  });

  it('kode lokasi dan kode unit bisa dicari', () => {
    expect(find('RAD-01')).toEqual([radiology]);
    expect(find('rad01')).toEqual([radiology]);
    expect(find('gf-b01')).toEqual([radiology]);
    expect(find('GF-A04')).toEqual([{ kind: 'unit', id: unit('GF-A04') }]);
  });

  it('unit yang ditempati muncul sebagai lokasinya, bukan sebagai unit', () => {
    expect(find('GF-A0').filter((t) => t.kind === 'unit')).not.toContainEqual({
      kind: 'unit',
      id: unit('GF-A01'),
    });
    expect(find('GF-A0')).toContainEqual(radiology);
  });

  it('alias lokasi, kategori, dan jenis fasilitas', () => {
    expect(find('rontgen')).toEqual([radiology]);
    expect(find('periksa')).toEqual([{ kind: 'category', id: IDS.examCategory }]);
    expect(find('wc')).toEqual([{ kind: 'facility_type', id: IDS.toiletType }]);
  });

  it('field kustom yang dapat dicari ikut, yang tidak dapat dicari tidak', () => {
    expect(find('1203')).toEqual([radiology]);
    expect(find('0812')).toEqual([]);
  });

  it('lokasi nonaktif permanen tidak muncul', () => {
    expect(find('Apotek Lama')).toEqual([]);
    expect(find('APT-OLD')).toEqual([]);
    expect(find('obat lama')).toEqual([]);
  });

  it('kategori dan jenis fasilitas tanpa anggota dilewati', () => {
    expect(find('kosong sementara')).toEqual([]);
    expect(find('apar')).toEqual([]);
  });

  it('kategori lebih dulu dari lokasi bila sama relevan, lalu urut nama', () => {
    expect(find('rapat')).toEqual([
      { kind: 'category', id: BROWSE_IDS.meetingCategory },
      { kind: 'location', id: BROWSE_IDS.eastMeeting },
    ]);
    expect(find('r').slice(0, 4)).toEqual([
      { kind: 'category', id: BROWSE_IDS.meetingCategory },
      radiology,
      { kind: 'location', id: BROWSE_IDS.eastMeeting },
      { kind: 'location', id: IDS.waitingRoom },
    ]);
  });

  it('diakritik dan huruf besar/kecil tidak berpengaruh', () => {
    expect(find('embung')).toEqual([{ kind: 'location', id: BROWSE_IDS.pond }]);
    expect(find('ruang tunggu umum')).toEqual([{ kind: 'location', id: IDS.waitingRoom }]);
  });

  it('kueri kosong tidak menghasilkan apa pun', () => {
    expect(find('')).toEqual([]);
    expect(find('   ')).toEqual([]);
  });
});
