import type { Building, Floor } from '@indoor/domain';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
import { Can } from '../../../app/auth/can';
import { FloorForm } from './floor-form';
import { useFloors, useRemoveFloor, useSaveFloor, useSetDefaultFloor } from './queries';

function DeleteFloorDialog({
  building,
  floor,
  onClose,
}: {
  building: Building;
  floor: Floor;
  onClose: () => void;
}) {
  const remove = useRemoveFloor(building.id);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus lantai {floor.name}?</DialogTitle>
          <DialogDescription>
            {floor.featureCount > 0
              ? `${floor.featureCount} fitur peta di lantai ini (unit, dinding, fasilitas, jalur) ikut terhapus dari draft.`
              : 'Lantai ini belum berisi fitur peta.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(floor.id, {
                onSuccess: () => {
                  toast.success(`Lantai ${floor.name} dihapus`);
                  onClose();
                },
                onError: (error) =>
                  toast.error('Lantai tidak dihapus', { description: error.message }),
              })
            }
          >
            {floor.featureCount > 0
              ? `Hapus lantai dan ${floor.featureCount} fitur`
              : 'Hapus lantai'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FloorsSheet({ building, onClose }: { building: Building; onClose: () => void }) {
  const floors = useFloors(building.id);
  const save = useSaveFloor(building.id);
  const setDefault = useSetDefaultFloor(building.id);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [deleting, setDeleting] = useState<Floor | null>(null);
  const list = floors.data ?? [];
  const nextLevel = list.length ? Math.max(...list.map((f) => f.level)) + 1 : 0;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[40rem] sm:max-w-none">
        <SheetHeader>
          <SheetTitle>Lantai {building.name}</SheetTitle>
          <SheetDescription>
            Urutan mengikuti level: lantai atas di atas, B1 (−1) di bawah GF (0).
          </SheetDescription>
        </SheetHeader>
        {floors.isPending ? (
          <Skeleton className="h-32" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Level</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Tinggi</TableHead>
                <TableHead className="text-right">Fitur</TableHead>
                <TableHead>Tampilan awal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((floor) => (
                <TableRow key={floor.id}>
                  <TableCell className="text-right font-mono tabular-nums">{floor.level}</TableCell>
                  <TableCell className="font-bold font-mono">{floor.name}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {floor.heightM} m
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {floor.featureCount}
                  </TableCell>
                  <TableCell>
                    {building.defaultFloorId === floor.id ? (
                      <Badge variant="signal">Default</Badge>
                    ) : (
                      <Can action="venue.edit">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDefault.mutate(floor.id)}
                        >
                          Jadikan default
                        </Button>
                      </Can>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Can action="venue.edit">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={() => setEditing(floor)}>
                          Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger"
                          onClick={() => setDeleting(floor)}
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
        <Can action="venue.edit">
          <FloorForm
            key={editing?.id ?? 'new'}
            floor={editing}
            suggestedLevel={nextLevel}
            pending={save.isPending}
            error={save.error?.message ?? null}
            onSubmit={(input, done) =>
              save.mutate(
                { id: editing?.id ?? null, input },
                {
                  onSuccess: () => {
                    done();
                    setEditing(null);
                  },
                },
              )
            }
            {...(editing ? { onCancel: () => setEditing(null) } : {})}
          />
        </Can>
        {deleting ? (
          <DeleteFloorDialog
            building={building}
            floor={deleting}
            onClose={() => setDeleting(null)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
