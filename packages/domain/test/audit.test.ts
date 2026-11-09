import { describe, expect, it } from 'vitest';
import { AUDIT_ACTIONS, AuditActionSchema } from '../src';

describe('AUDIT_ACTIONS', () => {
  it('berisi peristiwa wajib NFR-SEC-05, hak subjek data UU PDP, dan 2FA', () => {
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
      'mfa_enabled',
      'mfa_disabled',
      'mfa_recovery_codes_created',
      'mfa_recovery_used',
      'mfa_recovery_failed',
      'mfa_reset',
    ]);
  });

  it('menolak aksi di luar daftar', () => {
    expect(AuditActionSchema.safeParse('feature_updated').success).toBe(false);
  });
});
