import type { EventListState } from '@indoor/data';
import {
  EVENT_KIND_LABELS,
  EVENT_KINDS,
  EVENT_PHASE_LABELS,
  type EventKind,
  eventPhase,
  eventTitle,
  lockedFeatureMessage,
  type VenueEvent,
  type VenueSummary,
} from '@indoor/domain';
import {
  Badge,
  Button,
  type DataColumn,
  DataTable,
  dateRangeOf,
  EmptyState,
  type FilterDef,
  StatusDot,
  toast,
} from '@indoor/ui';
import { useState } from 'react';
import { useCan } from '../../app/auth/can';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { useTableState } from '../../hooks/use-table-state';
import { FormNotice } from '../auth/auth-layout';
import { useVenueTimezone } from '../closures/queries';
import { useNow } from '../editor/graph/graph-status';
import { useFeature } from '../license/queries';
import { scheduleText } from './event-card';
import { EventDialog } from './event-dialog';
import {
  EVENTS_REFRESH_MS,
  useEventMutations,
  useEventPage,
  useVenueLocationNames,
} from './queries';

const STATE_LABELS: Record<EventListState, string> = {
  draft: 'Draf',
  current: 'Berlangsung atau akan datang',
  ended: 'Selesai',
};
const STATES = Object.keys(STATE_LABELS) as EventListState[];
const isState = (value: string): value is EventListState => value in STATE_LABELS;
const isKind = (value: string): value is EventKind =>
  (EVENT_KINDS as readonly string[]).includes(value);

const PHASE_TONE = {
  draft: 'neutral',
  live: 'ok',
  upcoming: 'warn',
  ended: 'neutral',
} as const;

function Events({ venue }: { venue: VenueSummary }) {
  const canEdit = useCan('event.edit');
  const allowed = useFeature('events');
  const timezone = useVenueTimezone(venue.id);
  const locations = useVenueLocationNames(venue.id).data;
  const { remove } = useEventMutations(venue.id);
  const tick = useNow(EVENTS_REFRESH_MS);
  const [editing, setEditing] = useState<VenueEvent | 'new' | null>(null);

  const filters: FilterDef[] = [
    {
      kind: 'multi',
      key: 'jenis',
      label: 'Jenis',
      options: EVENT_KINDS.map((value) => ({ value, label: EVENT_KIND_LABELS[value] })),
    },
    {
      kind: 'multi',
      key: 'status',
      label: 'Status',
      options: STATES.map((value) => ({ value, label: STATE_LABELS[value] })),
    },
    { kind: 'dateRange', key: 'tanggal', label: 'Tanggal' },
    {
      kind: 'select',
      key: 'lokasi',
      label: 'Lokasi',
      allLabel: 'Semua lokasi',
      options: locations?.map((l) => ({ value: l.id, label: l.name })),
    },
  ];
  const table = useTableState({ filters });
  const { q, page, size } = table.state;
  const range = dateRangeOf(table.state.filters.tanggal);
  const events = useEventPage(venue.id, {
    q,
    page,
    size,
    filters: {
      kinds: (table.state.filters.jenis ?? []).filter(isKind),
      states: (table.state.filters.status ?? []).filter(isState),
      from: range.from || null,
      to: range.to || null,
      locationId: table.state.filters.lokasi?.[0] ?? null,
      timeZone: timezone,
    },
  });
  const now = new Date(Math.max(tick, events.dataUpdatedAt));
  const nameOf = new Map((locations ?? []).map((l) => [l.id, l.name]));
  const editable = canEdit && allowed;

  const columns: DataColumn<VenueEvent>[] = [
    {
      id: 'title',
      header: 'Judul',
      className: 'font-bold whitespace-normal',
      cell: (e) => eventTitle(e, 'id'),
    },
    { id: 'kind', header: 'Jenis', cell: (e) => <Badge>{EVENT_KIND_LABELS[e.kind]}</Badge> },
    {
      id: 'status',
      header: 'Status',
      cell: (e) => {
        const phase = eventPhase(e, timezone, now);
        return (
          <StatusDot tone={PHASE_TONE[phase]} hollow={PHASE_TONE[phase] === 'neutral'}>
            {EVENT_PHASE_LABELS[phase]}
          </StatusDot>
        );
      },
    },
    {
      id: 'schedule',
      header: 'Jadwal',
      className: 'whitespace-normal',
      cell: (e) => scheduleText(e, timezone),
    },
    {
      id: 'place',
      header: 'Tempat',
      className: 'whitespace-normal',
      cell: (e) =>
        [
          ...e.locationIds.map((id) => nameOf.get(id) ?? '…'),
          ...(e.point ? ['Titik peta'] : []),
        ].join(', ') || '—',
    },
    ...(editable
      ? [
          {
            id: 'actions',
            header: 'Aksi',
            className: 'text-right',
            cell: (e: VenueEvent) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(e)}>
                  Ubah
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(e.id, { onSuccess: () => toast.success('Event dihapus') })
                  }
                >
                  Hapus
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-6">
      {!allowed ? <FormNotice tone="error">{lockedFeatureMessage('events')}</FormNotice> : null}
      {editable ? (
        <div>
          <Button variant="primary" onClick={() => setEditing('new')}>
            Tambah event
          </Button>
        </div>
      ) : null}
      <DataTable
        label="Event & Promo"
        columns={columns}
        rows={events.data?.rows}
        rowKey={(e) => e.id}
        total={events.data?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari judul atau ringkasan' }}
        filters={filters}
        loading={events.isFetching && events.isPlaceholderData}
        error={events.error?.message ?? null}
        onRetry={() => void events.refetch()}
        empty={
          <EmptyState
            title="Belum ada event"
            description={
              editable
                ? 'Tambahkan acara atau promosi; tampil di Visitor tanpa publish.'
                : 'Event dan promosi venue akan tampil di sini.'
            }
          />
        }
      />
      {remove.error ? <FormNotice tone="error">{remove.error.message}</FormNotice> : null}
      {editable ? (
        <EventDialog
          venueId={venue.id}
          timezone={timezone}
          open={editing !== null}
          event={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

export function EventsPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="events">
      {(access) => (
        <ModulePage module="events" access={access}>
          {venue ? (
            <Events key={venue.id} venue={venue} />
          ) : (
            <EmptyState
              title="Belum ada venue"
              description="Buat venue di menu Venue untuk mengelola event dan promosi."
            />
          )}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
