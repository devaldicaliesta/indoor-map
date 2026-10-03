import {
  can,
  type InfoPoint,
  infoPointUrl,
  lockedFeatureMessage,
  type VenueSummary,
} from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { FormNotice } from '../auth/auth-layout';
import { floorLabel } from '../closures/closure-model';
import { useVenueFloors } from '../editor/connectors/queries';
import { useInfoPoints } from '../editor/test-route/queries';
import { useFeature } from '../license/queries';
import { QuotaNotice, useQuotaBlock } from '../license/quota-notice';
import { usePublicVisitorUrl } from '../origin-points/queries';
import { InfoPointDialog, type InfoPointDialogTarget } from './info-point-dialog';
import { useRemoveInfoPoint } from './queries';

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

export function InfoPointsPanel({ venue }: { venue: VenueSummary }) {
  const role = useRole();
  const canEdit = role !== null && can(role, 'origin_point.edit');
  const points = useInfoPoints(venue.id);
  const places = useVenueFloors(venue.id).data;
  const publicUrl = usePublicVisitorUrl();
  const remove = useRemoveInfoPoint(venue.id);
  const allowed = useFeature('info_point');
  const quota = useQuotaBlock('infoPoints');
  const [dialog, setDialog] = useState<InfoPointDialogTarget>(null);
  const [removing, setRemoving] = useState<InfoPoint | null>(null);

  if (points.isPending || !places || publicUrl.isPending) return <Skeleton className="h-64" />;
  if (points.error) return <p className="text-danger">{points.error.message}</p>;
  const base = publicUrl.data ?? null;
  const urlOf = (point: InfoPoint) => (base ? infoPointUrl(base, venue.id, point.code) : null);
  const blocked = allowed ? quota : lockedFeatureMessage('info_point');

  return (
    <div className="grid gap-4">
      {base ? null : (
        <FormNotice tone="error">
          URL Info Point belum bisa dibuat karena URL publik Visitor belum diisi di Pengaturan →
          Sistem.
        </FormNotice>
      )}
      {canEdit ? (
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            disabled={blocked !== null}
            onClick={() => setDialog({ point: null })}
          >
            Tambah Info Point
          </Button>
          <QuotaNotice message={blocked} />
        </div>
      ) : null}
      {points.data.length === 0 ? (
        <EmptyState
          title="Belum ada Info Point"
          description="Info Point adalah layar sentuh di venue yang membuka Visitor dengan posisi tetap."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Gedung dan lantai</TableHead>
              <TableHead>Arah hadap</TableHead>
              <TableHead>Tampilan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.data.map((point) => {
              const link = urlOf(point);
              return (
                <TableRow key={point.id}>
                  <TableCell className="font-mono">{point.code}</TableCell>
                  <TableCell className="font-bold">
                    {point.name}
                    {point.nodeId ? null : (
                      <span className="block font-normal text-danger text-sm">
                        Tidak menempel ke jalur; simpan ulang.
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{floorLabel(places, point.floorId)}</TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {number.format(point.headingDeg)}°
                  </TableCell>
                  <TableCell>
                    {point.force2d ? '2D (dipaksa)' : point.defaultMode.toUpperCase()} ·{' '}
                    {point.defaultLanguage.toUpperCase()} · idle {point.idleSeconds} s
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!link}
                        onClick={() =>
                          link &&
                          void navigator.clipboard
                            .writeText(link)
                            .then(() => toast.success('URL Info Point disalin'))
                            .catch(() => toast.error(`Salin manual: ${link}`))
                        }
                      >
                        Salin URL Info Point
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!link}
                        onClick={() => link && window.open(link, '_blank', 'noopener')}
                      >
                        Preview
                      </Button>
                      {canEdit ? (
                        <>
                          <Button size="sm" onClick={() => setDialog({ point })}>
                            Ubah
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRemoving(point)}>
                            Hapus
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {remove.error ? <FormNotice tone="error">{remove.error.message}</FormNotice> : null}
      <Dialog open={removing !== null} onOpenChange={(open) => (open ? null : setRemoving(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Info Point “{removing?.name}”?</DialogTitle>
            <DialogDescription>
              Layar yang membuka URL Info Point ini tidak berfungsi lagi setelah publish berikutnya.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() =>
                removing &&
                remove.mutate(removing, {
                  onSuccess: () => {
                    toast.success('Info Point dihapus');
                    setRemoving(null);
                  },
                })
              }
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {canEdit ? (
        <InfoPointDialog
          venueId={venue.id}
          places={places}
          points={points.data}
          target={dialog}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
