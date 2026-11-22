import {
  API_KEY_NAME_MAX,
  checkIntegrationName,
  checkWebhookUrl,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EVENTS,
  WEBHOOK_URL_MAX,
  WEBHOOK_URL_MESSAGES,
  type Webhook,
  type WebhookEvent,
} from '@indoor/domain';
import {
  Button,
  type DataColumn,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  queryRows,
  StatusDot,
  toast,
} from '@indoor/ui';
import { MoreHorizontalIcon } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Can, useCan } from '../../app/auth/can';
import { Field } from '../../app/components/field';
import { useTableState } from '../../hooks/use-table-state';
import { FormNotice } from '../auth/auth-layout';
import {
  useCreateWebhook,
  usePingWebhook,
  useRemoveWebhook,
  useRotateWebhookSecret,
  useUpdateWebhook,
  useWebhooks,
} from './queries';
import { CheckboxGroup, ConfirmDialog, SecretDialog, useVenueNames, VenueScope } from './shared';

interface FormState {
  name: string;
  url: string;
  events: WebhookEvent[];
  venueIds: string[] | null;
  active: boolean;
}

const EMPTY: FormState = {
  name: '',
  url: '',
  events: [...WEBHOOK_EVENTS],
  venueIds: null,
  active: true,
};

/** `webhook`: ubah yang ada; tanpa itu membuat baru (rahasia penandatangan tampil sekali). */
function WebhookDialog({
  webhook,
  open,
  onOpenChange,
  onCreated,
}: {
  webhook: Webhook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (secret: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    webhook
      ? {
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          venueIds: webhook.venueIds,
          active: webhook.active,
        }
      : EMPTY,
  );
  const [touched, setTouched] = useState(false);
  const create = useCreateWebhook();
  const update = useUpdateWebhook();
  const mutation = webhook ? update : create;
  const nameProblem = checkIntegrationName(form.name);
  const urlProblem = checkWebhookUrl(form.url);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (nameProblem || urlProblem || form.events.length === 0 || form.venueIds?.length === 0) {
      return;
    }
    const input = {
      name: form.name.trim(),
      url: form.url.trim(),
      events: form.events,
      venueIds: form.venueIds,
    };
    if (webhook) {
      update.mutate(
        { id: webhook.id, input: { ...input, active: form.active } },
        {
          onSuccess: () => {
            toast.success(`Webhook ${input.name} disimpan.`);
            onOpenChange(false);
          },
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: ({ secret }) => {
          onOpenChange(false);
          onCreated(secret);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{webhook ? 'Ubah webhook' : 'Tambah webhook'}</DialogTitle>
          <DialogDescription>
            PanduArah mengirim POST JSON bertanda tangan HMAC ke alamat ini setiap peristiwa yang
            dipilih terjadi.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <Field
            id="webhook-name"
            label="Nama"
            error={
              touched && nameProblem
                ? nameProblem === 'required'
                  ? 'Nama wajib diisi.'
                  : `Nama paling panjang ${API_KEY_NAME_MAX} karakter.`
                : undefined
            }
          >
            <Input
              id="webhook-name"
              value={form.name}
              maxLength={API_KEY_NAME_MAX + 1}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </Field>
          <Field
            id="webhook-url"
            label="Alamat penerima"
            hint="Gunakan https:// untuk penerima di luar jaringan venue."
            error={touched && urlProblem ? WEBHOOK_URL_MESSAGES[urlProblem] : undefined}
          >
            <Input
              id="webhook-url"
              type="url"
              inputMode="url"
              className="font-mono"
              placeholder="https://simrs.contoh.id/panduarah"
              value={form.url}
              maxLength={WEBHOOK_URL_MAX + 1}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </Field>
          <CheckboxGroup
            legend="Peristiwa"
            options={WEBHOOK_EVENTS}
            labels={WEBHOOK_EVENT_LABELS}
            value={form.events}
            onChange={(events) => setForm({ ...form, events })}
          />
          {touched && form.events.length === 0 ? (
            <p className="text-danger text-sm">Pilih minimal satu peristiwa.</p>
          ) : null}
          <VenueScope
            idPrefix="webhook-venue"
            value={form.venueIds}
            onChange={(venueIds) => setForm({ ...form, venueIds })}
          />
          {touched && form.venueIds?.length === 0 ? (
            <p className="text-danger text-sm">Pilih minimal satu venue.</p>
          ) : null}
          {webhook ? (
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-ink"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Aktif (nonaktif: peristiwa baru tidak dikirim)
            </label>
          ) : null}
          {mutation.error ? <FormNotice tone="error">{mutation.error.message}</FormNotice> : null}
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Menyimpan…' : webhook ? 'Simpan' : 'Tambah webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WebhooksPanel({ onShowLog }: { onShowLog: (webhookId: string) => void }) {
  const webhooks = useWebhooks();
  const table = useTableState({ filters: [], prefix: 'hook_' });
  const venueNames = useVenueNames();
  const canManage = useCan('integration.manage');
  const ping = usePingWebhook();
  const rotate = useRotateWebhookSecret();
  const remove = useRemoveWebhook();
  const [editing, setEditing] = useState<Webhook | 'new' | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Webhook | null>(null);
  const [rotating, setRotating] = useState<Webhook | null>(null);

  const result = webhooks.data
    ? queryRows(webhooks.data, table.state, { text: (w) => [w.name, w.url], filters: {} })
    : undefined;

  const columns: DataColumn<Webhook>[] = [
    { id: 'name', header: 'Nama', className: 'font-bold', cell: (w) => w.name },
    {
      id: 'url',
      header: 'Alamat',
      className: 'max-w-72 truncate font-mono text-sm',
      cell: (w) => w.url,
    },
    {
      id: 'events',
      header: 'Peristiwa',
      className: 'text-sm',
      cell: (w) => w.events.join(', '),
    },
    { id: 'venues', header: 'Venue', cell: (w) => venueNames(w.venueIds) },
    {
      id: 'status',
      header: 'Status',
      cell: (w) =>
        w.active ? (
          <StatusDot tone="ok">Aktif</StatusDot>
        ) : (
          <StatusDot tone="neutral">Nonaktif</StatusDot>
        ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (w) => (
        <div className="flex items-center justify-end gap-1">
          {canManage ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={!w.active || ping.isPending}
              onClick={() =>
                ping.mutate(w.id, {
                  onSuccess: () =>
                    toast.success('Uji webhook dikirim', {
                      description: 'Lihat hasilnya di Log pengiriman.',
                      action: { label: 'Buka log', onClick: () => onShowLog(w.id) },
                    }),
                  onError: (error) =>
                    toast.error('Uji tidak dikirim', { description: error.message }),
                })
              }
            >
              Kirim uji
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label={`Menu webhook ${w.name}`}>
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onShowLog(w.id)}>Log pengiriman</DropdownMenuItem>
              {canManage ? (
                <>
                  <DropdownMenuItem onSelect={() => setEditing(w)}>Ubah</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setRotating(w)}>Ganti rahasia</DropdownMenuItem>
                  <DropdownMenuItem className="text-danger" onSelect={() => setRemoving(w)}>
                    Hapus
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-prose text-ink-muted text-sm">
          Penerima memeriksa header <code>webhook-signature</code> dengan rahasia webhook. Balasan
          selain 2xx dicoba ulang setelah 1 menit, 5 menit, 30 menit, 2 jam, dan 6 jam.
        </p>
        <Can action="integration.manage">
          <Button
            variant="primary"
            data-tour="integrations-new-webhook"
            onClick={() => setEditing('new')}
          >
            Tambah webhook
          </Button>
        </Can>
      </div>
      <DataTable
        label="Webhook"
        columns={columns}
        rows={result?.rows}
        rowKey={(w) => w.id}
        total={result?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari nama atau alamat' }}
        error={webhooks.error?.message ?? null}
        onRetry={() => void webhooks.refetch()}
        empty={
          <EmptyState
            title="Belum ada webhook"
            description="Tambahkan alamat sistem yang perlu tahu saat venue dipublish, ada penutupan, atau lokasi berubah."
          />
        }
      />
      {editing ? (
        <WebhookDialog
          key={editing === 'new' ? 'new' : editing.id}
          webhook={editing === 'new' ? null : editing}
          open
          onOpenChange={(open) => (open ? null : setEditing(null))}
          onCreated={setSecret}
        />
      ) : null}
      <SecretDialog
        title="Rahasia webhook"
        description="Simpan rahasia ini di sistem penerima untuk memeriksa tanda tangan. Rahasia tidak bisa dilihat lagi; bila hilang, ganti rahasia."
        label="Rahasia webhook"
        value={secret}
        onClose={() => setSecret(null)}
      />
      <ConfirmDialog
        open={rotating !== null}
        title={`Ganti rahasia ${rotating?.name ?? ''}?`}
        description="Rahasia lama langsung tidak berlaku. Perbarui rahasia di sistem penerima agar tanda tangan tetap cocok."
        confirm="Ganti rahasia"
        pending={rotate.isPending}
        onOpenChange={(open) => (open ? null : setRotating(null))}
        onConfirm={() =>
          rotating &&
          rotate.mutate(rotating.id, {
            onSuccess: (value) => {
              setRotating(null);
              setSecret(value);
            },
            onError: (error) =>
              toast.error('Rahasia tidak diganti', { description: error.message }),
          })
        }
      />
      <ConfirmDialog
        open={removing !== null}
        title={`Hapus webhook ${removing?.name ?? ''}?`}
        description="Log pengirimannya ikut terhapus. Sistem penerima tidak lagi menerima peristiwa."
        confirm="Hapus webhook"
        pending={remove.isPending}
        onOpenChange={(open) => (open ? null : setRemoving(null))}
        onConfirm={() =>
          removing &&
          remove.mutate(removing.id, {
            onSuccess: () => {
              toast.success(`Webhook ${removing.name} dihapus.`);
              setRemoving(null);
            },
            onError: (error) =>
              toast.error('Webhook tidak dihapus', { description: error.message }),
          })
        }
      />
    </div>
  );
}
