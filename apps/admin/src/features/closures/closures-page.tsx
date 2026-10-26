import {
  type Closure,
  type ClosureStatus,
  closureStatus,
  closureTarget,
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
  Skeleton,
  StatusDot,
  toast,
} from '@indoor/ui';
import { useState } from 'react';
import { useCan } from '../../app/auth/can';
import { inVenueTime } from '../../app/format';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { useTableState } from '../../hooks/use-table-state';
import { FormNotice } from '../auth/auth-layout';
import { CLOSURE_REFRESH_MS } from '../editor/graph/graph-queries';
import { useNow } from '../editor/graph/graph-status';
import { ClosureDialog } from './closure-dialog';
import { useClosureDialog } from './closure-dialog-store';
import { targetLabel } from './closure-model';
import { EndsDialog } from './ends-dialog';
import {
  useClosureMutations,
  useClosureNetwork,
  useClosurePage,
  useVenueTimezone,
} from './queries';
import { TargetPicker } from './target-picker';

const STATUS: Record<ClosureStatus, { label: string; tone: 'danger' | 'warn' | 'neutral' }> = {
  active: { label: 'Sedang berlaku', tone: 'danger' },
  scheduled: { label: 'Terjadwal', tone: 'warn' },
  ended: { label: 'Selesai', tone: 'neutral' },
};
const STATES = Object.keys(STATUS) as ClosureStatus[];
const isState = (value: string): value is ClosureStatus => value in STATUS;

const FILTERS: FilterDef[] = [
  {
    kind: 'multi',
    key: 'status',
    label: 'Status',
    options: STATES.map((value) => ({ value, label: STATUS[value].label })),
  },
  { kind: 'dateRange', key: 'tanggal', label: 'Berlaku' },
];

function Closures({ venue }: { venue: VenueSummary }) {
  const canManage = useCan('closure.manage');
  const network = useClosureNetwork(venue.id);
  const timezone = useVenueTimezone(venue.id);
  const { setEndsAt, remove } = useClosureMutations(venue.id);
  const tick = useNow(CLOSURE_REFRESH_MS);
  const [editing, setEditing] = useState<Closure | null>(null);

  const table = useTableState({ filters: FILTERS });
  const { q, page, size } = table.state;
  const range = dateRangeOf(table.state.filters.tanggal);
  const closures = useClosurePage(venue.id, {
    q,
    page,
    size,
    filters: {
      states: (table.state.filters.status ?? []).filter(isState),
      from: range.from || null,
      to: range.to || null,
      timeZone: timezone,
    },
  });
  // Status baris dihitung ulang tiap menit, dan juga setiap data dimuat ulang: penutupan yang
  // baru diakhiri langsung tampil "Selesai" tanpa menunggu menit berikutnya.
  const now = new Date(Math.max(tick, closures.dataUpdatedAt));

  const pending = setEndsAt.isPending || remove.isPending;
  const end = (closure: Closure, status: ClosureStatus) => {
    // Yang belum mulai dibatalkan (dihapus): waktu selesai tidak boleh sebelum waktu mulai.
    if (status === 'scheduled') {
      remove.mutate(closure.id, { onSuccess: () => toast.success('Penutupan dibatalkan') });
    } else {
      setEndsAt.mutate(
        { id: closure.id, endsAt: new Date().toISOString() },
        { onSuccess: () => toast.success('Penutupan diakhiri') },
      );
    }
  };

  const columns: DataColumn<Closure>[] = [
    {
      id: 'target',
      header: 'Yang ditutup',
      className: 'font-bold',
      cell: (c) => (network ? targetLabel(network.places, closureTarget(c)) : '…'),
    },
    { id: 'reason', header: 'Alasan', className: 'whitespace-normal', cell: (c) => c.reason },
    {
      id: 'status',
      header: 'Status',
      cell: (c) => {
        const status = STATUS[closureStatus(c, now)];
        return (
          <StatusDot tone={status.tone} hollow={status.tone === 'neutral'}>
            {status.label}
          </StatusDot>
        );
      },
    },
    { id: 'starts', header: 'Mulai', cell: (c) => inVenueTime(c.startsAt, timezone) },
    {
      id: 'ends',
      header: 'Selesai',
      cell: (c) => (c.endsAt ? inVenueTime(c.endsAt, timezone) : <Badge>Sampai diakhiri</Badge>),
    },
    ...(canManage
      ? [
          {
            id: 'actions',
            header: 'Aksi',
            className: 'text-right',
            cell: (c: Closure) => {
              const status = closureStatus(c, now);
              if (status === 'ended') return <span className="text-ink-muted">—</span>;
              return (
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                    Ubah waktu selesai
                  </Button>
                  <Button size="sm" disabled={pending} onClick={() => end(c, status)}>
                    {status === 'scheduled' ? 'Batalkan' : 'Akhiri sekarang'}
                  </Button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const error = setEndsAt.error ?? remove.error;
  return (
    <div className="grid gap-6">
      {canManage ? (
        network ? (
          <TargetPicker
            places={network.places}
            onPick={(target) => useClosureDialog.getState().open(target)}
          />
        ) : (
          <Skeleton className="h-16 w-96" />
        )
      ) : null}
      <DataTable
        label="Penutupan"
        columns={columns}
        rows={closures.data?.rows}
        rowKey={(c) => c.id}
        total={closures.data?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari alasan, ruang, kode unit, atau konektor' }}
        filters={FILTERS}
        loading={closures.isFetching && closures.isPlaceholderData}
        error={closures.error?.message ?? null}
        onRetry={() => void closures.refetch()}
        empty={
          <EmptyState
            title="Belum ada penutupan"
            description={
              canManage
                ? 'Pilih ruang, jalur, atau konektor di atas untuk menutupnya sementara.'
                : 'Penutupan yang dibuat Operator atau Admin akan tampil di sini.'
            }
          />
        }
      />
      {error ? <FormNotice tone="error">{error.message}</FormNotice> : null}
      {canManage ? <ClosureDialog venueId={venue.id} /> : null}
      <EndsDialog venueId={venue.id} closure={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

export function ClosuresPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="closures">
      {(access) => (
        <ModulePage module="closures" access={access}>
          {venue ? (
            <Closures key={venue.id} venue={venue} />
          ) : (
            <EmptyState
              title="Belum ada venue"
              description="Buat venue di menu Venue untuk mengatur penutupan."
            />
          )}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
