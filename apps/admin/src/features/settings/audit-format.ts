import type { AppRole, AuditAction, AuditEvent } from '@indoor/domain';
import { ROLE_LABELS } from '../../app/navigation';

export const AUDIT_LABELS: Record<AuditAction, string> = {
  login: 'Masuk',
  login_failed: 'Gagal masuk',
  role_changed: 'Role diubah',
  user_deactivated: 'Pengguna dinonaktifkan',
  publish: 'Publish',
  rollback: 'Rollback',
  license_changed: 'Lisensi berubah',
  settings_changed: 'Pengaturan diubah',
};

const FAILURE_REASONS: Record<string, string> = {
  invalid_password: 'password salah',
  locked: 'akun terkunci',
  inactive: 'akun nonaktif',
};

const SETTING_FIELDS: Record<string, string> = {
  public_visitor_url: 'URL publik Visitor',
  default_timezone: 'zona waktu',
  default_language: 'bahasa',
  smtp_host: 'host SMTP',
  smtp_port: 'port SMTP',
  smtp_username: 'username SMTP',
  smtp_from: 'pengirim',
  smtp_password: 'password SMTP',
};

const roleLabel = (role: unknown) =>
  typeof role === 'string' && role in ROLE_LABELS ? ROLE_LABELS[role as AppRole] : String(role);

/** Keterangan singkat per peristiwa; tidak pernah berisi nilai rahasia. */
export function describeAuditDetails(event: AuditEvent): string {
  const { details } = event;
  switch (event.action) {
    case 'login_failed': {
      const reason = FAILURE_REASONS[String(details.reason)] ?? 'ditolak';
      return typeof details.failures === 'number' ? `${reason} (${details.failures}×)` : reason;
    }
    case 'role_changed':
      return `${roleLabel(details.from)} → ${roleLabel(details.to)}`;
    case 'settings_changed':
      return Array.isArray(details.fields)
        ? details.fields.map((f) => SETTING_FIELDS[String(f)] ?? String(f)).join(', ')
        : '';
    default:
      return '';
  }
}
