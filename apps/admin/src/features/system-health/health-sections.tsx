import {
  type BackupRun,
  daysUntil,
  diskPercent,
  formatBytes,
  HEALTH_THRESHOLDS,
  isServiceUp,
  type ServerReport,
} from '@indoor/domain';
import {
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import type { ReactNode } from 'react';
import { date, dateTime, serviceStateText } from './health-text';

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

export function Services({ report }: { report: ServerReport }) {
  if (report.services.length === 0) return <span className="text-ink-muted">Tidak terbaca</span>;
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
      {report.services.map((service) => (
        <li key={service.name} className="flex items-center gap-2">
          <StatusDot tone={isServiceUp(service) ? 'ok' : 'danger'}>
            <span className="font-mono">{service.name}</span>
          </StatusDot>
          <span className="text-ink-muted text-sm">
            {serviceStateText(service.state, service.health)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Disks({ report }: { report: ServerReport }) {
  if (report.disks.length === 0) return <span className="text-ink-muted">Tidak terbaca</span>;
  return (
    <ul className="grid gap-1">
      {report.disks.map((disk) => {
        const percent = diskPercent(disk);
        return (
          <li key={disk.path}>
            <StatusDot tone={percent > HEALTH_THRESHOLDS.diskPercent ? 'danger' : 'ok'}>
              {percent}% terpakai
            </StatusDot>{' '}
            <span className="text-ink-muted text-sm">
              {formatBytes(disk.usedBytes)} dari {formatBytes(disk.totalBytes)} ·{' '}
              <span className="font-mono">{disk.path}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Certificate({ report, nowMs }: { report: ServerReport; nowMs: number }) {
  if (!report.certExpiresAt) {
    return <span className="text-ink-muted">Tidak terbaca dari gateway HTTPS</span>;
  }
  const days = daysUntil(report.certExpiresAt, nowMs);
  return (
    <StatusDot tone={days < HEALTH_THRESHOLDS.certDays ? 'danger' : 'ok'}>
      {report.certDomain ? <span className="font-mono">{report.certDomain}</span> : null} berakhir{' '}
      {date.format(new Date(report.certExpiresAt))} (
      {days >= 0 ? `sisa ${days} hari` : 'sudah lewat'})
    </StatusDot>
  );
}

export function LastBackup({
  backups,
  lastOkAt,
}: {
  backups: BackupRun[];
  lastOkAt: string | null;
}) {
  const [latest] = backups;
  if (!latest) return <span className="text-ink-muted">Belum ada backup tercatat</span>;
  return (
    <div className="grid gap-0.5">
      <StatusDot tone={latest.ok ? 'ok' : 'danger'}>
        {latest.ok ? 'Berhasil' : 'Gagal'} · {dateTime.format(new Date(latest.finishedAt))}
      </StatusDot>
      {latest.ok ? null : (
        <span className="text-ink-muted text-sm">
          {latest.message ?? 'Tanpa keterangan'}
          {' · '}
          {lastOkAt
            ? `berhasil terakhir ${dateTime.format(new Date(lastOkAt))}`
            : 'belum pernah berhasil'}
        </span>
      )}
    </div>
  );
}

export function BackupHistory({ backups }: { backups: BackupRun[] }) {
  if (backups.length === 0) return null;
  return (
    <section className="grid max-w-3xl gap-2">
      <h2 className="font-bold text-lg">Riwayat backup</h2>
      <Table aria-label="Riwayat backup">
        <TableHeader>
          <TableRow>
            <TableHead>Selesai</TableHead>
            <TableHead>Hasil</TableHead>
            <TableHead>Keterangan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups.map((run) => (
            <TableRow key={`${run.finishedAt}-${run.ok}-${run.message ?? ''}`}>
              <TableCell className="font-mono">
                {dateTime.format(new Date(run.finishedAt))}
              </TableCell>
              <TableCell>
                <StatusDot tone={run.ok ? 'ok' : 'danger'}>
                  {run.ok ? 'Berhasil' : 'Gagal'}
                </StatusDot>
              </TableCell>
              <TableCell className="text-ink-muted">{run.message ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
