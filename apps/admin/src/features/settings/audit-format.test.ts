import type { AuditEvent } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { describeAuditDetails } from './audit-format';

const event = (action: AuditEvent['action'], details: Record<string, unknown>): AuditEvent => ({
  id: 1,
  occurredAt: '2026-09-29T10:00:00Z',
  action,
  actor: null,
  target: null,
  entityId: null,
  details,
});

const target = { userId: 'u-2', name: 'Renée Ümmü', email: 'renee@contoh.id' };

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

  it('peristiwa tentang pengguna lain menyebut pengguna itu', () => {
    const changed = { ...event('role_changed', { from: 'viewer', to: 'editor' }), target };
    expect(describeAuditDetails(changed)).toBe('Renée Ümmü (renee@contoh.id) · Viewer → Editor');
    const deactivated = { ...event('user_deactivated', {}), target };
    expect(describeAuditDetails(deactivated)).toBe('Renée Ümmü (renee@contoh.id)');
  });

  it('publish menyebut nomor versi dan venue', () => {
    expect(describeAuditDetails(event('publish', { version: 4, venue: 'RS Harapan' }))).toBe(
      'Versi 4 · RS Harapan',
    );
    expect(describeAuditDetails(event('publish', {}))).toBe('');
  });

  it('pengaturan menyebut kolom, bukan nilainya', () => {
    expect(
      describeAuditDetails(event('settings_changed', { fields: ['smtp_host', 'smtp_password'] })),
    ).toBe('host SMTP, password SMTP');
  });
});
