import type { VendorClient } from '@indoor/domain';
import {
  LICENSE_KEY_STATUS_LABELS,
  type LicenseKeyStatus,
  maskedLicenseKey,
  type VendorLicenseKey,
} from '@indoor/domain/license-key';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@indoor/ui';
import { CopyIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { formatDateTime } from '../copy';
import { LicenseKeyForm } from './license-key-form';
import { useLicenseKeyActions, useLicenseKeys } from './use-license-keys';

const TONES: Record<LicenseKeyStatus, 'ok' | 'neutral' | 'danger'> = {
  available: 'ok',
  activated: 'neutral',
  revoked: 'danger',
};

function NewKey({ value, onDone }: { value: string; onDone: () => void }) {
  const copy = () =>
    void navigator.clipboard
      .writeText(value)
      .then(() => toast.success('Kunci lisensi disalin.'))
      .catch(() => toast.error('Kunci tidak bisa disalin. Salin manual dari kotak.'));
  return (
    <div
      role="status"
      aria-labelledby="new-key-title"
      className="grid gap-3 rounded-lg border border-ink p-4"
    >
      <p id="new-key-title" className="font-bold">
        Kunci lisensi baru
      </p>
      <p className="text-ink-muted text-sm">
        Kirim kunci ini ke klien. Portal hanya menyimpan sidik kuncinya, jadi kunci tidak bisa
        ditampilkan lagi setelah kotak ini ditutup.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <output
          aria-label="Kunci lisensi"
          className="select-all break-all rounded-md bg-canvas px-3 py-2 font-mono text-base"
        >
          {value}
        </output>
        <Button size="sm" onClick={copy}>
          <CopyIcon aria-hidden="true" /> Salin
        </Button>
        <Button size="sm" className="ml-auto" onClick={onDone}>
          Selesai
        </Button>
      </div>
    </div>
  );
}

function KeyUsage({ licenseKey }: { licenseKey: VendorLicenseKey }) {
  if (licenseKey.status === 'revoked' && licenseKey.revokedAt) {
    return <>Dicabut {formatDateTime(licenseKey.revokedAt)}</>;
  }
  if (!licenseKey.instanceId) return <span className="text-ink-muted">Belum dipakai</span>;
  return (
    <>
      <span className="block">{licenseKey.installationName}</span>
      <span className="block font-mono text-ink-muted text-xs">{licenseKey.instanceId}</span>
      {licenseKey.licenseId ? (
        <span className="block font-mono text-ink-muted text-xs">{licenseKey.licenseId}</span>
      ) : null}
      {licenseKey.activatedAt ? (
        <span className="block text-ink-muted text-sm">
          Diaktifkan {formatDateTime(licenseKey.activatedAt)}
        </span>
      ) : null}
    </>
  );
}

function KeysTable({
  licenseKeys,
  pendingId,
  onRevoke,
}: {
  licenseKeys: VendorLicenseKey[];
  pendingId: string | null;
  onRevoke: (licenseKey: VendorLicenseKey) => void;
}) {
  if (licenseKeys.length === 0) {
    return <p className="text-ink-muted">Belum ada kunci lisensi untuk klien ini.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kunci</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Instalasi</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead>
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenseKeys.map((licenseKey) => (
            <TableRow key={licenseKey.id}>
              <TableCell className="whitespace-nowrap font-mono text-xs">
                {maskedLicenseKey(licenseKey.hint)}
              </TableCell>
              <TableCell>
                <StatusDot tone={TONES[licenseKey.status]}>
                  {LICENSE_KEY_STATUS_LABELS[licenseKey.status]}
                </StatusDot>
              </TableCell>
              <TableCell>
                {licenseKey.plan}
                <span className="block text-ink-muted text-sm">{licenseKey.durationDays} hari</span>
              </TableCell>
              <TableCell>
                <KeyUsage licenseKey={licenseKey} />
              </TableCell>
              <TableCell>
                {formatDateTime(licenseKey.createdAt)}
                {licenseKey.createdByEmail ? (
                  <span className="block text-ink-muted text-sm">{licenseKey.createdByEmail}</span>
                ) : null}
              </TableCell>
              <TableCell className="text-right">
                {licenseKey.status === 'available' ? (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={pendingId === licenseKey.id}
                    aria-label={`Cabut kunci …${licenseKey.hint}`}
                    onClick={() => onRevoke(licenseKey)}
                  >
                    Cabut
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LicenseKeysPanel({ client }: { client: VendorClient }) {
  const licenseKeys = useLicenseKeys(client.id);
  const { create, revoke } = useLicenseKeyActions(client.id);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  if (licenseKeys.isError) {
    return (
      <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
        Kunci lisensi tidak bisa dimuat.
      </p>
    );
  }
  if (!licenseKeys.data) return <Skeleton className="h-32" />;

  return (
    <div className="grid gap-5">
      {created ? <NewKey value={created} onDone={() => setCreated(null)} /> : null}
      {creating ? (
        <LicenseKeyForm
          clientId={client.id}
          pending={create.isPending}
          onSubmit={(request) =>
            create.mutate(request, {
              onSuccess: (key) => {
                setCreated(key);
                setCreating(false);
              },
            })
          }
          onCancel={() => setCreating(false)}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-ink-muted text-sm">
            Klien memasukkan kunci di halaman Aktivasi Admin. Aktivasi pertama mengikat kunci ke
            instalasi itu dan menerbitkan lisensi yang berlaku sejak hari aktivasi.
          </p>
          <Button variant="primary" className="ml-auto" onClick={() => setCreating(true)}>
            <PlusIcon aria-hidden="true" /> Buat kunci
          </Button>
        </div>
      )}
      <KeysTable
        licenseKeys={licenseKeys.data}
        pendingId={revoke.isPending ? (revoke.variables?.id ?? null) : null}
        onRevoke={(licenseKey) => revoke.mutate({ id: licenseKey.id, hint: licenseKey.hint })}
      />
    </div>
  );
}

export function LicenseKeysDialog({
  client,
  onClose,
}: {
  client: VendorClient | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={client !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        {client ? (
          <>
            <DialogHeader>
              <DialogTitle>Kunci lisensi {client.institution}</DialogTitle>
              <DialogDescription>
                Satu kunci untuk satu instalasi. Kunci yang belum dipakai bisa dicabut; untuk kunci
                yang sudah diaktifkan, cabut lisensinya dari dialog Lisensi instalasi.
              </DialogDescription>
            </DialogHeader>
            <LicenseKeysPanel key={client.id} client={client} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
