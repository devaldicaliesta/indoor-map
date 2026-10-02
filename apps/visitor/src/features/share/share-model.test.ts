import { buildSnapshot, decodeDeepLink, encodeDeepLink, indexSnapshot } from '@indoor/domain';
import { IDS, sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { describe, expect, it } from 'vitest';
import { type SharedState, sharedState, shareLink } from './share-model';

const snapshot = buildSnapshot(sampleSnapshotSource());
const index = indexSnapshot(snapshot);
const facility = snapshot.features.features.find((f) => f.properties.kind === 'facility');
const unitWithoutLocation = snapshot.features.features.find(
  (f) => f.properties.kind === 'unit' && !index.locationByUnit.has(f.id),
);
const qr = snapshot.originPoints[0]?.code ?? '';

const none: SharedState = {
  detail: null,
  origin: null,
  destination: null,
  accessible: false,
  language: null,
};

/** Bagikan lalu buka di perangkat lain: lewat URL yang sesungguhnya. */
function roundTrip(state: SharedState): SharedState {
  const url = encodeDeepLink(shareLink(snapshot, index, state));
  return sharedState(snapshot, index, decodeDeepLink(url));
}

describe('tautan bagikan', () => {
  it('lokasi yang dibuka', () => {
    const state = {
      ...none,
      detail: { kind: 'location', id: IDS.radiology },
      language: 'en',
    } as const;
    expect(roundTrip(state)).toEqual(state);
  });

  it('rute dari QR ke lokasi dengan mode aksesibel', () => {
    const state: SharedState = {
      ...none,
      origin: { kind: 'origin_point', code: qr },
      destination: { kind: 'location', id: IDS.radiology },
      accessible: true,
      language: 'id',
    };
    expect(roundTrip(state)).toEqual(state);
  });

  it('rute dari fasilitas ke unit tanpa lokasi: titik wakilnya kembali ke fiturnya', () => {
    const state: SharedState = {
      ...none,
      origin: { kind: 'feature', featureId: facility?.id ?? '' },
      destination: { kind: 'unit', id: unitWithoutLocation?.id ?? '' },
    };
    expect(unitWithoutLocation).toBeDefined();
    expect(roundTrip(state)).toEqual(state);
  });

  it('titik di peta tetap titik', () => {
    const floorId = facility?.properties.floorId ?? '';
    const origin = { kind: 'point', lng: 106.8270001, lat: -6.1751234, floorId } as const;
    const state: SharedState = {
      ...none,
      origin,
      destination: { kind: 'location', id: IDS.radiology },
    };
    expect(roundTrip(state).origin).toEqual(origin);
  });

  it('bagian yang tidak ada lagi di snapshot diabaikan', () => {
    const link = decodeDeepLink(
      `/v/${snapshot.venue.id}?o=000000000000&loc=0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4aff`,
    );
    expect(sharedState(snapshot, index, link)).toEqual(none);
  });
});
