import {
  type InfoPoint,
  infoPointUrl,
  lockedFeatureMessage,
  type VenueSummary,
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
  EmptyState,
  type FilterDef,
  queryRows,
  toast,
} from '@indoor/ui';
import { useState } from 'react';
import { useCan } from '../../app/auth/can';
import { useTableState } from '../../hooks/use-table-state';
import { FormNotice } from '../auth/auth-layout';
import { floorLabel } from '../closures/closure-model';
import { useVenueFloors } from '../editor/connectors/queries';
import { useInfoPoints } from '../editor/test-route/queries';
import { useFeature } from '../license/queries';
import { QuotaNotice, useQuotaBlock } from '../license/quota-notice';
import { floorFilter, PATH_FILTER, pathState } from '../origin-points/point-filters';
import { usePublicVisitorUrl } from '../origin-points/queries';
import { InfoPointDialog, type InfoPointDialogTarget } from './info-point-dialog';
import { useRemoveInfoPoint } from './queries';

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

/** Mode tampilan yang benar-benar dipakai layar: 2D yang dipaksa dibedakan dari pilihan 2D. */
const MODES = { '2d': '2D', '3d': '3D', paksa2d: '2D (dipaksa)' } as const;
const modeOf = (point: InfoPoint): keyof typeof MODES =>
  point.force2d ? 'paksa2d' : point.defaultMode;

const MODE_FILTER: FilterDef = {
  kind: 'multi',
  key: 'mode',
  label: 'Mode',
  options: Object.entries(MODES).map(([value, label]) => ({ value, label })),
};

export function InfoPointsPanel({ venue }: { venue: VenueSummary }) {
  const canEdit = useCan('origin_point.edit');
  const points = useInfoPoints(venue.id);
  const places = useVenueFloors(venue.id).data;
  const publicUrl = usePublicVisitorUrl();
  const remove = useRemoveInfoPoint(venue.id);
  const allowed = useFeature('info_point');
  const quota = useQuotaBlock('infoPoints');
  const [dialog, setDialog] = useState<InfoPointDialogTarget>(null);
  const [removing, setRemoving] = useState<InfoPoint | null>(null);
  const filters = [floorFilter(places, points.data), MODE_FILTER, PATH_FILTER];
  const table = useTableState({ filters });

  const ready = points.data && places && !publicUrl.isPending;
  const result = ready
    ? queryRows(points.data ?? [], table.state, {
        text: (point) => [point.name, point.code],
        filters: {
          lantai: (point, values) => values.includes(point.floorId),
          mode: (point, values) => values.includes(modeOf(point)),
          jalur: (point, values) => values.includes(pathState(point)),
        },
      })
    : undefined;
  const base = publicUrl.data ?? null;
  const urlOf = (point: InfoPoint) => (base ? infoPointUrl(base, venue.id, point.code) : null);
  const blocked = allowed ? quota : lockedFeatureMessage('info_point');

  const columns: DataColumn<InfoPoint>[] = [
    { id: 'code', header: 'Kode', className: 'font-mono', cell: (point) => point.code },
    {
      id: 'name',
      header: 'Nama',
      className: 'font-bold',
      cell: (point) => (
        <>
          {point.name}
          {point.nodeId ? null : (
            <span className="block font-normal text-danger text-sm">
              Tidak menempel ke jalur; simpan ulang.
            </span>
          )}
        </>
      ),
    },
    {
      id: 'floor',
      header: 'Gedung dan lantai',
      cell: (point) => (places ? floorLabel(places, point.floorId) : ''),
    },
    {
      id: 'heading',
      header: 'Arah hadap',
      className: 'font-mono tabular-nums',
      cell: (point) => `${number.format(point.headingDeg)}°`,
    },
    {
      id: 'display',
      header: 'Tampilan',
      cell: (point) =>
        `${MODES[modeOf(point)]} · ${point.defaultLanguage.toUpperCase()} · idle ${point.idleSeconds} s`,
    },
    {
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (point) => {
        const link = urlOf(point);
        return (
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
        );
      },
    },
  ];

  return (
    <div className="grid gap-4">
      {publicUrl.isPending || base ? null : (
        <FormNotice tone="error">
          URL Info Point belum bisa dibuat karena URL publik Visitor belum diisi di Pengaturan →
          Sistem.
        </FormNotice>
      )}
      <DataTable
        label="Info Point"
        columns={columns}
        rows={result?.rows}
        rowKey={(point) => point.id}
        total={result?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari nama atau kode Info Point' }}
        filters={filters}
        error={points.error?.message ?? null}
        onRetry={() => void points.refetch()}
        actions={
          canEdit ? (
            <>
              <QuotaNotice message={blocked} />
              <Button
                variant="primary"
                disabled={blocked !== null}
                onClick={() => setDialog({ point: null })}
              >
                Tambah Info Point
              </Button>
            </>
          ) : null
        }
        empty={
          <EmptyState
            title="Belum ada Info Point"
            description="Info Point adalah layar sentuh di venue yang membuka Visitor dengan posisi tetap."
          />
        }
      />
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
      {canEdit && places && points.data ? (
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
