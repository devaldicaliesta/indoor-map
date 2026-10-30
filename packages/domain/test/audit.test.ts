import { describe, expect, it } from 'vitest';
import { AUDIT_ACTIONS, AuditActionSchema } from '../src';

describe('AUDIT_ACTIONS', () => {
  it('berisi peristiwa wajib NFR-SEC-05 dan hak subjek data UU PDP', () => {
    expect(AUDIT_ACTIONS).toEqual([
      'login',
      'login_failed',
      'role_changed',
      'user_deactivated',
      'publish',
      'rollback',
      'license_changed',
      'settings_changed',
      'edit_lock_taken_over',
      'user_data_exported',
      'user_data_deleted',
      'audit_purged',
      'eula_accepted',
    ]);
  });

  it('menolak aksi di luar daftar', () => {
    expect(AuditActionSchema.safeParse('feature_updated').success).toBe(false);
  });
});
