import {
  hasUnpublishedChanges,
  LOCATION_STATUSES,
  type VenueDashboard,
  type VenueId,
} from '@indoor/domain';
import { Button, EmptyState, Skeleton, StatusDot } from '@indoor/ui';
import { ArrowUpRightIcon, RefreshCwIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useCan } from '../../app/auth/can';
import { inVenueTime } from '../../app/format';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { useVenueTimezone } from '../closures/queries';
import { LOCATION_STATUS_LABELS, LOCATION_STATUS_TONE } from '../locations/labels';
import { LOCATION_FILTER, UNLINKED_FILTER } from '../locations/location-table';
import { useDashboardFindings, useVenueDashboard } from './queries';
import { DASHBOARD_TOUR } from './tour';

const number = new Intl.NumberFormat('id-ID');

function Section({
  title,
  link,
  children,
  tour,
}: {
  title: string;
  link?: { to: string; label: string };
  children: ReactNode;
  tour?: string;
}) {
  return (
    <section
      aria-label={title}
      data-tour={tour}
      className="grid content-start gap-3 rounded-md border border-line bg-surface p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-bold">{title}</h2>
        {link ? (
          <Link
            to={link.to}
            className="inline-flex items-center gap-1 font-bold text-sm underline-offset-4 hover:underline"
          >
            {link.label}
            <ArrowUpRightIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Figure({
  label,
  value,
  to,
  testId,
}: {
  label: ReactNode;
  value: number;
  to?: string;
  testId: string;
}) {
  const body = (
    <>
      <span className="text-ink-muted text-sm">{label}</span>
      <span className="font-bold font-mono text-2xl tabular-nums" data-testid={testId}>
        {number.format(value)}
      </span>
    </>
  );
  return to ? (
    <Link to={to} className="grid gap-1 rounded-sm p-1 hover:bg-canvas">
      {body}
    </Link>
  ) : (
    <div className="grid gap-1 p-1">{body}</div>
  );
}

function LocationsSection({ dashboard }: { dashboard: VenueDashboard }) {
  return (
    <Section
      title="Lokasi"
      link={{ to: '/locations', label: 'Buka Lokasi' }}
      tour="dashboard-locations"
    >
      <Figure label="Semua lokasi" value={dashboard.locationsTotal} testId="locations-total" />
      <div className="grid grid-cols-2 gap-2">
        {LOCATION_STATUSES.map((status) => (
          <Figure
            key={status}
            label={
              <StatusDot
                tone={LOCATION_STATUS_TONE[status].tone}
                hollow={LOCATION_STATUS_TONE[status].hollow}
              >
                {LOCATION_STATUS_LABELS[status]}
              </StatusDot>
            }
            value={dashboard.locationStatuses[status]}
            to={`/locations?${LOCATION_FILTER.status}=${status}`}
            testId={`status-${status}`}
          />
        ))}
      </div>
    </Section>
  );
}

function CompletenessSection({ dashboard }: { dashboard: VenueDashboard }) {
  return (
    <Section title="Kelengkapan data" tour="dashboard-completeness">
      <div className="grid grid-cols-2 gap-2">
        <Figure
          label="Lokasi tanpa unit"
          value={dashboard.locationsWithoutUnit}
          to={`/locations?${LOCATION_FILTER.link}=${UNLINKED_FILTER}`}
          testId="locations-without-unit"
        />
        <Figure
          label={`Unit tanpa lokasi (dari ${number.format(dashboard.unitsTotal)} unit)`}
          value={dashboard.unitsWithoutLocation}
          to="/map-editor"
          testId="units-without-location"
        />
      </div>
      <p className="text-ink-muted text-sm">
        Lokasi tanpa unit tidak tampil di peta Visitor. Unit tanpa lokasi tampil tanpa nama.
      </p>
    </Section>
  );
}

function ValidationSection({ venueId }: { venueId: VenueId }) {
  const allowed = useCan('publish.validate');
  const findings = useDashboardFindings(venueId, allowed);
  const errors = findings.data?.filter((f) => f.severity === 'error').length ?? 0;
  const warnings = (findings.data?.length ?? 0) - errors;
  let body: ReactNode;
  if (!allowed) {
    body = (
      <p className="text-ink-muted">Validasi publish dijalankan Editor, Admin, atau Super Admin.</p>
    );
  } else if (findings.isPending) {
    body = <Skeleton className="h-12 w-full" />;
  } else if (findings.error) {
    body = (
      <div role="alert" className="grid justify-items-start gap-2">
        <p className="text-ink-muted">Validasi tidak bisa dijalankan: {findings.error.message}</p>
        <Button size="sm" onClick={() => void findings.refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  } else {
    body = (
      <>
        <div className="grid grid-cols-2 gap-2">
          <Figure
            label={<StatusDot tone="danger">Error</StatusDot>}
            value={errors}
            testId="findings-errors"
          />
          <Figure
            label={<StatusDot tone="warn">Peringatan</StatusDot>}
            value={warnings}
            testId="findings-warnings"
          />
        </div>
        <p className="text-ink-muted text-sm">
          {errors > 0
            ? 'Draft belum bisa diterbitkan sampai semua Error diperbaiki.'
            : 'Draft lolos validasi dan siap diterbitkan.'}
        </p>
      </>
    );
  }
  return (
    <Section
      title="Validasi publish"
      link={{ to: '/publish', label: 'Buka Publish' }}
      tour="dashboard-validation"
    >
      {body}
    </Section>
  );
}

function PublicationSection({
  dashboard,
  timezone,
}: {
  dashboard: VenueDashboard;
  timezone: string;
}) {
  const publication = dashboard.publication;
  const pending = hasUnpublishedChanges(dashboard);
  return (
    <Section title="Versi terbit" link={{ to: '/publish', label: 'Riwayat versi' }}>
      {publication ? (
        <div className="grid gap-1">
          <p className="font-bold font-mono text-2xl tabular-nums" data-testid="published-version">
            v{publication.version}
          </p>
          <p className="text-ink-muted text-sm">
            {publication.origin === 'rollback' && publication.sourceVersion
              ? `Rollback ke v${publication.sourceVersion}, `
              : ''}
            {inVenueTime(publication.publishedAt, timezone)}
            {publication.publishedBy ? ` oleh ${publication.publishedBy}` : ''}
          </p>
        </div>
      ) : (
        <p className="text-ink-muted" data-testid="published-version">
          Belum pernah diterbitkan.
        </p>
      )}
      {pending ? (
        <StatusDot tone="warn" hollow>
          Ada perubahan draft yang belum diterbitkan
        </StatusDot>
      ) : null}
    </Section>
  );
}

function OperationsSection({ dashboard }: { dashboard: VenueDashboard }) {
  return (
    <Section title="Operasional">
      <div className="grid grid-cols-3 gap-2">
        <Figure
          label="Penutupan aktif"
          value={dashboard.closuresActive}
          to="/closures"
          testId="closures-active"
        />
        <Figure
          label="Penutupan terjadwal"
          value={dashboard.closuresScheduled}
          to="/closures"
          testId="closures-scheduled"
        />
        <Figure
          label="Info Point"
          value={dashboard.infoPoints}
          to="/origin-points"
          testId="info-points"
        />
      </div>
    </Section>
  );
}

function Dashboard({ venueId }: { venueId: VenueId }) {
  const dashboard = useVenueDashboard(venueId);
  const timezone = useVenueTimezone(venueId);
  if (dashboard.error) {
    return (
      <div role="alert" className="grid justify-items-start gap-2 border-danger border-l-4 p-4">
        <p className="font-bold">Dasbor tidak bisa dimuat.</p>
        <p className="text-ink-muted">{dashboard.error.message}</p>
        <Button onClick={() => void dashboard.refetch()}>Coba lagi</Button>
      </div>
    );
  }
  if (!dashboard.data) {
    return (
      <div className="grid grid-cols-3 gap-4" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4" data-testid="venue-dashboard">
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={dashboard.isFetching}
          onClick={() => void dashboard.refetch()}
          data-tour="dashboard-refresh"
        >
          <RefreshCwIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
          Muat ulang
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <LocationsSection dashboard={dashboard.data} />
        <CompletenessSection dashboard={dashboard.data} />
        <ValidationSection venueId={venueId} />
        <PublicationSection dashboard={dashboard.data} timezone={timezone} />
        <OperationsSection dashboard={dashboard.data} />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="dashboard">
      {(access) => (
        <ModulePage module="dashboard" access={access} tour={DASHBOARD_TOUR}>
          {venue ? (
            <Dashboard key={venue.id} venueId={venue.id} />
          ) : (
            <EmptyState
              title="Belum ada venue"
              description="Buat venue pertama di menu Venue. Ringkasan venue tampil di sini setelahnya."
            />
          )}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
