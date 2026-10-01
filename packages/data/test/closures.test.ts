import type { VenueId } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { createClosuresRepository, mapClosureRow } from '../src/repositories/closures';
import type { Db } from '../src/supabase';

const row = {
  id: 'c0000000-0000-4000-8000-000000000001',
  feature_id: null,
  edge_id: 'e0000000-0000-4000-8000-000000000001',
  connector_id: null,
  reason: 'Pengecatan lantai',
  starts_at: '2026-10-01T08:00:00+00:00',
  ends_at: null,
};

describe('penutupan', () => {
  it('baris closures menjadi tipe domain', () => {
    expect(mapClosureRow(row)).toEqual({
      id: row.id,
      featureId: null,
      edgeId: row.edge_id,
      connectorId: null,
      reason: 'Pengecatan lantai',
      startsAt: '2026-10-01T08:00:00+00:00',
      endsAt: null,
    });
  });

  it('hanya meminta penutupan venue itu yang belum berakhir pada waktu yang diberikan', async () => {
    const calls: unknown[][] = [];
    const query = new Proxy(
      {},
      {
        get: (_target, method: string) =>
          method === 'then'
            ? (resolve: (value: unknown) => void) => resolve({ data: [row], error: null })
            : (...args: unknown[]) => {
                calls.push([method, ...args]);
                return query;
              },
      },
    );
    const from = (table: string) => {
      calls.push(['from', table]);
      return query;
    };
    const db = { from } as unknown as Db;
    const venueId = '00000000-0000-4000-8000-000000000009' as VenueId;
    const list = await createClosuresRepository(db).listCurrent(
      venueId,
      new Date('2026-10-01T10:00:00Z'),
    );
    expect(list.map((c) => c.id)).toEqual([row.id]);
    expect(calls).toContainEqual(['from', 'closures']);
    expect(calls).toContainEqual(['eq', 'venue_id', venueId]);
    expect(calls).toContainEqual(['or', 'ends_at.is.null,ends_at.gt."2026-10-01T10:00:00.000Z"']);
  });
});
