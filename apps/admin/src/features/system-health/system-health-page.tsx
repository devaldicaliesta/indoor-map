import { isReportStale, isServiceUp, type ModuleAccess, type SystemHealth } from '@indoor/domain';
import { Button, Skeleton } from '@indoor/ui';
import { RefreshCwIcon } from 'lucide-react';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { FormNotice } from '../auth/auth-layout';
import { BackupHistory, Certificate, Disks, LastBackup, Row, Services } from './health-sections';
import { alertText, dateTime } from './health-text';
import { useSystemHealth } from './queries';

/** Peringatan di atas halaman: keputusan database + keadaan yang terlihat dari laporan. */
function problems(health: SystemHealth, nowMs: number): string[] {
  const list = health.alerts.map(alertText);
  const { report } = health;
  if (!report) return list;
  if (isReportStale(report, nowMs)) {
    list.push(
      `Laporan server terakhir ${dateTime.format(new Date(report.reportedAt))}. Periksa jadwal cron health-report.sh di server.`,
    );
  }
  const down = report.services.filter((service) => !isServiceUp(service));
  if (down.length > 0) {
    list.push(`Layanan bermasalah: ${down.map((service) => service.name).join(', ')}.`);
  }
  return list;
}

function HealthBody({ health }: { health: SystemHealth }) {
  // Jam server, bukan jam peramban, agar sisa hari dan "basi" tidak bergantung komputer pengguna.
  const nowMs = Date.parse(health.checkedAt);
  const issues = problems(health, nowMs);
  const { report } = health;
  return (
    <div className="grid gap-6">
      {issues.length > 0 ? (
        <ul aria-label="Peringatan" className="grid max-w-3xl gap-2">
          {issues.map((issue) => (
            <li key={issue}>
              <FormNotice tone="error">{issue}</FormNotice>
            </li>
          ))}
        </ul>
      ) : report ? (
        <FormNotice tone="info">Semua pemeriksaan normal.</FormNotice>
      ) : null}
      {report ? null : (
        <FormNotice tone="info">
          Agen kesehatan di server belum pernah melapor. Di server instalasi jalankan{' '}
          <code className="font-mono">sudo /opt/panduarah/health-report.sh --pasang-jadwal</code>{' '}
          lalu <code className="font-mono">sudo /opt/panduarah/health-report.sh</code>.
        </FormNotice>
      )}
      <dl className="grid max-w-3xl grid-cols-[12rem_1fr] gap-x-4 gap-y-3 rounded-md border border-line bg-surface p-4">
        {report ? (
          <>
            <Row label="Layanan">
              <Services report={report} />
            </Row>
            <Row label="Versi aplikasi">
              <span className="font-mono">{report.appVersion ?? '—'}</span>
            </Row>
            <Row label="Ruang disk">
              <Disks report={report} />
            </Row>
            <Row label="Sertifikat HTTPS">
              <Certificate report={report} nowMs={nowMs} />
            </Row>
          </>
        ) : null}
        <Row label="Backup terakhir">
          <LastBackup backups={health.backups} lastOkAt={health.lastBackupOkAt} />
        </Row>
        <Row label="Check-in lisensi terakhir">
          {health.licenseCheckinAt ? (
            dateTime.format(new Date(health.licenseCheckinAt))
          ) : (
            <span className="text-ink-muted">Belum pernah</span>
          )}
        </Row>
        {report ? (
          <Row label="Laporan server">{dateTime.format(new Date(report.reportedAt))}</Row>
        ) : null}
      </dl>
      <BackupHistory backups={health.backups} />
    </div>
  );
}

// Data diminta hanya setelah ModuleRoute memastikan role-nya Super Admin.
function HealthModule({ access }: { access: ModuleAccess }) {
  const health = useSystemHealth();
  return (
    <ModulePage
      module="system_health"
      access={access}
      actions={
        <Button onClick={() => void health.refetch()} disabled={health.isFetching}>
          <RefreshCwIcon strokeWidth={1.75} />
          Muat ulang
        </Button>
      }
    >
      {health.isPending ? <Skeleton className="h-80 max-w-3xl" /> : null}
      {health.error ? <FormNotice tone="error">{health.error.message}</FormNotice> : null}
      {health.data ? <HealthBody health={health.data} /> : null}
    </ModulePage>
  );
}

export function SystemHealthPage() {
  return (
    <ModuleRoute module="system_health">{(access) => <HealthModule access={access} />}</ModuleRoute>
  );
}
