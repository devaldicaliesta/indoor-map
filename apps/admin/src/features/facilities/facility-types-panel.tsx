import type { FacilityTypeWithUsage } from '@indoor/data';
import type { VenueId } from '@indoor/domain';
import {
  Badge,
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
import { Can } from '../../app/auth/can';
import { useTableState } from '../../hooks/use-table-state';
import { FormNotice } from '../auth/auth-layout';
import { FacilityIconPreview } from './facility-icon-preview';
import { FacilityTypeDialog } from './facility-type-dialog';
import { iconSource } from './icons';
import { useFacilityTypes, useRemoveFacilityType } from './queries';

function DeleteFacilityTypeDialog({
  venueId,
  type,
  onClose,
}: {
  venueId: VenueId;
  type: FacilityTypeWithUsage;
  onClose: () => void;
}) {
  const remove = useRemoveFacilityType(venueId);
  const inUse = type.usageCount > 0;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {inUse ? `${type.name} masih dipakai` : `Hapus jenis ${type.name}?`}
          </DialogTitle>
          <DialogDescription>
            {inUse
              ? `Jenis ini dipakai ${type.usageCount} fasilitas sehingga tidak bisa dihapus. Ganti jenisnya atau hapus fasilitas tersebut di Editor Peta lebih dulu.`
              : 'Jenis ini belum dipakai fasilitas mana pun. Ikon unggahannya ikut terhapus.'}
          </DialogDescription>
        </DialogHeader>
        {remove.error ? <FormNotice tone="error">{remove.error.message}</FormNotice> : null}
        <DialogFooter>
          <Button onClick={onClose}>{inUse ? 'Tutup' : 'Batal'}</Button>
          {inUse ? null : (
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(type, {
                  onSuccess: () => {
                    toast.success(`Jenis ${type.name} dihapus`);
                    onClose();
                  },
                })
              }
            >
              Hapus jenis
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Open =
  | { kind: 'form'; type: FacilityTypeWithUsage | null }
  | { kind: 'delete'; type: FacilityTypeWithUsage }
  | null;

const FILTERS: FilterDef[] = [
  {
    kind: 'select',
    key: 'keselamatan',
    label: 'Keselamatan',
    allLabel: 'Semua jenis',
    options: [
      { value: 'ya', label: 'Fasilitas keselamatan' },
      { value: 'tidak', label: 'Bukan keselamatan' },
    ],
  },
  {
    kind: 'select',
    key: 'pemakaian',
    label: 'Pemakaian',
    allLabel: 'Semua pemakaian',
    options: [
      { value: 'dipakai', label: 'Dipakai fasilitas' },
      { value: 'belum', label: 'Belum dipakai' },
    ],
  },
];

export function FacilityTypesPanel({
  venueId,
  venueName,
}: {
  venueId: VenueId;
  venueName: string;
}) {
  const types = useFacilityTypes(venueId);
  const [open, setOpen] = useState<Open>(null);
  const table = useTableState({ filters: FILTERS });
  const list = types.data ?? [];
  const result = types.data
    ? queryRows(types.data, table.state, {
        text: (type) => [type.name],
        filters: {
          keselamatan: (type, values) => values.includes(type.isSafety ? 'ya' : 'tidak'),
          pemakaian: (type, values) => values.includes(type.usageCount > 0 ? 'dipakai' : 'belum'),
        },
      })
    : undefined;

  const columns: DataColumn<FacilityTypeWithUsage>[] = [
    {
      id: 'icon',
      header: 'Ikon',
      className: 'w-12',
      cell: (type) => (
        <FacilityIconPreview
          source={iconSource(type.icon)}
          isSafety={type.isSafety}
          label={`Ikon ${type.name}`}
        />
      ),
    },
    { id: 'name', header: 'Nama', className: 'font-bold', cell: (type) => type.name },
    {
      id: 'safety',
      header: 'Keselamatan',
      cell: (type) => (type.isSafety ? <Badge variant="danger">Ya</Badge> : null),
    },
    {
      id: 'usage',
      header: 'Dipakai',
      className: 'text-right font-mono tabular-nums',
      cell: (type) => type.usageCount,
    },
    {
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (type) => (
        <Can action="settings.edit">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setOpen({ kind: 'form', type })}>
              Ubah
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              onClick={() => setOpen({ kind: 'delete', type })}
            >
              Hapus
            </Button>
          </div>
        </Can>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <p className="text-ink-muted">
        Jenis fasilitas di {venueName}, misalnya toilet, musala, ATM, dan APAR.
      </p>
      <DataTable
        label="Jenis fasilitas"
        columns={columns}
        rows={result?.rows}
        rowKey={(type) => type.id}
        total={result?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari nama jenis fasilitas' }}
        filters={FILTERS}
        error={types.error?.message ?? null}
        onRetry={() => void types.refetch()}
        actions={
          <Can action="settings.edit">
            <Button variant="primary" onClick={() => setOpen({ kind: 'form', type: null })}>
              Tambah jenis
            </Button>
          </Can>
        }
        empty={
          <EmptyState
            title="Belum ada jenis fasilitas"
            description="Tambahkan jenis agar fasilitas bisa ditaruh di Editor Peta."
          />
        }
      />
      {open?.kind === 'form' ? (
        <FacilityTypeDialog
          venueId={venueId}
          type={open.type}
          others={list}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {open?.kind === 'delete' ? (
        <DeleteFacilityTypeDialog
          venueId={venueId}
          type={open.type}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
