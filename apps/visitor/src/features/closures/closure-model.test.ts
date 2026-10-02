import { buildSnapshot } from '@indoor/domain';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { describe, expect, it } from 'vitest';
import { closureMarks, knownClosures } from './closure-model';

const snapshot = buildSnapshot(sampleSnapshotSource());
const edge = snapshot.graph.edges[0];
const connector = snapshot.graph.connectors[0];
const base = { reason: 'Perawatan', startsAt: '2026-10-01T00:00:00Z', endsAt: null };
const closure = (
  id: string,
  target: {
    featureId?: string | undefined;
    edgeId?: string | undefined;
    connectorId?: string | undefined;
  },
) => ({
  id,
  featureId: target.featureId ?? null,
  edgeId: target.edgeId ?? null,
  connectorId: target.connectorId ?? null,
  ...base,
});

describe('penutupan live di Visitor', () => {
  it('sasaran yang tidak ada di snapshot diabaikan', () => {
    const list = [
      closure('a', { edgeId: edge?.id }),
      closure('b', { edgeId: 'belum-dipublish' }),
      closure('c', { connectorId: connector?.id }),
      closure('d', { featureId: 'hilang' }),
    ];
    expect(knownClosures(snapshot, list).map((c) => c.id)).toEqual(['a', 'c']);
  });

  it('penanda hanya untuk lantai yang digambar', () => {
    const list = [closure('a', { edgeId: edge?.id }), closure('c', { connectorId: connector?.id })];
    const onEdgeFloor = closureMarks(snapshot, list, [edge?.floorId ?? '']);
    expect(onEdgeFloor.lines).toHaveLength(1);
    const stopFloors = connector?.stops.map((s) => s.floorId) ?? [];
    expect(closureMarks(snapshot, list, stopFloors).points).toHaveLength(stopFloors.length);
    expect(closureMarks(snapshot, list, ['lain'])).toEqual({ areaIds: [], lines: [], points: [] });
  });
});
