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
  edit_lock_taken_over: 'Kunci edit diambil alih',
  user_data_exported: 'Data akun diekspor',
  user_data_deleted: 'Akun dihapus',
  audit_purged: 'Log audit dibersihkan',
  eula_accepted: 'EULA disetujui',
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
  basemap_tile_url: 'URL tile peta dasar',
  basemap_attribution: 'atribusi peta dasar',
  audit_retention_days: 'masa simpan log audit',
};

const LICENSE_SOURCES: Record<string, string> = {
  online: 'aktivasi online',
  manual: 'unggah berkas',
  checkin: 'check-in',
};

const roleLabel = (role: unknown) =>
  typeof role === 'string' && role in ROLE_LABELS ? ROLE_LABELS[role as AppRole] : String(role);

/** Keterangan singkat per peristiwa; tidak pernah berisi nilai rahasia. */
export function describeAuditDetails(event: AuditEvent): string {
  const subject = event.target ? `${event.target.name} (${event.target.email})` : '';
  const detail = describeDetails(event);
  return [subject, detail].filter(Boolean).join(' · ');
}

function describeDetails(event: AuditEvent): string {
  const { details } = event;
  switch (event.action) {
    case 'login_failed': {
      const reason = FAILURE_REASONS[String(details.reason)] ?? 'ditolak';
      return typeof details.failures === 'number' ? `${reason} (${details.failures}×)` : reason;
    }
    case 'role_changed':
      return `${roleLabel(details.from)} → ${roleLabel(details.to)}`;
    case 'user_data_exported':
      return event.target ? '' : 'Pengguna terhapus';
    case 'user_data_deleted':
      // Profilnya sudah tidak ada, jadi sasaran ditampilkan lewat role yang dicatat.
      return `Pengguna terhapus (${roleLabel(details.role)})`;
    case 'eula_accepted':
      return [
        typeof details.version === 'string' ? `Versi ${details.version}` : '',
        typeof details.licensee === 'string' ? details.licensee : '',
        typeof details.license_id === 'string' ? details.license_id : '',
      ]
        .filter(Boolean)
        .join(' · ');
    case 'audit_purged':
      return typeof details.deleted === 'number' && typeof details.retention_days === 'number'
        ? `${details.deleted} peristiwa lebih tua dari ${details.retention_days} hari`
        : '';
    case 'publish':
    case 'rollback': {
      const version = typeof details.version === 'number' ? `Versi ${details.version}` : '';
      const source =
        typeof details.source_version === 'number' ? ` dari v${details.source_version}` : '';
      return [
        version && `${version}${source}`,
        typeof details.venue === 'string' ? details.venue : '',
      ]
        .filter(Boolean)
        .join(' · ');
    }
    case 'license_changed':
      return [
        typeof details.license_id === 'string' ? details.license_id : '',
        details.status === 'revoked'
          ? 'dicabut vendor'
          : (LICENSE_SOURCES[String(details.source)] ?? ''),
      ]
        .filter(Boolean)
        .join(' · ');
    case 'settings_changed':
      return Array.isArray(details.fields)
        ? details.fields.map((f) => SETTING_FIELDS[String(f)] ?? String(f)).join(', ')
        : '';
    default:
      return '';
  }
}
