import type { FacilityTypeWithUsage } from '@indoor/data';
import type { VenueId } from '@indoor/domain';
import {
  Badge,
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
import { Can } from '../../app/auth/can';
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

/** Pengaturan → Jenis fasilitas (FR-MAP-07). */
export function FacilityTypesPanel({
  venueId,
  venueName,
}: {
  venueId: VenueId;
  venueName: string;
}) {
  const types = useFacilityTypes(venueId);
  const [open, setOpen] = useState<Open>(null);
  const list = types.data ?? [];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-ink-muted">
          Jenis fasilitas di {venueName}, misalnya toilet, musala, ATM, dan APAR.
        </p>
        <Can action="settings.edit">
          <Button variant="primary" onClick={() => setOpen({ kind: 'form', type: null })}>
            Tambah jenis
          </Button>
        </Can>
      </div>
      {types.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : types.error ? (
        <p className="text-danger">{types.error.message}</p>
      ) : list.length === 0 ? (
        <EmptyState
          title="Belum ada jenis fasilitas"
          description="Tambahkan jenis agar fasilitas bisa ditaruh di Editor Peta."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Ikon</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Keselamatan</TableHead>
              <TableHead className="text-right">Dipakai</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((type) => (
              <TableRow key={type.id}>
                <TableCell>
                  <FacilityIconPreview
                    source={iconSource(type.icon)}
                    isSafety={type.isSafety}
                    label={`Ikon ${type.name}`}
                  />
                </TableCell>
                <TableCell className="font-bold">{type.name}</TableCell>
                <TableCell>{type.isSafety ? <Badge variant="danger">Ya</Badge> : null}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {type.usageCount}
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
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
