import { describe, expect, it } from 'vitest';
import { INFO_POINT_ZOOM, infoPointSnapshot } from '../src/info-point-view';
import { buildSnapshot } from '../src/snapshot-builder';
import { sampleSnapshotSource } from './fixtures/snapshot-source';

const snapshot = buildSnapshot(sampleSnapshotSource());

describe('infoPointSnapshot', () => {
  it('kamera di posisi Info Point, diputar sesuai arah hadap', () => {
    const result = infoPointSnapshot(snapshot, 'IP-LOBI');
    expect(result?.infoPoint.name).toBe('Info Point Lobi');
    expect(result?.snapshot.venue.camera).toEqual({
      center: result?.infoPoint.coordinates,
      zoom: INFO_POINT_ZOOM,
      pitch: 0,
      bearing: 180,
    });
    expect(result?.snapshot.enabledFeatures).toContain('3d');
  });

  it('paksa 2D mematikan 3D dan mode awal', () => {
    const forced = {
      ...snapshot,
      infoPoints: snapshot.infoPoints.map((p) => ({
        ...p,
        force2d: true,
        defaultMode: '3d' as const,
      })),
    };
    const result = infoPointSnapshot(forced, 'IP-LOBI');
    expect(result?.snapshot.enabledFeatures).not.toContain('3d');
    expect(result?.snapshot.venue.display.defaultMode).toBe('2d');
  });

  it('kode tidak dikenal', () => {
    expect(infoPointSnapshot(snapshot, 'TIDAK-ADA')).toBeNull();
  });
});
