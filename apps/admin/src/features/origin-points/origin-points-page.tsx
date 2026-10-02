import { can, type OriginPoint, originPointUrl, type VenueSummary } from '@indoor/domain';
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
import { Link } from 'react-router';
import { useRole } from '../../app/auth/can';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { FormNotice } from '../auth/auth-layout';
import { floorLabel } from '../closures/closure-model';
import { useVenueFloors } from '../editor/connectors/queries';
import { OriginDialog, type OriginDialogTarget } from './origin-dialog';
import { downloadPdf, downloadPng, qrCard } from './qr-download';
import { useOriginPoints, usePublicVisitorUrl, useRemoveOriginPoint } from './queries';

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

function NoPublicUrl({ superAdmin }: { superAdmin: boolean }) {
  return (
    <FormNotice tone="error">
      QR belum bisa dibuat karena URL publik Visitor belum diisi.{' '}
      {superAdmin ? (
        <Link to="/settings" className="underline">
          Isi di Pengaturan → Sistem.
        </Link>
      ) : (
        'Minta Super Admin mengisinya di Pengaturan → Sistem.'
      )}
    </FormNotice>
  );
}

function Origins({ venue }: { venue: VenueSummary }) {
  const role = useRole();
  const canEdit = role !== null && can(role, 'origin_point.edit');
  const points = useOriginPoints(venue.id);
  const places = useVenueFloors(venue.id).data;
  const publicUrl = usePublicVisitorUrl();
  const remove = useRemoveOriginPoint(venue.id);
  const [dialog, setDialog] = useState<OriginDialogTarget>(null);
  const [removing, setRemoving] = useState<OriginPoint | null>(null);

  if (points.isPending || !places || publicUrl.isPending) return <Skeleton className="h-64" />;
  if (points.error) return <p className="text-danger">{points.error.message}</p>;
  const url = publicUrl.data ?? null;
  const qrUrl = (point: OriginPoint) => (url ? originPointUrl(url, venue.id, point.code) : null);
  const place = (point: OriginPoint) => `${point.name} · ${floorLabel(places, point.floorId)}`;

  return (
    <div className="grid gap-4">
      {url ? null : <NoPublicUrl superAdmin={role !== null && can(role, 'settings.system')} />}
      {canEdit ? (
        <Button
          variant="primary"
          className="justify-self-start"
          disabled={!url}
          onClick={() => setDialog({ point: null })}
        >
          Tambah titik asal
        </Button>
      ) : null}
      {points.data.length === 0 ? (
        <EmptyState
          title="Belum ada QR titik asal"
          description="QR titik asal membuka Visitor dengan posisi dan arah hadap pengunjung."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Gedung dan lantai</TableHead>
              <TableHead>Arah hadap</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.data.map((point) => {
              const link = qrUrl(point);
              return (
                <TableRow key={point.id}>
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
                  <TableCell className="font-mono">{point.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!link}
                        onClick={() =>
                          link && downloadPdf(qrCard(venue.name, link, place(point)), point.name)
                        }
                      >
                        PDF A6
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!link}
                        onClick={() =>
                          link && downloadPng(qrCard(venue.name, link, '').matrix, point.name)
                        }
                      >
                        PNG
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!link}
                        onClick={() => link && window.open(link, '_blank', 'noopener')}
                      >
                        Coba
                      </Button>
                      {canEdit ? (
                        <>
                          <Button size="sm" onClick={() => setDialog({ point })}>
                            Ubah
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={remove.isPending}
                            onClick={() => setRemoving(point)}
                          >
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
            <DialogTitle>Hapus titik asal “{removing?.name}”?</DialogTitle>
            <DialogDescription>
              QR yang sudah dicetak untuk titik ini tidak berlaku lagi.
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
                remove.mutate(removing.id, {
                  onSuccess: () => {
                    toast.success('Titik asal dihapus');
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
        <OriginDialog
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

export function OriginPointsPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="origin_points">
      {(access) => (
        <ModulePage module="origin_points" access={access}>
          {venue ? (
            <Origins key={venue.id} venue={venue} />
          ) : (
            <EmptyState
              title="Belum ada venue"
              description="Buat venue di menu Venue untuk mengatur QR titik asal."
            />
          )}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
