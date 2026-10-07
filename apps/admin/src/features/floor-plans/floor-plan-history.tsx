import { FLOOR_PLAN_FORMATS } from '@indoor/domain';
import {
  type DataColumn,
  DataTable,
  type FilterDef,
  queryRows,
  useLocalTableState,
  withinDateRange,
} from '@indoor/ui';
import type { FloorPlanVersion } from './queries';

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const FILTERS: FilterDef[] = [
  {
    kind: 'multi',
    key: 'format',
    label: 'Format',
    options: FLOOR_PLAN_FORMATS.map((value) => ({ value, label: value.toUpperCase() })),
  },
  { kind: 'dateRange', key: 'diunggah', label: 'Diunggah' },
];

const COLUMNS: DataColumn<FloorPlanVersion>[] = [
  {
    id: 'uploaded',
    header: 'Diunggah',
    className: 'tabular-nums',
    cell: (plan) => dateFormat.format(new Date(plan.createdAt)),
  },
  {
    id: 'format',
    header: 'Format',
    className: 'font-mono uppercase',
    cell: (plan) => `${plan.sourceFormat}${plan.pdfPage ? ` · hlm ${plan.pdfPage}` : ''}`,
  },
  {
    id: 'layers',
    header: 'Layer CAD',
    className: 'max-w-56 truncate font-mono text-ink-muted',
    cell: (plan) => (plan.cadLayers.length ? plan.cadLayers.join(', ') : '—'),
  },
  {
    id: 'files',
    header: 'Berkas',
    className: 'text-right',
    cell: (plan) => (
      <>
        <a className="underline" href={plan.imageUrl} target="_blank" rel="noreferrer">
          Lihat
        </a>
        <span className="text-ink-muted"> · </span>
        <a className="underline" href={plan.sourceUrl} target="_blank" rel="noreferrer">
          Asli
        </a>
      </>
    ),
  },
];

/** Versi lama tidak dihapus agar bisa dibandingkan atau diambil kembali. */
export function FloorPlanHistory({ plans }: { plans: FloorPlanVersion[] }) {
  const table = useLocalTableState({ size: 10 });
  if (plans.length === 0) return null;
  const result = queryRows(plans, table.state, {
    text: (plan) => [plan.sourceFormat, ...plan.cadLayers],
    filters: {
      format: (plan, values) => values.includes(plan.sourceFormat),
      diunggah: (plan, values) => withinDateRange(plan.createdAt, values),
    },
  });
  return (
    <section aria-label="Riwayat denah" className="grid gap-2">
      <h3 className="font-bold">Riwayat</h3>
      <DataTable
        label="Riwayat denah"
        columns={COLUMNS}
        rows={result.rows}
        rowKey={(plan) => plan.id}
        total={result.total}
        table={table}
        search={{ placeholder: 'Cari format atau layer CAD' }}
        filters={FILTERS}
        empty={null}
      />
    </section>
  );
}
