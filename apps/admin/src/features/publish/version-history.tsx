import type { PublicationEntry } from '@indoor/data';
import type { VenueId } from '@indoor/domain';
import {
  Badge,
  Button,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@indoor/ui';
import { useState } from 'react';
import { Can } from '../../app/auth/can';
import { inVenueTime } from '../../app/format';
import { usePublicationHistory, useRollback } from './queries';
import { ReleaseDialog } from './release-dialog';

function originLabel(entry: PublicationEntry) {
  return entry.origin === 'rollback' ? `Rollback dari v${entry.sourceVersion}` : 'Publish';
}

function RollbackDialog({
  venueId,
  entry,
  onClose,
}: {
  venueId: VenueId;
  entry: PublicationEntry;
  onClose: () => void;
}) {
  const rollback = useRollback(venueId);
  return (
    <ReleaseDialog
      title={`Aktifkan kembali v${entry.version}?`}
      description="Isi versi ini diterbitkan ulang sebagai versi baru dan langsung dibaca Visitor dan Info Point. Draft di editor tidak berubah."
      confirmLabel={`Aktifkan v${entry.version}`}
      pending={rollback.isPending}
      error={rollback.error?.message ?? null}
      onClose={onClose}
      onConfirm={(notes) =>
        rollback.mutate(
          { version: entry.version, notes },
          {
            onSuccess: (result) => {
              toast.success(`Versi ${result.version} aktif`, {
                description: `Berisi peta v${entry.version}.`,
              });
              onClose();
            },
          },
        )
      }
    />
  );
}

/** Riwayat versi: nomor, waktu, penerbit, catatan, asal; versi lama bisa diaktifkan kembali. */
export function VersionHistory({ venueId, timezone }: { venueId: VenueId; timezone: string }) {
  const history = usePublicationHistory(venueId);
  const [target, setTarget] = useState<PublicationEntry | null>(null);

  if (history.isPending) return <Skeleton className="h-32" />;
  if (history.error) {
    return (
      <EmptyState title="Riwayat versi tidak bisa dimuat" description={history.error.message} />
    );
  }
  return (
    <section
      aria-labelledby="history-title"
      className="grid gap-3 rounded-md border border-line bg-surface p-(--panel-padding)"
    >
      <h2 id="history-title" className="font-bold">
        Riwayat versi
      </h2>
      {history.data.length === 0 ? (
        <p className="text-ink-muted">Belum ada versi yang diterbitkan.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Versi</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Penerbit</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Asal</TableHead>
              <TableHead>
                <span className="sr-only">Aksi</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.data.map((entry) => (
              <TableRow key={entry.version}>
                <TableCell className="whitespace-nowrap font-bold font-mono">
                  v{entry.version}{' '}
                  {entry.isActive ? <Badge className="ml-1 font-sans">Aktif</Badge> : null}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {inVenueTime(entry.publishedAt, timezone)}
                </TableCell>
                <TableCell>{entry.publisherName ?? '–'}</TableCell>
                <TableCell className="min-w-48 whitespace-pre-line">{entry.notes ?? '–'}</TableCell>
                <TableCell className="whitespace-nowrap">{originLabel(entry)}</TableCell>
                <TableCell className="text-right">
                  {entry.isActive ? null : (
                    <Can action="publish.rollback">
                      <Button onClick={() => setTarget(entry)}>Aktifkan kembali</Button>
                    </Can>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {target ? (
        <RollbackDialog venueId={venueId} entry={target} onClose={() => setTarget(null)} />
      ) : null}
    </section>
  );
}
