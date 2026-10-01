import type { VenueId } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { createNavGraphRepository, mapEdgeRow, mapNodeRow } from '../src/repositories/nav-graph';
import type { Db } from '../src/supabase';

const nodeRow = {
  id: '9e000000-0000-4000-8000-000000000001',
  floor_id: '599dad1f-3e11-54f4-bf79-a222b96e5e6f',
  geom: {
    type: 'Point',
    crs: { type: 'name', properties: { name: 'EPSG:4326' } },
    coordinates: [106.8268, -6.17528085],
  },
  role: 'entrance' as const,
  feature_id: 'fe95ce3f-e79e-599e-b0eb-2fbbb0e7bd67',
};

describe('baris graf', () => {
  it('nav_nodes dan nav_edges menjadi tipe domain', () => {
    expect(mapNodeRow(nodeRow)).toEqual({
      id: nodeRow.id,
      floorId: nodeRow.floor_id,
      coordinates: [106.8268, -6.17528085],
      role: 'entrance',
      featureId: nodeRow.feature_id,
    });
    expect(
      mapEdgeRow({
        id: 'e1',
        floor_id: 'f1',
        from_node_id: 'a',
        to_node_id: 'b',
        length_m: 12.5,
        is_accessible: false,
      }),
    ).toEqual({ id: 'e1', floorId: 'f1', from: 'a', to: 'b', lengthM: 12.5, accessible: false });
  });

  it('node yang bukan titik ditolak', () => {
    const line = {
      type: 'LineString',
      coordinates: [
        [106.8, -6.1],
        [106.9, -6.2],
      ],
    };
    expect(() => mapNodeRow({ ...nodeRow, geom: line })).toThrow(DataError);
  });
});

/** Klien palsu yang mencatat urutan permintaan tulis. */
function recordingDb() {
  const calls: string[] = [];
  const db = {
    from: (table: string) => ({
      delete: () => ({
        in: async (_column: string, ids: string[]) => {
          calls.push(`hapus ${table} ${ids.length}`);
          return { error: null };
        },
      }),
      upsert: async (rows: { id: string }[]) => {
        calls.push(`simpan ${table} ${rows.map((r) => r.id).join(',')}`);
        return { error: null };
      },
    }),
  };
  return { db: db as unknown as Db, calls };
}

describe('menyimpan perubahan graf', () => {
  it('hapus edge, simpan node, simpan edge, lalu hapus node; hapus dipecah per 100 id', async () => {
    const { db, calls } = recordingDb();
    const node = (id: string) => ({
      id,
      floorId: 'f1',
      coordinates: [106.8, -6.17] as [number, number],
      role: 'path' as const,
      featureId: null,
    });
    await createNavGraphRepository(db).apply('00000000-0000-4000-8000-000000000001' as VenueId, {
      saveNodes: [node('n1'), node('n2')],
      removeNodeIds: ['n9'],
      saveEdges: [{ id: 'e1', floorId: 'f1', from: 'n1', to: 'n2', lengthM: 3, accessible: true }],
      removeEdgeIds: Array.from({ length: 250 }, (_, i) => `x${i}`),
    });
    expect(calls).toEqual([
      'hapus nav_edges 100',
      'hapus nav_edges 100',
      'hapus nav_edges 50',
      'simpan nav_nodes n1,n2',
      'simpan nav_edges e1',
      'hapus nav_nodes 1',
    ]);
  });
});
