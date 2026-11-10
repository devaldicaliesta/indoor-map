import { z } from 'zod';

/**
 * Ambang peringatan Kesehatan sistem. Email dan daftar peringatan diputuskan database
 * (`app.health_conditions`, migrasi 0061) dengan angka yang sama; di sini untuk teks dan tampilan.
 */
export const HEALTH_THRESHOLDS = {
  /** Disk di atas persentase ini memicu peringatan. */
  diskPercent: 85,
  /** Sertifikat yang berakhir kurang dari sekian hari lagi memicu peringatan. */
  certDays: 14,
  /** Backup gagal sekian kali berturut-turut memicu peringatan. */
  backupFailures: 2,
  /** Agen melapor tiap 15 menit; dua laporan terlewat berarti agen atau cron bermasalah. */
  reportStaleMinutes: 30,
} as const;

export const HEALTH_ALERT_KINDS = ['backup_failed', 'disk_high', 'cert_expiring'] as const;
export type HealthAlertKind = (typeof HEALTH_ALERT_KINDS)[number];

export interface HealthAlert {
  kind: HealthAlertKind;
  details: Record<string, unknown>;
}

export interface ServiceStatus {
  name: string;
  /** Keadaan kontainer dari `docker compose ps`, mis. `running`, `exited`, `restarting`. */
  state: string;
  /** `healthy`, `unhealthy`, `starting`, atau kosong bila layanan tanpa health check. */
  health: string;
}

export interface DiskUsage {
  path: string;
  totalBytes: number;
  usedBytes: number;
}

export interface ServerReport {
  reportedAt: string;
  appVersion: string | null;
  services: ServiceStatus[];
  disks: DiskUsage[];
  certDomain: string | null;
  certExpiresAt: string | null;
}

export interface BackupRun {
  finishedAt: string;
  ok: boolean;
  message: string | null;
}

export interface SystemHealth {
  checkedAt: string;
  /** `null` bila agen di server belum pernah melapor (mis. instalasi lama, hosting). */
  report: ServerReport | null;
  /** 10 backup terakhir, terbaru lebih dulu. */
  backups: BackupRun[];
  lastBackupOkAt: string | null;
  licenseCheckinAt: string | null;
  alerts: HealthAlert[];
}

const DAY_MS = 86_400_000;

export function diskPercent(disk: DiskUsage): number {
  return disk.totalBytes > 0 ? Math.floor((disk.usedBytes / disk.totalBytes) * 100) : 0;
}

/** Sisa hari penuh sampai `iso`; negatif bila sudah lewat. */
export function daysUntil(iso: string, nowMs: number): number {
  return Math.floor((Date.parse(iso) - nowMs) / DAY_MS);
}

export function isReportStale(report: ServerReport, nowMs: number): boolean {
  return nowMs - Date.parse(report.reportedAt) > HEALTH_THRESHOLDS.reportStaleMinutes * 60_000;
}

/** Layanan berjalan dan tidak dilaporkan tidak sehat oleh health check-nya. */
export function isServiceUp(service: ServiceStatus): boolean {
  return service.state === 'running' && service.health !== 'unhealthy';
}

/** Ukuran berkas/disk yang mudah dibaca (basis 1024), mis. "250 GB". */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 10 || unit === 0 ? 0 : 1;
  return `${value.toLocaleString('id-ID', { maximumFractionDigits: digits })} ${units[unit]}`;
}

// Bentuk jawaban `public.system_health()` (snake_case, migrasi 0061).
const ReportRowSchema = z.object({
  reported_at: z.string(),
  app_version: z.string().nullable(),
  services: z.array(z.object({ name: z.string(), state: z.string(), health: z.string() })),
  disks: z.array(z.object({ path: z.string(), total_bytes: z.number(), used_bytes: z.number() })),
  cert_domain: z.string().nullable(),
  cert_expires_at: z.string().nullable(),
});

export const SystemHealthRowSchema = z
  .object({
    checked_at: z.string(),
    report: ReportRowSchema.nullable(),
    backups: z.array(
      z.object({ finished_at: z.string(), ok: z.boolean(), message: z.string().nullable() }),
    ),
    last_backup_ok_at: z.string().nullable(),
    license_checkin_at: z.string().nullable(),
    alerts: z.array(
      z.object({ kind: z.enum(HEALTH_ALERT_KINDS), details: z.record(z.string(), z.unknown()) }),
    ),
  })
  .transform(
    (row): SystemHealth => ({
      checkedAt: row.checked_at,
      report: row.report && {
        reportedAt: row.report.reported_at,
        appVersion: row.report.app_version,
        services: row.report.services,
        disks: row.report.disks.map((d) => ({
          path: d.path,
          totalBytes: d.total_bytes,
          usedBytes: d.used_bytes,
        })),
        certDomain: row.report.cert_domain,
        certExpiresAt: row.report.cert_expires_at,
      },
      backups: row.backups.map((b) => ({
        finishedAt: b.finished_at,
        ok: b.ok,
        message: b.message,
      })),
      lastBackupOkAt: row.last_backup_ok_at,
      licenseCheckinAt: row.license_checkin_at,
      alerts: row.alerts,
    }),
  );
