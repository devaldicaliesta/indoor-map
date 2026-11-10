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
import { RefreshCwIcon } from 'lucide-react';
import { useClients, useInstallations } from './use-vendor';

export function ClientsPanel() {
  const clients = useClients();
  const installations = useInstallations();

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <h2 className="font-bold text-2xl">Klien & Instalasi</h2>
          <p className="text-ink-muted">Data klien dan instalasi mandiri (self-hosted).</p>
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
        </div>
      </div>

      {clients.isError || installations.isError ? (
        <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
          Data klien atau instalasi tidak bisa dimuat.
        </p>
      ) : null}

      <div className="grid gap-4">
        <h3 className="font-semibold text-lg">Daftar Klien</h3>
        {clients.data ? (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Instansi</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Instalasi</TableHead>
                  <TableHead>Terdaftar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-ink-muted">
                      Belum ada klien.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.data.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.institution}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>{client.installationsCount}</TableCell>
                      <TableCell>
                        {new Date(client.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Skeleton className="h-32" />
        )}
      </div>

      <div className="grid gap-4">
        <h3 className="font-semibold text-lg">Daftar Instalasi</h3>
        {installations.data ? (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klien</TableHead>
                  <TableHead>Nama Instalasi</TableHead>
                  <TableHead>ID Instalasi</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Masa Berlaku</TableHead>
                  <TableHead>Versi Terakhir</TableHead>
                  <TableHead>Check-in Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installations.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-ink-muted">
                      Belum ada instalasi.
                    </TableCell>
                  </TableRow>
                ) : (
                  installations.data.map((inst) => (
                    <TableRow key={inst.id}>
                      <TableCell className="font-medium">{inst.clientName}</TableCell>
                      <TableCell>{inst.name}</TableCell>
                      <TableCell className="font-mono text-xs">{inst.instanceId}</TableCell>
                      <TableCell>{inst.plan}</TableCell>
                      <TableCell>
                        {new Date(inst.validFrom).toLocaleDateString('id-ID')} -{' '}
                        {new Date(inst.validUntil).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>{inst.lastVersion || '-'}</TableCell>
                      <TableCell>
                        {inst.lastCheckinAt
                          ? new Date(inst.lastCheckinAt).toLocaleString('id-ID')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Skeleton className="h-32" />
        )}
      </div>
    </div>
  );
}
