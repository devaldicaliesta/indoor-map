import type { Building, Venue } from '@indoor/domain';
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
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@indoor/ui';
import { useState } from 'react';
import { Can } from '../../../app/auth/can';
import { FormNotice } from '../../auth/auth-layout';
import { BuildingDialog } from './building-dialog';
import { useBuildings, useOutdoorLayer, useRemoveBuilding, useSetDefaultBuilding } from './queries';

function DeleteBuildingDialog({
  venue,
  building,
  onClose,
}: {
  venue: Venue;
  building: Building;
  onClose: () => void;
}) {
  const remove = useRemoveBuilding(venue.id);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus {building.name}?</DialogTitle>
          <DialogDescription>
            {building.floorCount > 0
              ? `${building.floorCount} lantai beserta denah, peta, dan jalurnya ikut terhapus dari draft.`
              : 'Gedung ini belum punya lantai.'}
          </DialogDescription>
        </DialogHeader>
        {remove.error ? <FormNotice tone="error">{remove.error.message}</FormNotice> : null}
        <DialogFooter>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(building.id, {
                onSuccess: () => {
                  toast.success(`${building.name} dihapus`);
                  onClose();
                },
              })
            }
          >
            Hapus gedung
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Open =
  | { kind: 'form'; building: Building | null }
  | { kind: 'delete'; building: Building }
  | null;

export function BuildingsPanel({ venue }: { venue: Venue }) {
  const buildings = useBuildings(venue.id);
  const outdoor = useOutdoorLayer(venue.id);
  const setDefault = useSetDefaultBuilding(venue.id);
  const [open, setOpen] = useState<Open>(null);

  const list = buildings.data ?? [];
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-ink-muted">
          Gedung di {venue.name}. Venue dengan satu gedung tetap memakai struktur ini.
        </p>
        <Can action="venue.edit">
          <Button variant="primary" onClick={() => setOpen({ kind: 'form', building: null })}>
            Tambah gedung
          </Button>
        </Can>
      </div>
      {buildings.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : buildings.error ? (
        <p className="text-danger">{buildings.error.message}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead className="text-right">Lantai</TableHead>
              <TableHead>Footprint</TableHead>
              <TableHead>Tampilan awal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((building) => (
              <TableRow key={building.id}>
                <TableCell className="font-bold">{building.name}</TableCell>
                <TableCell className="font-mono">{building.code}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {building.floorCount}
                </TableCell>
                <TableCell>
                  {building.footprint ? (
                    <StatusDot tone="ok">Digambar</StatusDot>
                  ) : (
                    <StatusDot tone="neutral" hollow>
                      Belum
                    </StatusDot>
                  )}
                </TableCell>
                <TableCell>
                  {venue.defaultBuildingId === building.id ? (
                    <Badge variant="signal">Default</Badge>
                  ) : (
                    <Can action="venue.edit">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDefault.mutate(building.id)}
                      >
                        Jadikan default
                      </Button>
                    </Can>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Can action="venue.edit">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => setOpen({ kind: 'form', building })}>
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger"
                        onClick={() => setOpen({ kind: 'delete', building })}
                      >
                        Hapus
                      </Button>
                    </div>
                  </Can>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-bold">{outdoor.data?.name ?? 'Area Luar'}</TableCell>
              <TableCell className="text-ink-muted">—</TableCell>
              <TableCell className="text-right text-ink-muted">1 lapisan</TableCell>
              <TableCell colSpan={2} className="text-ink-muted">
                Jalan, taman, parkir, dan jalur antar-gedung
              </TableCell>
              <TableCell className="text-right">
                <Badge>Selalu ada</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
      {!buildings.isPending && list.length === 0 ? (
        <EmptyState
          title="Belum ada gedung"
          description="Tambah gedung pertama, lalu tambahkan lantai-lantainya."
        />
      ) : null}
      {open?.kind === 'form' ? (
        <BuildingDialog
          venue={venue}
          building={open.building}
          others={list}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {open?.kind === 'delete' ? (
        <DeleteBuildingDialog
          venue={venue}
          building={open.building}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
