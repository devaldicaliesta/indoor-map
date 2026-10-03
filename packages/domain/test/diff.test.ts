import { describe, expect, it } from 'vitest';
import { buildSnapshot, CHANGE_GROUPS, changeCount, diffSnapshot, type Snapshot } from '../src';
import { IDS, sampleSnapshotSource } from './fixtures/snapshot-source';

const base = (): Snapshot => buildSnapshot(sampleSnapshotSource());

describe('diffSnapshot', () => {
  it('tidak ada perubahan bila draft sama dengan snapshot aktif', () => {
    const diff = diffSnapshot(base(), base());
    for (const group of CHANGE_GROUPS) expect(changeCount(diff[group])).toBe(0);
  });

  it('venue yang belum pernah publish: semua item ditambah', () => {
    const next = base();
    const diff = diffSnapshot(null, next);
    expect(diff.features.added).toHaveLength(next.features.features.length);
    expect(diff.routes.added).toHaveLength(next.graph.edges.length + next.graph.connectors.length);
    expect(diff.locations.added).toHaveLength(next.locations.length);
    expect(diff.originPoints.added).toHaveLength(next.originPoints.length);
  });

  it('memisahkan tambah, ubah, dan hapus per kelompok dengan jumlah yang benar', () => {
    const prev = base();
    const next = base();
    const [unit, removedFeature] = next.features.features;
    if (!unit || !removedFeature) throw new Error('fixture');
    unit.properties.name = 'Unit Baru Namanya';
    next.features.features = next.features.features.filter((f) => f.id !== removedFeature.id);

    const [edge] = next.graph.edges;
    if (!edge) throw new Error('fixture');
    next.graph.edges.push({ ...edge, id: 'edge-baru', lengthM: 4 });
    edge.accessible = !edge.accessible;

    const radiology = next.locations.find((l) => l.id === IDS.radiology);
    if (!radiology) throw new Error('fixture');
    radiology.name = 'Radiologi Terpadu';
    next.locations = next.locations.filter((l) => l.id !== IDS.lab);

    const [origin] = next.originPoints;
    if (!origin) throw new Error('fixture');
    origin.headingDeg += 90;

    const diff = diffSnapshot(prev, next);
    expect(diff.features.changed.map((i) => i.id)).toEqual([unit.id]);
    expect(diff.features.changed[0]?.name).toBe('Unit Baru Namanya');
    expect(diff.features.changed[0]?.floorName).not.toBeNull();
    expect(diff.features.removed.map((i) => i.id)).toEqual([removedFeature.id]);
    expect(diff.features.added).toEqual([]);

    expect(diff.routes.added.map((i) => i.id)).toEqual(['edge-baru']);
    expect(diff.routes.changed.map((i) => i.id)).toEqual([edge.id]);
    expect(diff.routes.removed).toEqual([]);

    expect(diff.locations.changed.map((i) => i.name)).toEqual(['Radiologi Terpadu']);
    expect(diff.locations.removed.map((i) => i.id)).toEqual([IDS.lab]);

    expect(diff.originPoints.changed.map((i) => i.id)).toEqual([origin.id]);
    expect(changeCount(diff.originPoints)).toBe(1);
  });

  it('konektor yang dihapus masuk kelompok jalur dengan namanya', () => {
    const prev = base();
    const next = base();
    const [connector] = prev.graph.connectors;
    if (!connector) throw new Error('fixture');
    next.graph.connectors = next.graph.connectors.filter((c) => c.id !== connector.id);
    const diff = diffSnapshot(prev, next);
    expect(diff.routes.removed).toEqual([
      { id: connector.id, name: connector.name, floorName: null },
    ]);
  });

  it('versi dan waktu terbit tidak dihitung sebagai perubahan', () => {
    const next = buildSnapshot({
      ...sampleSnapshotSource(),
      version: 9,
      publishedAt: '2027-01-01T00:00:00.000Z',
    });
    const diff = diffSnapshot(base(), next);
    for (const group of CHANGE_GROUPS) expect(changeCount(diff[group])).toBe(0);
  });
});
