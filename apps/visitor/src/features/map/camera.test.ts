import type { Snapshot } from '@indoor/domain';
import { type FloorFeatureCollection, PITCH_3D } from '@indoor/map-core';
import { describe, expect, it } from 'vitest';
import { initialCamera } from './camera';

const venue = (camera: Snapshot['venue']['camera']) =>
  ({ venue: { camera } }) as Pick<Snapshot, 'venue'>;

const features: FloorFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.8268, -6.1751],
            [106.8276, -6.1751],
            [106.8276, -6.1755],
            [106.8268, -6.1755],
            [106.8268, -6.1751],
          ],
        ],
      },
      properties: { id: 'u1', kind: 'unit', floorId: 'f1' },
    },
  ],
};

describe('kamera awal Visitor', () => {
  const saved = {
    center: [106.8272, -6.1753] as [number, number],
    zoom: 19,
    pitch: 35,
    bearing: -20,
  };

  it('memakai kamera yang disimpan di Pengaturan → Tampilan; 2D selalu tegak lurus', () => {
    expect(initialCamera(venue(saved), features, '2d')).toEqual({
      kind: 'view',
      ...saved,
      pitch: 0,
    });
    expect(initialCamera(venue(saved), features, '3d')).toEqual({ kind: 'view', ...saved });
    expect(initialCamera(venue({ ...saved, pitch: 0 }), features, '3d')).toMatchObject({
      pitch: PITCH_3D,
    });
  });

  it('tanpa kamera tersimpan: membingkai lantai awal', () => {
    expect(initialCamera(venue(null), features, '2d')).toEqual({
      kind: 'bounds',
      bounds: [
        [106.8268, -6.1755],
        [106.8276, -6.1751],
      ],
    });
  });

  it('lantai kosong tanpa kamera tersimpan: tidak ada kamera awal', () => {
    expect(
      initialCamera(venue(null), { type: 'FeatureCollection', features: [] }, '2d'),
    ).toBeNull();
  });
});
