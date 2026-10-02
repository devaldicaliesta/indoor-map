import { describe, expect, it } from 'vitest';
import { mapLockRow } from '../src/repositories/edit-locks';

describe('kunci edit', () => {
  it('baris fungsi acquire_edit_lock menjadi tipe domain; tanpa baris berarti tidak terkunci', () => {
    expect(
      mapLockRow('f1', {
        user_id: 'u1',
        full_name: 'Ani',
        started_at: '2026-10-02T03:12:00+00:00',
        last_activity_at: '2026-10-02T03:20:00+00:00',
      }),
    ).toEqual({
      floorId: 'f1',
      userId: 'u1',
      fullName: 'Ani',
      startedAt: '2026-10-02T03:12:00+00:00',
      lastActivityAt: '2026-10-02T03:20:00+00:00',
    });
    expect(mapLockRow('f1', undefined)).toBeNull();
  });
});
