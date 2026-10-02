import {
  type Closure,
  type ClosureStatus,
  can,
  closureStatus,
  closureTarget,
  type VenueSummary,
} from '@indoor/domain';
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
import { useRole } from '../../app/auth/can';
import { inVenueTime } from '../../app/format';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { FormNotice } from '../auth/auth-layout';
import { CLOSURE_REFRESH_MS } from '../editor/graph/graph-queries';
import { useNow } from '../editor/graph/graph-status';
import { ClosureDialog } from './closure-dialog';
import { useClosureDialog } from './closure-dialog-store';
import { type ClosurePlaces, sortByStart, targetLabel } from './closure-model';
import { EndsDialog } from './ends-dialog';
import {
  useClosureMutations,
  useClosureNetwork,
  useCurrentClosures,
  useVenueTimezone,
} from './queries';
import { TargetPicker } from './target-picker';

const SECTIONS: { status: Exclude<ClosureStatus, 'ended'>; title: string; empty: string }[] = [
  { status: 'active', title: 'Sedang berlaku', empty: 'Tidak ada penutupan yang sedang berlaku.' },
  { status: 'scheduled', title: 'Terjadwal', empty: 'Tidak ada penutupan terjadwal.' },
];

function ClosureTable({
  venue,
  closures,
  places,
  status,
  canManage,
  onEditEnds,
}: {
  venue: VenueSummary;
  closures: readonly Closure[];
  places: ClosurePlaces | null;
  status: Exclude<ClosureStatus, 'ended'>;
  canManage: boolean;
  onEditEnds: (closure: Closure) => void;
}) {
  const { setEndsAt, remove } = useClosureMutations(venue.id);
  const timezone = useVenueTimezone(venue.id);
  const pending = setEndsAt.isPending || remove.isPending;
  const end = (closure: Closure) => {
    // Yang belum mulai dibatalkan (dihapus): waktu selesai tidak boleh sebelum waktu mulai.
    if (status === 'scheduled') {
      remove.mutate(closure.id, { onSuccess: () => toast.success('Penutupan dibatalkan') });
    } else {
      setEndsAt.mutate(
        { id: closure.id, endsAt: new Date().toISOString() },
        { onSuccess: () => toast.success('Penutupan diakhiri') },
      );
    }
  };
  const error = setEndsAt.error ?? remove.error;
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Yang ditutup</TableHead>
            <TableHead>Alasan</TableHead>
            <TableHead>Mulai</TableHead>
            <TableHead>Selesai</TableHead>
            {canManage ? <TableHead className="text-right">Aksi</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {closures.map((closure) => (
            <TableRow key={closure.id}>
              <TableCell className="font-bold">
                {places ? targetLabel(places, closureTarget(closure)) : '…'}
              </TableCell>
              <TableCell>{closure.reason}</TableCell>
              <TableCell>{inVenueTime(closure.startsAt, timezone)}</TableCell>
              <TableCell>
                {closure.endsAt ? (
                  inVenueTime(closure.endsAt, timezone)
                ) : (
                  <Badge>Sampai diakhiri</Badge>
                )}
              </TableCell>
              {canManage ? (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEditEnds(closure)}>
                      Ubah waktu selesai
                    </Button>
                    <Button size="sm" disabled={pending} onClick={() => end(closure)}>
                      {status === 'scheduled' ? 'Batalkan' : 'Akhiri sekarang'}
                    </Button>
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error ? <FormNotice tone="error">{error.message}</FormNotice> : null}
    </>
  );
}

function Closures({ venue }: { venue: VenueSummary }) {
  const role = useRole();
  const canManage = role !== null && can(role, 'closure.manage');
  const closures = useCurrentClosures(venue.id);
  const network = useClosureNetwork(venue.id);
  // Daftar dikelompokkan ulang tiap menit, jadi penutupan yang lewat waktunya hilang sendiri.
  const now = useNow(CLOSURE_REFRESH_MS);
  const [editing, setEditing] = useState<Closure | null>(null);

  if (closures.isPending) return <Skeleton className="h-64 w-full" />;
  if (closures.error) return <p className="text-danger">{closures.error.message}</p>;
  const byStatus = (status: ClosureStatus) =>
    sortByStart(closures.data.filter((c) => closureStatus(c, new Date(now)) === status));

  return (
    <div className="grid gap-8">
      {canManage ? (
        network ? (
          <TargetPicker
            places={network.places}
            onPick={(target) => useClosureDialog.getState().open(target)}
          />
        ) : (
          <Skeleton className="h-16 w-96" />
        )
      ) : null}
      {SECTIONS.map(({ status, title, empty }) => {
        const list = byStatus(status);
        return (
          <section key={status} className="grid gap-2" aria-labelledby={`closures-${status}`}>
            <h2 id={`closures-${status}`} className="font-bold text-lg">
              {title}
            </h2>
            {list.length === 0 ? (
              <p className="text-ink-muted">{empty}</p>
            ) : (
              <ClosureTable
                venue={venue}
                closures={list}
                places={network?.places ?? null}
                status={status}
                canManage={canManage}
                onEditEnds={setEditing}
              />
            )}
          </section>
        );
      })}
      {canManage ? <ClosureDialog venueId={venue.id} /> : null}
      <EndsDialog venueId={venue.id} closure={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

export function ClosuresPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="closures">
      {(access) => (
        <ModulePage module="closures" access={access}>
          {venue ? (
            <Closures key={venue.id} venue={venue} />
          ) : (
            <EmptyState
              title="Belum ada venue"
              description="Buat venue di menu Venue untuk mengatur penutupan."
            />
          )}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
