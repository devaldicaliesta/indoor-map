import type { AuditEvent } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { describeAuditDetails } from './audit-format';

const event = (action: AuditEvent['action'], details: Record<string, unknown>): AuditEvent => ({
  id: 1,
  occurredAt: '2026-09-29T10:00:00Z',
  action,
  actor: null,
  entityId: null,
  details,
});

describe('describeAuditDetails', () => {
  it('gagal masuk menyebut alasan dan hitungan', () => {
    expect(
      describeAuditDetails(event('login_failed', { reason: 'invalid_password', failures: 3 })),
    ).toBe('password salah (3×)');
    expect(describeAuditDetails(event('login_failed', { reason: 'locked' }))).toBe('akun terkunci');
  });

  it('perubahan role memakai nama role', () => {
    expect(describeAuditDetails(event('role_changed', { from: 'editor', to: 'viewer' }))).toBe(
      'Editor → Viewer',
    );
  });

  it('pengaturan menyebut kolom, bukan nilainya', () => {
    expect(
      describeAuditDetails(event('settings_changed', { fields: ['smtp_host', 'smtp_password'] })),
    ).toBe('host SMTP, password SMTP');
  });
});
