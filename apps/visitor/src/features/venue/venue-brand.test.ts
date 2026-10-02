import { buildSnapshot, type Snapshot } from '@indoor/domain';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { ROUTE_COLOR } from '@indoor/map-core';
import { describe, expect, it } from 'vitest';
import { venueBrand } from './venue-brand';

const assetUrl = (path: string) => `https://cdn.test/${path}`;
const snapshot = buildSnapshot(sampleSnapshotSource());

describe('branding venue di Visitor', () => {
  it('nama tampilan, logo venue, dan warna rute dari snapshot', () => {
    expect(venueBrand(snapshot, assetUrl)).toEqual({
      name: 'RS Kenari',
      logoUrl: `https://cdn.test/${snapshot.venue.logoPath}`,
      routeColor: '#e4002b',
    });
  });

  it('snapshot lama tanpa branding dan tanpa logo memakai nama venue dan warna bawaan', () => {
    const { branding: _, ...venue } = snapshot.venue;
    const old: Snapshot = { ...snapshot, venue: { ...venue, logoPath: null } };
    expect(venueBrand(old, assetUrl)).toEqual({
      name: snapshot.venue.name,
      logoUrl: null,
      routeColor: ROUTE_COLOR,
    });
  });
});
