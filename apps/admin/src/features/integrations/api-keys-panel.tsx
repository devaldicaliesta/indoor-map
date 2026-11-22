import {
  API_KEY_NAME_MAX,
  API_SCOPE_LABELS,
  API_SCOPES,
  type ApiKey,
  type ApiScope,
  checkIntegrationName,
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
  DialogTrigger,
  EmptyState,
  Input,
  queryRows,
  StatusDot,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { Can, useCan, useRole } from '../../app/auth/can';
import { Field } from '../../app/components/field';
import { useTableState } from '../../hooks/use-table-state';
import { FormNotice } from '../auth/auth-layout';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from './queries';
import {
  CheckboxGroup,
  ConfirmDialog,
  formatTime,
  SecretDialog,
  useVenueNames,
  VenueScope,
} from './shared';

function CreateApiKeyDialog({ onCreated }: { onCreated: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<ApiScope[]>(['locations:read']);
  const [venueIds, setVenueIds] = useState<string[] | null>(null);
  const [touched, setTouched] = useState(false);
  const create = useCreateApiKey();
  const nameProblem = checkIntegrationName(name);

  function reset() {
    setName('');
    setScopes(['locations:read']);
    setVenueIds(null);
    setTouched(false);
    create.reset();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (nameProblem || scopes.length === 0 || venueIds?.length === 0) return;
    create.mutate(
      { name: name.trim(), scopes, venueIds },
      {
        onSuccess: ({ key }) => {
          setOpen(false);
          reset();
          onCreated(key);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="primary" data-tour="integrations-new-key">
          Buat kunci API
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat kunci API</DialogTitle>
          <DialogDescription>
            Satu kunci untuk satu sistem klien, agar bisa dicabut tanpa mengganggu yang lain.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <Field
            id="api-key-name"
            label="Nama sistem"
            hint="Misalnya SIMRS atau Sistem akademik."
            error={
              touched && nameProblem
                ? nameProblem === 'required'
                  ? 'Nama wajib diisi.'
                  : `Nama paling panjang ${API_KEY_NAME_MAX} karakter.`
                : undefined
            }
          >
            <Input
              id="api-key-name"
              value={name}
              maxLength={API_KEY_NAME_MAX + 1}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <CheckboxGroup
            legend="Izin"
            options={API_SCOPES}
            labels={API_SCOPE_LABELS}
            value={scopes}
            onChange={setScopes}
          />
          {touched && scopes.length === 0 ? (
            <p className="text-danger text-sm">Pilih minimal satu izin.</p>
          ) : null}
          <VenueScope idPrefix="api-key-venue" value={venueIds} onChange={setVenueIds} />
          {touched && venueIds?.length === 0 ? (
            <p className="text-danger text-sm">Pilih minimal satu venue.</p>
          ) : null}
          {create.error ? <FormNotice tone="error">{create.error.message}</FormNotice> : null}
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending ? 'Membuat…' : 'Buat kunci'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ApiKeysPanel() {
  const keys = useApiKeys();
  const revoke = useRevokeApiKey();
  const table = useTableState({ filters: [], prefix: 'key_' });
  const venueNames = useVenueNames();
  const isSuperAdmin = useRole() === 'super_admin';
  const canManage = useCan('integration.manage');
  const [created, setCreated] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);

  const result = keys.data
    ? queryRows(keys.data, table.state, { text: (key) => [key.name, key.prefix], filters: {} })
    : undefined;

  const columns: DataColumn<ApiKey>[] = [
    { id: 'name', header: 'Sistem', className: 'font-bold', cell: (key) => key.name },
    {
      id: 'prefix',
      header: 'Kunci',
      className: 'font-mono text-sm',
      cell: (key) => `${key.prefix}…`,
    },
    {
      id: 'scopes',
      header: 'Izin',
      className: 'whitespace-normal text-sm',
      cell: (key) => key.scopes.join(', '),
    },
    { id: 'venues', header: 'Venue', cell: (key) => venueNames(key.venueIds) },
    {
      id: 'used',
      header: 'Terakhir dipakai',
      className: 'tabular-nums',
      cell: (key) => formatTime(key.lastUsedAt),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (key) =>
        key.revokedAt ? (
          <StatusDot tone="neutral">Dicabut {formatTime(key.revokedAt)}</StatusDot>
        ) : (
          <StatusDot tone="ok">Aktif</StatusDot>
        ),
    },
  ];
  if (isSuperAdmin) {
    columns.push({
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (key) =>
        key.revokedAt ? null : (
          <Button size="sm" variant="secondary" onClick={() => setRevoking(key)}>
            Cabut
          </Button>
        ),
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-prose text-ink-muted text-sm">
          Sistem klien memakai kunci di header <code>Authorization: Bearer &lt;kunci&gt;</code>.
          Server hanya menyimpan sidik kunci; kunci utuh tampil sekali saat dibuat.
        </p>
        <Can action="integration.manage">
          <CreateApiKeyDialog onCreated={setCreated} />
        </Can>
      </div>
      <DataTable
        label="Kunci API"
        columns={columns}
        rows={result?.rows}
        rowKey={(key) => key.id}
        total={result?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari nama sistem atau awalan kunci' }}
        error={keys.error?.message ?? null}
        onRetry={() => void keys.refetch()}
        empty={
          <EmptyState
            title="Belum ada kunci API"
            description={
              canManage
                ? 'Buat kunci untuk sistem yang akan mengubah jam operasional atau penutupan lewat API.'
                : 'Kunci API dibuat oleh Super Admin.'
            }
          />
        }
      />
      <SecretDialog
        title="Kunci API dibuat"
        description="Salin dan simpan kunci ini di sistem klien sekarang. Kunci tidak bisa dilihat lagi; bila hilang, cabut lalu buat yang baru."
        label="Kunci API"
        value={created}
        onClose={() => setCreated(null)}
      />
      <ConfirmDialog
        open={revoking !== null}
        title={`Cabut kunci ${revoking?.name ?? ''}?`}
        description="Permintaan dengan kunci ini langsung ditolak. Pencabutan tidak bisa dibatalkan."
        confirm="Cabut kunci"
        pending={revoke.isPending}
        onOpenChange={(open) => (open ? null : setRevoking(null))}
        onConfirm={() =>
          revoking &&
          revoke.mutate(revoking.id, {
            onSuccess: () => {
              toast.success(`Kunci ${revoking.name} dicabut.`);
              setRevoking(null);
            },
            onError: (error) => toast.error('Kunci tidak dicabut', { description: error.message }),
          })
        }
      />
    </div>
  );
}
