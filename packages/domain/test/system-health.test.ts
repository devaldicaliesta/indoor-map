import { describe, expect, it } from 'vitest';
import {
  daysUntil,
  diskPercent,
  formatBytes,
  HEALTH_THRESHOLDS,
  isReportStale,
  isServiceUp,
  type ServerReport,
  SystemHealthRowSchema,
} from '../src';

const NOW = Date.parse('2026-11-09T10:00:00Z');

const report = (reportedAt: string): ServerReport => ({
  reportedAt,
  appVersion: '1.4.0',
  services: [],
  disks: [],
  certDomain: null,
  certExpiresAt: null,
});

describe('HEALTH_THRESHOLDS', () => {
  it('sama dengan aturan peringatan di database (migrasi 0061) dan TC-OPS-17', () => {
    expect(HEALTH_THRESHOLDS).toEqual({
      diskPercent: 85,
      certDays: 14,
      backupFailures: 2,
      reportStaleMinutes: 30,
    });
  });
});

describe('diskPercent', () => {
  it('dibulatkan ke bawah seperti di database', () => {
    expect(diskPercent({ path: '/', totalBytes: 1000, usedBytes: 859 })).toBe(85);
    expect(diskPercent({ path: '/', totalBytes: 1000, usedBytes: 860 })).toBe(86);
  });

  it('disk tanpa ukuran dianggap 0%', () => {
    expect(diskPercent({ path: '/', totalBytes: 0, usedBytes: 0 })).toBe(0);
  });
});

describe('daysUntil', () => {
  it('menghitung hari penuh yang tersisa', () => {
    expect(daysUntil('2026-11-23T09:00:00Z', NOW)).toBe(13);
    expect(daysUntil('2026-11-23T10:00:00Z', NOW)).toBe(14);
    expect(daysUntil('2026-11-08T10:00:00Z', NOW)).toBe(-1);
  });
});

describe('isReportStale', () => {
  it('laporan lebih dari 30 menit lalu dianggap basi', () => {
    expect(isReportStale(report('2026-11-09T09:31:00Z'), NOW)).toBe(false);
    expect(isReportStale(report('2026-11-09T09:29:00Z'), NOW)).toBe(true);
  });
});

describe('isServiceUp', () => {
  it('berjalan dan tidak unhealthy', () => {
    expect(isServiceUp({ name: 'db', state: 'running', health: 'healthy' })).toBe(true);
    expect(isServiceUp({ name: 'web', state: 'running', health: '' })).toBe(true);
    expect(isServiceUp({ name: 'db', state: 'running', health: 'unhealthy' })).toBe(false);
    expect(isServiceUp({ name: 'auth', state: 'exited', health: '' })).toBe(false);
    expect(isServiceUp({ name: 'rest', state: 'restarting', health: '' })).toBe(false);
  });
});

describe('formatBytes', () => {
  it('memakai satuan yang mudah dibaca', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1,5 KB');
    expect(formatBytes(268_435_456_000)).toBe('250 GB');
  });
});

describe('SystemHealthRowSchema', () => {
  it('jawaban database menjadi tipe domain', () => {
    const health = SystemHealthRowSchema.parse({
      checked_at: '2026-11-09T10:00:00Z',
      report: {
        reported_at: '2026-11-09T09:50:00Z',
        app_version: '1.4.0',
        services: [{ name: 'db', state: 'running', health: 'healthy' }],
        disks: [{ path: '/var/lib/docker', total_bytes: 100, used_bytes: 90 }],
        cert_domain: 'admin.rs.test',
        cert_expires_at: '2026-11-20T00:00:00Z',
      },
      backups: [{ finished_at: '2026-11-09T02:31:00Z', ok: false, message: 'disk penuh' }],
      last_backup_ok_at: null,
      license_checkin_at: '2026-11-08T03:00:00Z',
      alerts: [{ kind: 'disk_high', details: { path: '/var/lib/docker', percent: 90 } }],
    });
    expect(health.report?.disks).toEqual([
      { path: '/var/lib/docker', totalBytes: 100, usedBytes: 90 },
    ]);
    expect(health.backups[0]).toEqual({
      finishedAt: '2026-11-09T02:31:00Z',
      ok: false,
      message: 'disk penuh',
    });
    expect(health.alerts[0]?.kind).toBe('disk_high');
  });

  it('tanpa laporan agen tetap sah; jenis peringatan lain ditolak', () => {
    const base = {
      checked_at: '2026-11-09T10:00:00Z',
      report: null,
      backups: [],
      last_backup_ok_at: null,
      license_checkin_at: null,
      alerts: [],
    };
    expect(SystemHealthRowSchema.parse(base).report).toBeNull();
    expect(
      SystemHealthRowSchema.safeParse({ ...base, alerts: [{ kind: 'lain', details: {} }] }).success,
    ).toBe(false);
  });
});
