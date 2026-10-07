import { AUDIT_ACTIONS, type AuditAction, type AuditEvent } from '@indoor/domain';
import { type DataColumn, DataTable, dateRangeOf, EmptyState, type FilterDef } from '@indoor/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { data } from '../../app/data-client';
import { useTableState } from '../../hooks/use-table-state';
import { useUsers } from '../users/queries';
import { AUDIT_LABELS, describeAuditDetails } from './audit-format';

const timeFormat = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});
/** Waktu ditampilkan dan disaring di zona waktu browser yang sama. */
const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const isAction = (value: string): value is AuditAction =>
  (AUDIT_ACTIONS as readonly string[]).includes(value);

const COLUMNS: DataColumn<AuditEvent>[] = [
  {
    id: 'time',
    header: 'Waktu',
    className: 'font-mono tabular-nums',
    cell: (event) => timeFormat.format(new Date(event.occurredAt)),
  },
  {
    id: 'action',
    header: 'Aksi',
    cell: (event) => (
      <span className={event.action === 'login_failed' ? 'text-danger' : undefined}>
        {AUDIT_LABELS[event.action]}
      </span>
    ),
  },
  {
    id: 'actor',
    header: 'Pengguna',
    cell: (event) =>
      event.actor ? (
        <>
          {event.actor.name}{' '}
          <span className="font-mono text-ink-muted text-xs">{event.actor.email}</span>
        </>
      ) : (
        <span className="text-ink-muted">Sistem</span>
      ),
  },
  {
    id: 'details',
    header: 'Keterangan',
    className: 'whitespace-normal text-ink-muted',
    cell: (event) => describeAuditDetails(event),
  },
];

/** Log audit (Super Admin): disaring dan dibagi halaman di server, terbaru di atas. */
export function AuditLog() {
  const users = useUsers();
  const filters: FilterDef[] = [
    {
      kind: 'multi',
      key: 'aksi',
      label: 'Aksi',
      options: AUDIT_ACTIONS.map((value) => ({ value, label: AUDIT_LABELS[value] })),
    },
    {
      kind: 'select',
      key: 'pengguna',
      label: 'Pengguna',
      allLabel: 'Semua pengguna',
      options: users.data?.map((u) => ({ value: u.userId, label: `${u.fullName} · ${u.email}` })),
    },
    { kind: 'dateRange', key: 'tanggal', label: 'Tanggal' },
  ];
  const table = useTableState({ filters });
  const { q, page, size } = table.state;
  const range = dateRangeOf(table.state.filters.tanggal);
  const query = {
    q,
    page,
    size,
    filters: {
      actions: (table.state.filters.aksi ?? []).filter(isAction),
      userId: table.state.filters.pengguna?.[0] ?? null,
      from: range.from || null,
      to: range.to || null,
      timeZone: TIME_ZONE,
    },
  };
  const events = useQuery({
    queryKey: ['audit', 'page', query],
    queryFn: () => data.audit.listPage(query),
    placeholderData: keepPreviousData,
  });

  return (
    <DataTable
      label="Log audit"
      columns={COLUMNS}
      rows={events.data?.rows}
      rowKey={(event) => String(event.id)}
      total={events.data?.total ?? 0}
      table={table}
      search={{ placeholder: 'Cari nama, email, atau keterangan' }}
      filters={filters}
      loading={events.isFetching}
      error={events.error?.message ?? null}
      onRetry={() => void events.refetch()}
      empty={
        <EmptyState
          title="Belum ada peristiwa"
          description="Peristiwa seperti masuk, perubahan role, dan perubahan pengaturan akan tercatat di sini."
        />
      }
    />
  );
}
