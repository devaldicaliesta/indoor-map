import { describe, expect, it } from 'vitest';
import {
  buildSnapshot,
  EMPTY_SNAPSHOT_GRAPH,
  graphDeferred,
  parsePublishedSnapshot,
  parseSnapshot,
  parseSnapshotGraph,
  splitSnapshot,
  withGraph,
} from '../src';
import { sampleSnapshotSource } from './fixtures/snapshot-source';

describe('splitSnapshot', () => {
  const full = buildSnapshot(sampleSnapshotSource());

  it('inti tanpa graf dengan path berkas graf per versi; lolos skema', () => {
    const { core, graph } = splitSnapshot(full);
    expect(core.graph).toEqual(EMPTY_SNAPSHOT_GRAPH);
    expect(core.graphPath).toBe(`v${full.version}.graph.json`);
    expect(graphDeferred(core)).toBe(true);
    expect(parseSnapshot(JSON.parse(JSON.stringify(core)))).toEqual(core);
    expect(parseSnapshotGraph(JSON.parse(JSON.stringify(graph)))).toEqual(full.graph);
  });

  it('inti + graf kembali sama dengan snapshot lengkap', () => {
    const { core, graph } = splitSnapshot(full);
    const joined = withGraph(core, graph);
    expect(joined).toEqual(full);
    expect(graphDeferred(joined)).toBe(false);
  });

  it('snapshot lengkap lama (tanpa graphPath) tetap terbaca dan tidak menunggu graf', () => {
    const parsed = parseSnapshot(JSON.parse(JSON.stringify(full)));
    expect(graphDeferred(parsed)).toBe(false);
    expect(parsed.graph.edges.length).toBeGreaterThan(0);
  });

  it('isi inti jauh lebih kecil daripada snapshot lengkap', () => {
    const { core } = splitSnapshot(full);
    expect(JSON.stringify(core).length).toBeLessThan(JSON.stringify(full).length);
  });
});

describe('parsePublishedSnapshot', () => {
  const full = buildSnapshot(sampleSnapshotSource());

  it('menerima snapshot terbit (lengkap maupun inti) apa adanya', () => {
    const { core } = splitSnapshot(full);
    for (const snapshot of [full, core]) {
      const body = JSON.parse(JSON.stringify(snapshot));
      expect(parsePublishedSnapshot(body)).toBe(body);
    }
  });

  it('menolak versi skema lain dan bentuk yang rusak', () => {
    const body = JSON.parse(JSON.stringify(full));
    expect(() => parsePublishedSnapshot({ ...body, schemaVersion: 999 })).toThrow();
    expect(() => parsePublishedSnapshot({ ...body, locations: null })).toThrow();
    expect(() => parsePublishedSnapshot({ serviceInactive: true })).toThrow();
  });
});
