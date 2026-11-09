import type { LicenseHistoryEntry } from '@indoor/data';
import { type DataColumn, DataTable, queryRows, Skeleton } from '@indoor/ui';
import { useTableState } from '../../hooks/use-table-state';
import { FormNotice } from '../auth/auth-layout';
import { useLicenseHistory } from './queries';

const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

const SOURCE_LABELS: Record<LicenseHistoryEntry['source'], string> = {
  online: 'Aktivasi online',
  manual: 'Berkas manual',
  checkin: 'Check-in vendor',
};

const columns: DataColumn<LicenseHistoryEntry>[] = [
  {
    id: 'activatedAt',
    header: 'Dipasang',
    cell: (l) => dateTime.format(new Date(l.activatedAt)),
  },
  { id: 'source', header: 'Sumber', cell: (l) => SOURCE_LABELS[l.source] },
  { id: 'plan', header: 'Paket', cell: (l) => l.plan },
  {
    id: 'licenseId',
    header: 'ID lisensi',
    className: 'font-mono',
    cell: (l) => l.licenseId,
  },
  { id: 'status', header: 'Status', cell: (l) => (l.isCurrent ? 'Berlaku' : 'Digantikan') },
];

/** Daftar lisensi yang pernah dipasang, terbaru dulu. */
export function LicenseHistory() {
  const history = useLicenseHistory();
  const table = useTableState({ filters: [] });
  const result = queryRows(history.data ?? [], table.state, {
    text: (l) => [l.licenseId, l.plan, l.client, SOURCE_LABELS[l.source]],
  });
  if (history.isPending) return <Skeleton className="h-32 max-w-3xl" />;
  if (history.error) return <FormNotice tone="error">{history.error.message}</FormNotice>;
  return (
    <section aria-labelledby="license-history" className="grid max-w-3xl gap-2">
      <h2 id="license-history" className="font-bold">
        Riwayat lisensi
      </h2>
      <DataTable
        label="Riwayat lisensi"
        columns={columns}
        rows={result.rows}
        rowKey={(l) => l.id}
        total={result.total}
        table={table}
        search={{ placeholder: 'Cari paket atau ID lisensi' }}
        empty={<p className="text-ink-muted">Belum ada lisensi yang dipasang.</p>}
      />
    </section>
  );
}
