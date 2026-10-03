import { describe, expect, it } from 'vitest';
import { buildSnapshot, type Snapshot, unitColors } from '../src';
import { mallVenue } from './fixtures/demo-venues';

function mall(): Snapshot {
  return buildSnapshot(mallVenue());
}

describe('warna unit menurut kategori', () => {
  it('unit berlokasi memakai warna kategori pertama lokasinya', () => {
    const s = mall();
    const colors = unitColors(s);
    const location = s.locations.find((l) => l.status === 'active' && l.primaryUnitId);
    const category = s.categories.find((c) => c.id === location?.categoryIds[0]);
    expect(colors.get(location?.primaryUnitId ?? '')).toBe(category?.color);
  });

  it('tanpa warna kategori: warna tipe lokasi; tanpa keduanya: tidak diwarnai', () => {
    const s = mall();
    const location = s.locations.find((l) => l.primaryUnitId) as Snapshot['locations'][number];
    const type = s.locationTypes.find((t) => t.id === location.locationTypeId);
    const plain = { ...s, categories: s.categories.map((c) => ({ ...c, color: null })) };
    expect(unitColors(plain).get(location.primaryUnitId ?? '')).toBe(type?.color);
    const bare = {
      ...plain,
      locationTypes: plain.locationTypes.map((t) => ({ ...t, color: null })),
    };
    expect(unitColors(bare).size).toBe(0);
  });

  it('unit kosong dan unit tanpa lokasi tidak diwarnai; warna fitur sendiri tidak ditimpa', () => {
    const s = mall();
    const colors = unitColors(s);
    const vacant = s.features.features.find((f) => f.properties.unitStatus === 'vacant');
    expect(vacant && colors.has(vacant.properties.id)).toBe(false);
    const unit = s.locations[0]?.primaryUnitId ?? '';
    const own = {
      ...s,
      features: {
        ...s.features,
        features: s.features.features.map((f) =>
          f.properties.id === unit
            ? { ...f, properties: { ...f.properties, color: '#123456' } }
            : f,
        ),
      },
    } as Snapshot;
    expect(unitColors(own).has(unit)).toBe(false);
  });
});
