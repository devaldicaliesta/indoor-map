import { describe, expect, it } from 'vitest';
import { mapAuditRows } from '../src/repositories/audit';

const actor = { user_id: 'u-1', full_name: 'Super Admin Lokal', email: 'admin@local.test' };

describe('mapAuditRows', () => {
  it('menggabungkan nama pelaku dan detail', () => {
    const [event] = mapAuditRows(
      [
        {
          id: 7,
          occurred_at: '2026-09-29T10:00:00+00:00',
          action: 'role_changed',
          user_id: 'u-1',
          entity: 'user',
          entity_id: 'u-2',
          details: { from: 'editor', to: 'viewer' },
        },
      ],
      [actor, { user_id: 'u-2', full_name: 'Renée Ümmü', email: 'renee@contoh.id' }],
    );
    expect(event).toEqual({
      id: 7,
      occurredAt: '2026-09-29T10:00:00+00:00',
      action: 'role_changed',
      actor: { userId: 'u-1', name: 'Super Admin Lokal', email: 'admin@local.test' },
      target: { userId: 'u-2', name: 'Renée Ümmü', email: 'renee@contoh.id' },
      entityId: 'u-2',
      details: { from: 'editor', to: 'viewer' },
    });
  });

  it('pelaku yang tidak dikenal menjadi null, aksi di luar daftar dilewati', () => {
    const events = mapAuditRows(
      [
        {
          id: 1,
          occurred_at: 't',
          action: 'login',
          user_id: 'u-hapus',
          entity: null,
          entity_id: null,
          details: {},
        },
        {
          id: 2,
          occurred_at: 't',
          action: 'feature_updated',
          user_id: null,
          entity: null,
          entity_id: null,
          details: [],
        },
      ],
      [],
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.actor).toBeNull();
  });
});
