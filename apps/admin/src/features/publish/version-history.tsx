import type { PublicationEntry } from '@indoor/data';
import type { VenueId } from '@indoor/domain';
import {
  Badge,
  Button,
  type DataColumn,
  DataTable,
  dateRangeOf,
  type FilterDef,
  toast,
} from '@indoor/ui';
import { useState } from 'react';
import { Can } from '../../app/auth/can';
import { inVenueTime } from '../../app/format';
import { useTableState } from '../../hooks/use-table-state';
import { usePublicationHistoryPage, useRollback } from './queries';
import { ReleaseDialog } from './release-dialog';

const FILTERS: FilterDef[] = [{ kind: 'dateRange', key: 'terbit', label: 'Terbit' }];

function originLabel(entry: PublicationEntry) {
  return entry.origin === 'rollback' ? `Rollback dari v${entry.sourceVersion}` : 'Publish';
}

function RollbackDialog({
  venueId,
  entry,
  onClose,
}: {
  venueId: VenueId;
  entry: PublicationEntry;
  onClose: () => void;
}) {
  const rollback = useRollback(venueId);
  return (
    <ReleaseDialog
      title={`Aktifkan kembali v${entry.version}?`}
      description="Isi versi ini diterbitkan ulang sebagai versi baru dan langsung dibaca Visitor dan Info Point. Draft di editor tidak berubah."
      confirmLabel={`Aktifkan v${entry.version}`}
      pending={rollback.isPending}
      error={rollback.error?.message ?? null}
      onClose={onClose}
      onConfirm={(notes) =>
        rollback.mutate(
          { version: entry.version, notes },
          {
            onSuccess: (result) => {
              toast.success(`Versi ${result.version} aktif`, {
                description: `Berisi peta v${entry.version}.`,
              });
              onClose();
            },
          },
        )
      }
    />
  );
}

/** Riwayat versi: nomor, waktu, penerbit, catatan, asal; versi lama bisa diaktifkan kembali. */
export function VersionHistory({ venueId, timezone }: { venueId: VenueId; timezone: string }) {
  const [target, setTarget] = useState<PublicationEntry | null>(null);
  const table = useTableState({ filters: FILTERS, defaultSize: 10 });
  const { q, page, size } = table.state;
  const range = dateRangeOf(table.state.filters.terbit);
  const history = usePublicationHistoryPage(venueId, {
    q,
    page,
    size,
    filters: { from: range.from || null, to: range.to || null, timeZone: timezone },
  });

  const columns: DataColumn<PublicationEntry>[] = [
    {
      id: 'version',
      header: 'Versi',
      className: 'whitespace-nowrap font-bold font-mono',
      cell: (entry) => (
        <>
          v{entry.version} {entry.isActive ? <Badge className="ml-1 font-sans">Aktif</Badge> : null}
        </>
      ),
    },
    {
      id: 'time',
      header: 'Waktu',
      className: 'whitespace-nowrap',
      cell: (entry) => inVenueTime(entry.publishedAt, timezone),
    },
    { id: 'publisher', header: 'Penerbit', cell: (entry) => entry.publisherName ?? '–' },
    {
      id: 'notes',
      header: 'Catatan',
      className: 'min-w-48 whitespace-pre-line',
      cell: (entry) => entry.notes ?? '–',
    },
    { id: 'origin', header: 'Asal', className: 'whitespace-nowrap', cell: originLabel },
    {
      id: 'actions',
      header: <span className="sr-only">Aksi</span>,
      className: 'text-right',
      cell: (entry) =>
        entry.isActive ? null : (
          <Can action="publish.rollback">
            <Button onClick={() => setTarget(entry)}>Aktifkan kembali</Button>
          </Can>
        ),
    },
  ];

  return (
    <section
      aria-labelledby="history-title"
      className="grid gap-3 rounded-md border border-line bg-surface p-(--panel-padding)"
    >
      <h2 id="history-title" className="font-bold">
        Riwayat versi
      </h2>
      <DataTable
        label="Riwayat versi"
        columns={columns}
        rows={history.data?.rows}
        rowKey={(entry) => String(entry.version)}
        total={history.data?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari versi (v12), catatan, atau penerbit' }}
        filters={FILTERS}
        loading={history.isFetching}
        error={history.error?.message ?? null}
        onRetry={() => void history.refetch()}
        empty={<p className="text-ink-muted">Belum ada versi yang diterbitkan.</p>}
      />
      {target ? (
        <RollbackDialog venueId={venueId} entry={target} onClose={() => setTarget(null)} />
      ) : null}
    </section>
  );
}
