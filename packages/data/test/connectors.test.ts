import { describe, expect, it } from 'vitest';
import { mapConnectorRow } from '../src/repositories/connectors';

const row = {
  id: '17000000-0000-4000-8000-000000000001',
  kind: 'escalator' as const,
  name: 'Eskalator naik',
  direction: 'up' as const,
  is_accessible: false,
  connector_stops: [
    { floor_id: 'gf', node_id: 'n1' },
    { floor_id: 'l1', node_id: 'n2' },
  ],
};

describe('baris konektor', () => {
  it('menjadi tipe domain beserta pemberhentiannya', () => {
    expect(mapConnectorRow(row)).toEqual({
      id: row.id,
      kind: 'escalator',
      name: 'Eskalator naik',
      direction: 'up',
      accessible: false,
      stops: [
        { floorId: 'gf', nodeId: 'n1' },
        { floorId: 'l1', nodeId: 'n2' },
      ],
    });
  });

  it('tanpa pemberhentian dan tanpa arah tetap terbaca', () => {
    expect(
      mapConnectorRow({ ...row, kind: 'stairs', direction: null, connector_stops: null }),
    ).toMatchObject({ kind: 'stairs', direction: null, stops: [] });
  });
});
