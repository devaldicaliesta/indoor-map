import type { LicenseDetails } from '@indoor/data';
import { daysRemaining, isQuotaFull, QUOTA_LABELS, type QuotaUsage } from '@indoor/domain';
import {
  Button,
  Skeleton,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@indoor/ui';
import { Link } from 'react-router';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { FormNotice } from '../auth/auth-layout';
import { useCheckIn, useLicenseDetails, useLicenseUsage } from './queries';

const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

const FEATURE_LABELS: Record<string, string> = { '3d': 'Tampilan 3D', info_point: 'Info Point' };
const CHECKIN_RESULTS = {
  renewed: 'Lisensi baru dari vendor dipasang.',
  unchanged: 'Lisensi sudah yang terbaru.',
  revoked: 'Vendor mencabut lisensi ini.',
} as const;

function CheckInButton() {
  const checkIn = useCheckIn();
  return (
    <Button
      variant="primary"
      disabled={checkIn.isPending}
      onClick={() =>
        checkIn.mutate(undefined, {
          onSuccess: (reply) =>
            reply.result === 'failed'
              ? toast.error('Check-in gagal', { description: reply.message })
              : toast.success('Check-in selesai', { description: CHECKIN_RESULTS[reply.result] }),
          onError: (error) => toast.error('Check-in gagal', { description: error.message }),
        })
      }
    >
      {checkIn.isPending ? 'Menghubungi vendor…' : 'Periksa sekarang'}
    </Button>
  );
}

function Summary({ details }: { details: LicenseDetails }) {
  const { license } = details;
  const days = daysRemaining(license.validUntil, new Date());
  const rows: [string, React.ReactNode][] = [
    ['Klien', license.client],
    ['Paket', license.plan],
    ['ID lisensi', <span className="font-mono">{license.licenseId}</span>],
    [
      'Masa berlaku',
      `${date.format(new Date(license.validFrom))} – ${date.format(new Date(license.validUntil))}`,
    ],
    [
      'Sisa hari',
      <span className="flex items-center gap-2">
        <StatusDot tone={days > 30 ? 'ok' : days > 0 ? 'warn' : 'danger'} />
        {days > 0 ? `${days} hari` : 'Sudah berakhir'}
      </span>,
    ],
    [
      'Fitur',
      license.features.length
        ? license.features.map((f) => FEATURE_LABELS[f] ?? f).join(', ')
        : 'Fitur dasar',
    ],
    [
      'Check-in terakhir',
      details.lastCheckinAt
        ? dateTime.format(new Date(details.lastCheckinAt))
        : 'Belum pernah berhasil',
    ],
  ];
  return (
    <dl className="grid max-w-3xl grid-cols-[12rem_1fr] gap-x-4 gap-y-2 rounded-md border border-line bg-surface p-4">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-ink-muted">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function UsageTable({ usage }: { usage: QuotaUsage[] }) {
  return (
    <Table className="max-w-3xl">
      <TableHeader>
        <TableRow>
          <TableHead>Kuota</TableHead>
          <TableHead className="text-right">Pemakaian</TableHead>
          <TableHead className="w-1/2">Terpakai</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usage.map((u) => {
          const share = u.quota ? Math.min(1, u.used / u.quota) : 0;
          const full = isQuotaFull(u);
          return (
            <TableRow key={u.kind}>
              <TableCell>{QUOTA_LABELS[u.kind]}</TableCell>
              <TableCell className="text-right font-mono">
                {u.used}/{u.quota ?? '–'}
              </TableCell>
              <TableCell>
                <div
                  // Angka di kolom Pemakaian sudah dibacakan; bar hanya visual.
                  aria-hidden="true"
                  className="h-2 rounded-sm bg-canvas"
                >
                  <div
                    className={full ? 'h-2 rounded-sm bg-danger' : 'h-2 rounded-sm bg-ink'}
                    style={{ width: `${share * 100}%` }}
                  />
                </div>
                {full ? <span className="text-sm">Kuota paket tercapai</span> : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function LicenseContent() {
  const details = useLicenseDetails();
  const usage = useLicenseUsage();
  if (details.isPending || usage.isPending) return <Skeleton className="h-64 max-w-3xl" />;
  if (details.error) return <FormNotice tone="error">{details.error.message}</FormNotice>;
  if (usage.error) return <FormNotice tone="error">{usage.error.message}</FormNotice>;
  if (!details.data) {
    return (
      <FormNotice tone="info">
        Belum ada lisensi berlaku.{' '}
        <Link to="/aktivasi" className="font-bold underline">
          Pasang lisensi
        </Link>
      </FormNotice>
    );
  }
  return (
    <div className="grid gap-6">
      {details.data.checkinError ? (
        <FormNotice tone="error">Check-in terakhir gagal: {details.data.checkinError}</FormNotice>
      ) : null}
      <Summary details={details.data} />
      <UsageTable usage={usage.data} />
    </div>
  );
}

export function LicensePage() {
  return (
    <ModuleRoute module="license">
      {(access) => (
        <ModulePage
          module="license"
          access={access}
          actions={
            <>
              <Button asChild>
                <Link to="/aktivasi">Pasang lisensi baru</Link>
              </Button>
              <CheckInButton />
            </>
          }
        >
          <LicenseContent />
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
