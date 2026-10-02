import type { FloorFeature } from '@indoor/data';
import type { FeatureKind, MapFeatureProperties } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import {
  buildRows,
  firstMatch,
  GROUP_ROW_PX,
  ITEM_ROW_PX,
  type ListItem,
  normalizeSearch,
  revealScrollTop,
  rowOffsets,
  toListItem,
  visibleRange,
} from './feature-list-model';

const feature = (properties: Omit<MapFeatureProperties, 'floorId'>): FloorFeature => ({
  type: 'Feature',
  id: properties.id,
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties: { floorId: 'f', ...properties },
});
const typeName = (id: string) => (id === 't1' ? 'Toilet Pria' : undefined);
const fallback = (kind: FeatureKind) => `${kind} tanpa nama`;
const item = (f: FloorFeature) => toListItem(f, typeName, fallback);

const units = ['GU-L1-021', 'GU-L1-002', 'GU-L1-010', 'GU-GF-021'].map((code, i) =>
  item(feature({ id: `u${i}`, kind: 'unit', unitCode: code })),
);

describe('item daftar fitur', () => {
  it('kode unit sebagai label dengan nama di sampingnya', () => {
    expect(
      item(feature({ id: 'a', kind: 'unit', unitCode: 'GU-L1-023', name: 'Radiologi' })),
    ).toEqual({
      id: 'a',
      kind: 'unit',
      label: 'GU-L1-023',
      detail: 'Radiologi',
      isCode: true,
    });
  });

  it('fasilitas tanpa nama memakai nama jenisnya; bernama tetap menyebut jenis', () => {
    expect(item(feature({ id: 'b', kind: 'facility', facilityTypeId: 't1' })).label).toBe(
      'Toilet Pria',
    );
    expect(
      item(feature({ id: 'c', kind: 'facility', facilityTypeId: 't1', name: 'Sayap barat' })),
    ).toMatchObject({ label: 'Sayap barat', detail: 'Toilet Pria' });
    expect(item(feature({ id: 'd', kind: 'wall' })).label).toBe('wall tanpa nama');
  });
});

describe('firstMatch', () => {
  it('hasil pertama untuk teks saat ini, urut seperti daftar', () => {
    expect(firstMatch(units, 'gu-l1')?.label).toBe('GU-L1-002');
    expect(firstMatch(units, 'GF-021')?.label).toBe('GU-GF-021');
    expect(firstMatch(units, 'tidak-ada')).toBeUndefined();
  });
});

describe('buildRows', () => {
  it('mencari "L1-02" hanya menampilkan unit yang cocok, grupnya terbuka otomatis', () => {
    const rows = buildRows(units, { query: 'L1-02', isExpanded: () => false });
    expect(rows).toEqual([
      { type: 'group', kind: 'unit', count: 1, expanded: true },
      expect.objectContaining({ type: 'item', label: 'GU-L1-021' }),
    ]);
  });

  it('pencarian tidak peka huruf besar/kecil dan diakritik, mencakup nama dan jenis', () => {
    expect(normalizeSearch('  Kafé RADIOLOGI ')).toBe('kafe radiologi');
    const items: ListItem[] = [
      item(feature({ id: 'r', kind: 'unit', unitCode: 'A-1', name: 'Radiologi' })),
      item(feature({ id: 't', kind: 'facility', facilityTypeId: 't1', name: 'Barat' })),
    ];
    expect(buildRows(items, { query: 'radio', isExpanded: () => false })).toHaveLength(2);
    expect(buildRows(items, { query: 'toilet', isExpanded: () => false })).toHaveLength(2);
    expect(buildRows(items, { query: 'tidak-ada', isExpanded: () => false })).toEqual([]);
  });

  it('tanpa pencarian: grup tertutup hanya berisi judul dan jumlah; isi terurut alami', () => {
    const closed = buildRows(units, { query: '', isExpanded: () => false });
    expect(closed).toEqual([{ type: 'group', kind: 'unit', count: 4, expanded: false }]);
    const open = buildRows(units, { query: '', isExpanded: () => true });
    expect(open.slice(1).map((r) => (r.type === 'item' ? r.label : ''))).toEqual([
      'GU-GF-021',
      'GU-L1-002',
      'GU-L1-010',
      'GU-L1-021',
    ]);
  });
});

describe('jendela virtual', () => {
  const rows = buildRows(
    Array.from({ length: 1000 }, (_, i) =>
      item(feature({ id: `x${i}`, kind: 'unit', unitCode: `U-${i}` })),
    ),
    { query: '', isExpanded: () => true },
  );
  const offsets = rowOffsets(rows);

  it('tinggi total = satu judul grup + 1.000 baris item', () => {
    expect(offsets).toHaveLength(1002);
    expect(offsets.at(-1)).toBe(GROUP_ROW_PX + 1000 * ITEM_ROW_PX);
  });

  it('hanya baris terlihat ditambah cadangan yang dirender', () => {
    // Baris 0 (judul) s.d. 19 terlihat di 560 px, ditambah 8 cadangan.
    expect(visibleRange(offsets, 0, 560, 8)).toEqual({ start: 0, end: 28 });
    const middle = visibleRange(offsets, GROUP_ROW_PX + 500 * ITEM_ROW_PX, 560, 8);
    expect(middle).toEqual({ start: 493, end: 529 });
    expect(middle.end - middle.start).toBeLessThan(40);
    expect(visibleRange(offsets, offsets.at(-1) ?? 0, 560, 8).end).toBe(1001);
    expect(visibleRange([0], 0, 560)).toEqual({ start: 0, end: 0 });
  });

  it('menggulir seperlunya agar baris terpilih terlihat', () => {
    const index = 600;
    const top = offsets[index] ?? 0;
    expect(revealScrollTop(offsets, index, 0, 560)).toBe(top + ITEM_ROW_PX - 560);
    expect(revealScrollTop(offsets, index, top + 100, 560)).toBe(top);
    expect(revealScrollTop(offsets, index, top - 100, 560)).toBeNull();
  });
});
