import { buildSnapshot, indexSnapshot } from '@indoor/domain';
import {
  IDS,
  RADIOLOGY_UNITS,
  sampleSnapshotSource,
} from '@indoor/domain/fixtures/snapshot-source.ts';
import { describe, expect, it } from 'vitest';
import { highlightBounds, targetOfPick } from './explore-map';

const snapshot = buildSnapshot(sampleSnapshotSource());
const index = indexSnapshot(snapshot);
const facility = snapshot.features.features.find((f) => f.properties.kind === 'facility');
const radiologyFloor = index.features.get(RADIOLOGY_UNITS[0] ?? '')?.properties.floorId ?? '';

describe('ketuk peta Visitor', () => {
  it('label lokasi dan fasilitas membuka detailnya', () => {
    expect(targetOfPick(index, { layer: 'label', kind: 'location', id: IDS.radiology })).toEqual({
      kind: 'location',
      id: IDS.radiology,
    });
    expect(
      targetOfPick(index, { layer: 'label', kind: 'facility', id: facility?.id ?? '' }),
    ).toEqual({ kind: 'facility', id: facility?.id });
    expect(targetOfPick(index, { layer: 'label', kind: 'location', id: 'lama' })).toBeNull();
  });

  it('unit berlokasi membuka lokasinya', () => {
    expect(targetOfPick(index, { layer: 'floor', id: RADIOLOGY_UNITS[1] ?? '' })).toEqual({
      kind: 'location',
      id: IDS.radiology,
    });
  });
});

describe('bingkai kamera sorotan', () => {
  it('hanya fitur di lantai yang digambar', () => {
    const bounds = highlightBounds(index, RADIOLOGY_UNITS, [radiologyFloor]);
    expect(bounds).not.toBeNull();
    const [[minX, minY], [maxX, maxY]] = bounds ?? [
      [0, 0],
      [0, 0],
    ];
    expect(minX).toBeLessThan(maxX);
    expect(minY).toBeLessThan(maxY);
    expect(highlightBounds(index, RADIOLOGY_UNITS, ['lantai-lain'])).toBeNull();
  });
});
