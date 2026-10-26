import type { LicenseDetails } from '@indoor/data';
import {
  daysRemaining,
  FEATURE_LABELS,
  isQuotaFull,
  LIMIT_KINDS,
  LIMIT_LABELS,
  type LicenseLimits,
  type PaidFeature,
  QUOTA_LABELS,
  type QuotaUsage,
  quotaReachedPrefix,
} from '@indoor/domain';
import { isTrialLicense } from '@indoor/domain/license';
import {
  Button,
  type DataColumn,
  DataTable,
  type FilterDef,
  queryRows,
  Skeleton,
  StatusDot,
  toast,
} from '@indoor/ui';
import { Link } from 'react-router';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useTableState } from '../../hooks/use-table-state';
import { FormNotice } from '../auth/auth-layout';
import { useCheckIn, useLicenseDetails, useLicenseLimits, useLicenseUsage } from './queries';
import { VendorEmail } from './vendor-email';

const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

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
        ? license.features.map((f) => FEATURE_LABELS[f as PaidFeature] ?? f).join(', ')
        : 'Fitur dasar',
    ],
    [
      'Check-in terakhir',
      details.lastCheckinAt
        ? dateTime.format(new Date(details.lastCheckinAt))
        : 'Belum pernah berhasil',
    ],
    ['Kontak vendor', <VendorEmail />],
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

type UsageState = 'tersedia' | 'penuh' | 'melebihi' | 'bebas';

function usageState(usage: QuotaUsage): UsageState {
  if (usage.quota === null) return 'bebas';
  if (usage.used > usage.quota) return 'melebihi';
  return isQuotaFull(usage) ? 'penuh' : 'tersedia';
}

const USAGE_FILTERS: FilterDef[] = [
  {
    kind: 'multi',
    key: 'status',
    label: 'Status kuota',
    options: [
      { value: 'tersedia', label: 'Masih tersedia' },
      { value: 'penuh', label: 'Penuh' },
      { value: 'melebihi', label: 'Melebihi paket' },
      { value: 'bebas', label: 'Tanpa batas' },
    ],
  },
];

/** Keterangan pemakaian yang dihitung terbanyak, bukan total. */
const USAGE_HINTS: Partial<Record<QuotaUsage['kind'], string>> = {
  features: 'lantai terpadat',
  publishPerDay: 'terbanyak hari ini',
};

const usageColumns = (trial: boolean): DataColumn<QuotaUsage>[] => [
  {
    id: 'kind',
    header: 'Kuota',
    cell: (u) => (
      <>
        {QUOTA_LABELS[u.kind]}
        {USAGE_HINTS[u.kind] ? (
          <span className="block text-ink-muted text-sm">{USAGE_HINTS[u.kind]}</span>
        ) : null}
      </>
    ),
  },
  {
    id: 'used',
    header: 'Pemakaian',
    className: 'text-right font-mono',
    cell: (u) => `${u.used}/${u.quota ?? '–'}`,
  },
  {
    id: 'share',
    header: 'Terpakai',
    className: 'w-1/2 whitespace-normal',
    cell: (u) => {
      const share = u.quota ? Math.min(1, u.used / u.quota) : 0;
      const full = isQuotaFull(u);
      return (
        <>
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
          {u.quota !== null && u.used > u.quota ? (
            <span className="text-sm">
              Melebihi paket: kurangi {u.used - u.quota} {QUOTA_LABELS[u.kind].toLowerCase()} agar
              bisa menambah data dan publish lagi.
            </span>
          ) : full ? (
            <span className="text-sm">{quotaReachedPrefix(trial)}</span>
          ) : null}
        </>
      );
    },
  },
];

function UsageTable({ usage, trial }: { usage: QuotaUsage[]; trial: boolean }) {
  const table = useTableState({ filters: USAGE_FILTERS });
  const result = queryRows(usage, table.state, {
    text: (u) => [QUOTA_LABELS[u.kind]],
    filters: { status: (u, values) => values.includes(usageState(u)) },
  });
  return (
    <div className="max-w-3xl">
      <DataTable
        label="Kuota lisensi"
        columns={usageColumns(trial)}
        rows={result.rows}
        rowKey={(u) => u.kind}
        total={result.total}
        table={table}
        search={{ placeholder: 'Cari jenis kuota' }}
        filters={USAGE_FILTERS}
        empty={<p className="text-ink-muted">Lisensi ini tidak membatasi kuota apa pun.</p>}
      />
    </div>
  );
}

/** Lisensi komponen sumber terbuka di dalam Admin; berkasnya dibuat saat build. */
function OpenSourceNotice() {
  return (
    <section aria-labelledby="open-source" className="grid max-w-3xl gap-1">
      <h2 id="open-source" className="font-bold">
        Komponen sumber terbuka
      </h2>
      <p className="text-ink-muted text-sm">
        PanduArah memakai komponen sumber terbuka dengan lisensinya masing-masing.{' '}
        <a
          href="/third-party-notices.txt"
          target="_blank"
          rel="noopener"
          className="font-bold text-ink underline underline-offset-4"
        >
          Lihat pemberitahuan pihak ketiga
        </a>
      </p>
    </section>
  );
}

/** Batas per tindakan: tidak punya pemakaian berjalan, diperiksa setiap unggahan dan impor. */
function ActionLimits({ limits }: { limits: LicenseLimits }) {
  return (
    <section aria-labelledby="action-limits" className="grid max-w-3xl gap-2">
      <h2 id="action-limits" className="font-bold">
        Batas per tindakan
      </h2>
      <dl className="grid gap-1 sm:grid-cols-2">
        {LIMIT_KINDS.map((kind) => (
          <div key={kind} className="flex justify-between gap-4 border-line border-b py-1">
            <dt>{LIMIT_LABELS[kind]}</dt>
            <dd className="font-mono">{limits[kind] ?? 'Tanpa batas'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LicenseContent() {
  const details = useLicenseDetails();
  const usage = useLicenseUsage();
  const limits = useLicenseLimits();
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
      {isTrialLicense(details.data.license) ? (
        <FormNotice tone="info">
          Lisensi trial: data dibatasi agar server tidak berat. Pasang lisensi berbayar untuk
          mengangkat batas; semua data trial tetap ada.
        </FormNotice>
      ) : null}
      <UsageTable usage={usage.data} trial={isTrialLicense(details.data.license)} />
      {limits.data ? <ActionLimits limits={limits.data} /> : null}
      <OpenSourceNotice />
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
