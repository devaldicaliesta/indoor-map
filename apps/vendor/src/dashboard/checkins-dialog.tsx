import type { VendorInstallation } from '@indoor/domain';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import { formatDateTime } from '../copy';
import { useCheckins } from './use-releases';

function History({ installationId }: { installationId: string }) {
  const checkins = useCheckins(installationId);
  if (checkins.isError) {
    return (
      <p role="alert" className="border-danger border-l-4 bg-surface py-2 pl-3 text-danger">
        Riwayat check-in tidak bisa dimuat.
      </p>
    );
  }
  if (!checkins.data) return <Skeleton className="h-32" />;
  if (checkins.data.length === 0) {
    return <p className="text-ink-muted">Instalasi ini belum pernah check-in ke server vendor.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Versi</TableHead>
            <TableHead>Alamat IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkins.data.map((checkin, index) => (
            <TableRow key={`${checkin.at}-${index}`}>
              <TableCell>{formatDateTime(checkin.at)}</TableCell>
              <TableCell>{checkin.version ?? 'Tidak dilaporkan'}</TableCell>
              <TableCell className="font-mono text-xs">{checkin.ip ?? '–'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CheckinsDialog({
  installation,
  onClose,
}: {
  installation: VendorInstallation | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={installation !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {installation ? (
          <>
            <DialogHeader>
              <DialogTitle>
                Check-in {installation.clientName} · {installation.name}
              </DialogTitle>
              <DialogDescription>
                50 check-in terakhir dari instalasi{' '}
                <span className="font-mono">{installation.instanceId}</span>. Instalasi menanyakan
                status lisensi ke server vendor setiap hari.
              </DialogDescription>
            </DialogHeader>
            <History installationId={installation.id} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
