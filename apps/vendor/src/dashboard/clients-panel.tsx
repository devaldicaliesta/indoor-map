import type { VendorClient, VendorInstallation } from '@indoor/domain';
import { installationReleaseState, type VendorRelease } from '@indoor/domain/vendor-release';
import {
  Button,
  Skeleton,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import { HistoryIcon, KeyRoundIcon, PlusIcon, RefreshCwIcon } from 'lucide-react';
import { useState } from 'react';
import { formatDate, formatDateTime } from '../copy';
import { CheckinsDialog } from './checkins-dialog';
import { AddClientDialog, AddInstallationDialog } from './client-dialogs';
import { LicenseDialog } from './license-dialog';
import { TrialRequestsPanel } from './trial-requests-panel';
import { useReleases } from './use-releases';
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

function VersionState({
  version,
  releases,
}: {
  version: string | null;
  releases: VendorRelease[];
}) {
  const state = installationReleaseState(version, releases);
  if (state.kind === 'latest') {
    return <span className="block text-ink-muted text-sm">Versi {version} (terbaru)</span>;
  }
  if (state.kind === 'outdated') {
    return (
      <>
        <span className="block text-sm">
          <StatusDot tone="warn">Versi {version} tertinggal</StatusDot>
        </span>
        <span className="block text-ink-muted text-sm">Rilis terbaru {state.latest}</span>
      </>
    );
  }
  return (
    <span className="block text-ink-muted text-sm">
      {version ? `Versi ${version}` : 'Versi tidak dilaporkan'}
    </span>
  );
}

function InstallationsTable({
  installations,
  releases,
  onLicenses,
  onCheckins,
}: {
  installations: VendorInstallation[];
  releases: VendorRelease[];
  onLicenses: (installation: VendorInstallation) => void;
  onCheckins: (installation: VendorInstallation) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instansi dan instalasi</TableHead>
            <TableHead>Lisensi</TableHead>
            <TableHead>Check-in terakhir</TableHead>
            <TableHead>
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-ink-muted">
                Belum ada instalasi.
              </TableCell>
            </TableRow>
          ) : (
            installations.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell>
                  <span className="block font-medium">{inst.clientName}</span>
                  <span className="block text-ink-muted text-sm">{inst.name}</span>
                  <span className="block font-mono text-ink-muted text-xs">{inst.instanceId}</span>
                </TableCell>
                <TableCell>
                  {inst.plan ?? 'Belum berlisensi'}
                  {inst.validFrom && inst.validUntil ? (
                    <span className="block text-ink-muted text-sm">
                      {formatDate(inst.validFrom)} – {formatDate(inst.validUntil)}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  {inst.lastCheckinAt ? formatDateTime(inst.lastCheckinAt) : 'Belum pernah'}
                  {inst.lastCheckinAt ? (
                    <VersionState version={inst.lastVersion} releases={releases} />
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      aria-label={`Check-in ${inst.clientName} ${inst.name}`}
                      onClick={() => onCheckins(inst)}
                    >
                      <HistoryIcon aria-hidden="true" /> Check-in
                    </Button>
                    <Button size="sm" onClick={() => onLicenses(inst)}>
                      <KeyRoundIcon aria-hidden="true" /> Lisensi
                    </Button>
                  </div>
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
  const [checkinsFor, setCheckinsFor] = useState<VendorInstallation | null>(null);
  const releases = useReleases();

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
          <InstallationsTable
            installations={installations.data}
            releases={releases.data ?? []}
            onLicenses={setLicensesFor}
            onCheckins={setCheckinsFor}
          />
        ) : (
          <Skeleton className="h-32" />
        )}
      </section>

      <AddClientDialog open={addingClient} onClose={() => setAddingClient(false)} />
      <AddInstallationDialog client={installationFor} onClose={() => setInstallationFor(null)} />
      <LicenseDialog installation={licensesFor} onClose={() => setLicensesFor(null)} />
      <CheckinsDialog installation={checkinsFor} onClose={() => setCheckinsFor(null)} />
    </div>
  );
}
