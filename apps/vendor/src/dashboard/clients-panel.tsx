import type { VendorClient, VendorInstallation } from '@indoor/domain';
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import { KeyRoundIcon, PlusIcon, RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';
import { formatDate, formatDateTime } from '../copy';
import { AddClientDialog, AddInstallationDialog } from './client-dialogs';
import { LicenseDialog } from './license-dialog';
import { TrialRequestsPanel } from './trial-requests-panel';
import { useClients, useInstallations } from './use-vendor';

function ClientsTable({
  clients,
  onAddInstallation,
}: {
  clients: VendorClient[];
  onAddInstallation: (client: VendorClient) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instansi</TableHead>
            <TableHead>Kontak</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Instalasi</TableHead>
            <TableHead>Terdaftar</TableHead>
            <TableHead>
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-ink-muted">
                Belum ada klien.
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.institution}</TableCell>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone ?? '–'}</TableCell>
                <TableCell>{client.installationsCount}</TableCell>
                <TableCell>{formatDate(client.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => onAddInstallation(client)}>
                    <PlusIcon aria-hidden="true" /> Instalasi
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function InstallationsTable({
  installations,
  onLicenses,
}: {
  installations: VendorInstallation[];
  onLicenses: (installation: VendorInstallation) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instansi dan instalasi</TableHead>
            <TableHead>ID instalasi</TableHead>
            <TableHead>Paket</TableHead>
            <TableHead>Masa berlaku</TableHead>
            <TableHead>Versi terakhir</TableHead>
            <TableHead>Check-in terakhir</TableHead>
            <TableHead>
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-ink-muted">
                Belum ada instalasi.
              </TableCell>
            </TableRow>
          ) : (
            installations.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell>
                  <span className="block font-medium">{inst.clientName}</span>
                  <span className="block text-ink-muted text-sm">{inst.name}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">{inst.instanceId}</TableCell>
                <TableCell>{inst.plan ?? 'Belum berlisensi'}</TableCell>
                <TableCell>
                  {inst.validFrom && inst.validUntil
                    ? `${formatDate(inst.validFrom)} – ${formatDate(inst.validUntil)}`
                    : '–'}
                </TableCell>
                <TableCell>{inst.lastVersion ?? '–'}</TableCell>
                <TableCell>
                  {inst.lastCheckinAt ? formatDateTime(inst.lastCheckinAt) : '–'}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => onLicenses(inst)}>
                    <KeyRoundIcon aria-hidden="true" /> Lisensi
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function ClientsPanel() {
  const clients = useClients();
  const installations = useInstallations();
  const [addingClient, setAddingClient] = useState(false);
  const [installationFor, setInstallationFor] = useState<VendorClient | null>(null);
  const [licensesFor, setLicensesFor] = useState<VendorInstallation | null>(null);

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <h2 className="font-bold text-2xl">Klien & Instalasi</h2>
          <p className="text-ink-muted">
            Permintaan trial on-premise, klien, instalasinya, dan lisensi setiap instalasi.
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              void clients.refetch();
              void installations.refetch();
            }}
            disabled={clients.isFetching || installations.isFetching}
          >
            <RefreshCwIcon aria-hidden="true" /> Muat ulang
          </Button>
          <Button size="sm" variant="primary" onClick={() => setAddingClient(true)}>
            <PlusIcon aria-hidden="true" /> Tambah klien
          </Button>
        </div>
      </div>

      {clients.isError || installations.isError ? (
        <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
          Data klien atau instalasi tidak bisa dimuat.
        </p>
      ) : null}

      <TrialRequestsPanel />

      <section className="grid gap-4" aria-labelledby="clients-title">
        <h3 id="clients-title" className="font-semibold text-lg">
          Daftar klien
        </h3>
        {clients.data ? (
          <ClientsTable clients={clients.data} onAddInstallation={setInstallationFor} />
        ) : (
          <Skeleton className="h-32" />
        )}
      </section>

      <section className="grid gap-4" aria-labelledby="installations-title">
        <h3 id="installations-title" className="font-semibold text-lg">
          Daftar instalasi
        </h3>
        {installations.data ? (
          <InstallationsTable installations={installations.data} onLicenses={setLicensesFor} />
        ) : (
          <Skeleton className="h-32" />
        )}
      </section>

      <AddClientDialog open={addingClient} onClose={() => setAddingClient(false)} />
      <AddInstallationDialog client={installationFor} onClose={() => setInstallationFor(null)} />
      <LicenseDialog installation={licensesFor} onClose={() => setLicensesFor(null)} />
    </div>
  );
}
