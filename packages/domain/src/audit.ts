import { z } from 'zod';

/**
 * Peristiwa penting yang wajib dicatat di `audit_events`. Audit log lengkap
 * (setiap perubahan data) menyusul di F2.
 */
export const AUDIT_ACTIONS = [
  'login',
  'login_failed',
  'role_changed',
  'user_deactivated',
  'publish',
  'rollback',
  'license_changed',
  'settings_changed',
  'edit_lock_taken_over',
] as const;
export const AuditActionSchema = z.enum(AUDIT_ACTIONS);
export type AuditAction = z.infer<typeof AuditActionSchema>;

/** Batas baris yang ditampilkan di tab Catatan. */
export const AUDIT_LOG_LIMIT = 200;

export interface AuditPerson {
  userId: string;
  name: string;
  email: string;
}

export interface AuditEvent {
  id: number;
  occurredAt: string;
  action: AuditAction;
  /** Pelaku; `null` untuk proses sistem. Untuk login, pelaku = akun yang mencoba masuk. */
  actor: AuditPerson | null;
  /** Pengguna yang dikenai peristiwa (role diubah, dinonaktifkan); `null` bila bukan tentang pengguna. */
  target: AuditPerson | null;
  entityId: string | null;
  details: Record<string, unknown>;
}
