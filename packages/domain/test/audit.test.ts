import { describe, expect, it } from 'vitest';
import { AUDIT_ACTIONS, AuditActionSchema } from '../src';

describe('AUDIT_ACTIONS', () => {
  it('berisi delapan peristiwa wajib NFR-SEC-05', () => {
    expect(AUDIT_ACTIONS).toEqual([
      'login',
      'login_failed',
      'role_changed',
      'user_deactivated',
      'publish',
      'rollback',
      'license_changed',
      'settings_changed',
    ]);
  });

  it('menolak aksi di luar daftar', () => {
    expect(AuditActionSchema.safeParse('feature_updated').success).toBe(false);
  });
});
