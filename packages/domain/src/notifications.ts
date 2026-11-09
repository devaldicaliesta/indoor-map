import type { AppRole } from './profile';

/**
 * Notifikasi email operasional yang bisa dimatikan per pengguna (migrasi 0062). Peringatan
 * kesehatan sistem dan pemberitahuan keamanan akun selalu dikirim.
 */
export const NOTIFICATION_KINDS = ['license_reminder', 'publish', 'closure_created'] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationPreferences = Record<NotificationKind, boolean>;

// Sama dengan penerima di database: pengingat lisensi ke Super Admin, publish ke yang menyunting
// peta, penutupan ke yang mengelola penutupan.
const RECIPIENT_ROLES: Record<NotificationKind, readonly AppRole[]> = {
  license_reminder: ['super_admin'],
  publish: ['super_admin', 'admin', 'editor'],
  closure_created: ['super_admin', 'admin', 'operator'],
};

/** Jenis email yang bisa diterima role ini, untuk pilihan preferensi. */
export function notificationKindsFor(role: AppRole): NotificationKind[] {
  return NOTIFICATION_KINDS.filter((kind) => RECIPIENT_ROLES[kind].includes(role));
}

/** Tanpa baris preferensi, setiap jenis aktif. */
export function withDefaultPreferences(
  saved: Partial<NotificationPreferences>,
): NotificationPreferences {
  return {
    license_reminder: saved.license_reminder ?? true,
    publish: saved.publish ?? true,
    closure_created: saved.closure_created ?? true,
  };
}

export function isNotificationKind(value: unknown): value is NotificationKind {
  return (NOTIFICATION_KINDS as readonly unknown[]).includes(value);
}
