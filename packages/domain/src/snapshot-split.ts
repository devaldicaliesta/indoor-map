import type { Snapshot, SnapshotGraph } from './snapshot.ts';

/**
 * Graf jalur adalah bagian terbesar snapshot (±85% untuk venue 10 lantai) dan hanya dibutuhkan
 * saat rute dihitung atau penutupan jalur digambar. `latest.json` membawa snapshot tanpa graf;
 * grafnya diterbitkan sebagai berkas tetap per versi dan dimuat Visitor di latar belakang.
 * `v{n}.json` tetap lengkap untuk rollback, diff, dan pemulihan layanan.
 */
export const EMPTY_SNAPSHOT_GRAPH: SnapshotGraph = { nodes: [], edges: [], connectors: [] };

/** Nama berkas graf versi `version`, relatif terhadap folder venue di bucket snapshot. */
export const snapshotGraphPath = (version: number) => `v${version}.graph.json`;

/** Snapshot inti (graf kosong + `graphPath`) dan grafnya. */
export function splitSnapshot(snapshot: Snapshot): { core: Snapshot; graph: SnapshotGraph } {
  return {
    core: {
      ...snapshot,
      graph: EMPTY_SNAPSHOT_GRAPH,
      graphPath: snapshotGraphPath(snapshot.version),
    },
    graph: snapshot.graph,
  };
}

/** Snapshot lengkap dari inti dan grafnya. */
export function withGraph(core: Snapshot, graph: SnapshotGraph): Snapshot {
  const { graphPath: _, ...rest } = core;
  return { ...rest, graph };
}

/** `true` bila graf snapshot ini masih harus dimuat dari `graphPath`. */
export const graphDeferred = (snapshot: Snapshot): boolean => snapshot.graphPath !== undefined;
