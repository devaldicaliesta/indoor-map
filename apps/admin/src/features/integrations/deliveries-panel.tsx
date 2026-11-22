import {
  WEBHOOK_DELIVERY_STATUS_LABELS,
  WEBHOOK_DELIVERY_STATUSES,
  type WebhookDelivery,
  type WebhookDeliveryStatus,
} from '@indoor/domain';
import {
  Button,
  type DataColumn,
  DataTable,
  EmptyState,
  type FilterDef,
  StatusDot,
  toast,
} from '@indoor/ui';
import { useCan } from '../../app/auth/can';
import { useTableState } from '../../hooks/use-table-state';
import { useDeliveries, useRedeliver, useWebhooks } from './queries';
import { formatTime } from './shared';

const TONES: Record<WebhookDeliveryStatus, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  pending: 'neutral',
  sending: 'neutral',
  delivered: 'ok',
  retrying: 'warn',
  failed: 'danger',
};

/** Awalan parameter URL tabel ini; tombol Log pengiriman di tab Webhook mengisi saringannya. */
export const DELIVERY_TABLE_PREFIX = 'log_';

const isStatus = (value: string): value is WebhookDeliveryStatus =>
  (WEBHOOK_DELIVERY_STATUSES as readonly string[]).includes(value);

export function DeliveriesPanel() {
  const webhooks = useWebhooks();
  const canManage = useCan('integration.manage');
  const redeliver = useRedeliver();
  const filters: FilterDef[] = [
    {
      kind: 'select',
      key: 'webhook',
      label: 'Webhook',
      allLabel: 'Semua webhook',
      options: webhooks.data?.map((w) => ({ value: w.id, label: w.name })),
    },
    {
      kind: 'multi',
      key: 'status',
      label: 'Status',
      options: WEBHOOK_DELIVERY_STATUSES.map((value) => ({
        value,
        label: WEBHOOK_DELIVERY_STATUS_LABELS[value],
      })),
    },
  ];
  const table = useTableState({ filters, prefix: DELIVERY_TABLE_PREFIX });
  const { q, page, size } = table.state;
  const query = {
    q,
    page,
    size,
    filters: {
      statuses: (table.state.filters.status ?? []).filter(isStatus),
      webhookId: table.state.filters.webhook?.[0] ?? null,
    },
  };
  const deliveries = useDeliveries(query);

  const columns: DataColumn<WebhookDelivery>[] = [
    {
      id: 'time',
      header: 'Waktu',
      className: 'tabular-nums',
      cell: (d) => formatTime(d.createdAt),
    },
    { id: 'webhook', header: 'Webhook', className: 'font-bold', cell: (d) => d.webhookName },
    { id: 'event', header: 'Peristiwa', className: 'font-mono text-sm', cell: (d) => d.event },
    {
      id: 'status',
      header: 'Status',
      cell: (d) => (
        <StatusDot tone={TONES[d.status]} hollow={d.status === 'retrying'}>
          {WEBHOOK_DELIVERY_STATUS_LABELS[d.status]}
        </StatusDot>
      ),
    },
    {
      id: 'attempts',
      header: 'Percobaan',
      className: 'tabular-nums',
      cell: (d) => d.attempts,
    },
    {
      id: 'result',
      header: 'Hasil',
      className: 'whitespace-normal text-ink-muted text-sm',
      cell: (d) =>
        d.status === 'delivered'
          ? `HTTP ${d.responseStatus} · ${formatTime(d.deliveredAt)}`
          : [d.error, d.status === 'retrying' ? `Berikutnya ${formatTime(d.nextAttemptAt)}` : null]
              .filter(Boolean)
              .join(' · '),
    },
  ];
  if (canManage) {
    columns.push({
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (d) =>
        d.status === 'failed' || d.status === 'delivered' || d.status === 'retrying' ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={redeliver.isPending}
            onClick={() =>
              redeliver.mutate(d.id, {
                onSuccess: () => toast.success('Pengiriman diulang.'),
                onError: (error) =>
                  toast.error('Pengiriman tidak diulang', { description: error.message }),
              })
            }
          >
            Kirim ulang
          </Button>
        ) : null,
    });
  }

  return (
    <DataTable
      label="Log pengiriman"
      columns={columns}
      rows={deliveries.data?.rows}
      rowKey={(d) => d.id}
      total={deliveries.data?.total ?? 0}
      table={table}
      search={{ placeholder: 'Cari jenis peristiwa, mis. closure' }}
      filters={filters}
      loading={deliveries.isFetching}
      error={deliveries.error?.message ?? null}
      onRetry={() => void deliveries.refetch()}
      empty={
        <EmptyState
          title="Belum ada pengiriman"
          description="Pengiriman tercatat di sini 30 hari (gagal: 90 hari)."
        />
      }
    />
  );
}
