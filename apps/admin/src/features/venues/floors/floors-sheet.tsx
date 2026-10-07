import type { Building, BuildingId, Floor } from '@indoor/domain';
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
  type FilterDef,
  queryRows,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
  useLocalTableState,
} from '@indoor/ui';
import { useState } from 'react';
import { Can } from '../../../app/auth/can';
import { FloorPlanDialog } from '../../floor-plans/floor-plan-dialog';
import { FloorForm } from './floor-form';
import { useBuildingFloors, useRemoveFloor, useSaveFloor, useSetDefaultFloor } from './queries';

function DeleteFloorDialog({
  buildingId,
  floor,
  onClose,
}: {
  buildingId: BuildingId;
  floor: Floor;
  onClose: () => void;
}) {
  const remove = useRemoveFloor();
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
              remove.mutate(
                { buildingId, id: floor.id },
                {
                  onSuccess: () => {
                    toast.success(`Lantai ${floor.name} dihapus`);
                    onClose();
                  },
                  onError: (error) =>
                    toast.error('Lantai tidak dihapus', { description: error.message }),
                },
              )
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

const BUILDING_FILTER = 'gedung';

/**
 * Lantai satu gedung (dibuka dari baris gedungnya), atau semua gedung lewat filter Gedung.
 * Lantai baru selalu ditambahkan ke satu gedung, jadi isian tambah hanya ada bila satu
 * gedung dipilih.
 */
export function FloorsSheet({
  buildings,
  initialBuildingId,
  onClose,
}: {
  buildings: readonly Building[];
  initialBuildingId: BuildingId;
  onClose: () => void;
}) {
  const table = useLocalTableState({ filters: { [BUILDING_FILTER]: [initialBuildingId] } });
  const selected = buildings.find((b) => b.id === table.state.filters[BUILDING_FILTER]?.[0]);
  const floors = useBuildingFloors(selected ? [selected.id] : buildings.map((b) => b.id));
  const save = useSaveFloor();
  const setDefault = useSetDefaultFloor();
  const [editing, setEditing] = useState<Floor | null>(null);
  const [deleting, setDeleting] = useState<Floor | null>(null);
  const [planFor, setPlanFor] = useState<Floor | null>(null);
  const list = floors.data ?? [];
  const nextLevel = list.length ? Math.max(...list.map((f) => f.level)) + 1 : 0;
  const buildingOf = (floor: Floor) => buildings.find((b) => b.id === floor.buildingId);
  const target = editing?.buildingId ?? selected?.id ?? null;

  const filters: FilterDef[] = [
    {
      kind: 'select',
      key: BUILDING_FILTER,
      label: 'Gedung',
      allLabel: 'Semua gedung',
      options: buildings.map((b) => ({ value: b.id, label: b.name })),
    },
  ];
  // Filter Gedung sudah berlaku saat memuat (hanya lantai gedung terpilih), jadi di sini cari saja.
  const result = floors.data
    ? queryRows(floors.data, table.state, { text: (floor) => [floor.name] })
    : undefined;

  const columns: DataColumn<Floor>[] = [
    ...(selected
      ? []
      : [
          {
            id: 'building',
            header: 'Gedung',
            className: 'whitespace-normal',
            cell: (floor: Floor) => buildingOf(floor)?.name ?? '—',
          },
        ]),
    {
      id: 'level',
      header: 'Level',
      className: 'text-right font-mono tabular-nums',
      cell: (floor) => floor.level,
    },
    {
      id: 'name',
      header: 'Nama',
      className: 'whitespace-normal font-bold font-mono',
      cell: (floor) => floor.name,
    },
    {
      id: 'height',
      header: 'Tinggi',
      className: 'text-right font-mono tabular-nums',
      cell: (floor) => `${floor.heightM} m`,
    },
    {
      id: 'features',
      header: 'Fitur',
      className: 'text-right font-mono tabular-nums',
      cell: (floor) => floor.featureCount,
    },
    {
      id: 'default',
      header: 'Tampilan awal',
      cell: (floor) =>
        buildingOf(floor)?.defaultFloorId === floor.id ? (
          <Badge variant="signal">Default</Badge>
        ) : floor.buildingId ? (
          <Can action="venue.edit">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                floor.buildingId &&
                setDefault.mutate({ buildingId: floor.buildingId, id: floor.id })
              }
            >
              Jadikan default
            </Button>
          </Can>
        ) : null,
    },
    {
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (floor) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" onClick={() => setPlanFor(floor)}>
            Denah
          </Button>
          <Can action="venue.edit">
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
          </Can>
        </div>
      ),
    },
  ];

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[48rem] max-w-[calc(100vw-2rem)] sm:max-w-none">
        <SheetHeader>
          <SheetTitle>{selected ? `Lantai ${selected.name}` : 'Lantai semua gedung'}</SheetTitle>
          <SheetDescription>
            Urutan mengikuti level: lantai atas di atas, B1 (−1) di bawah GF (0).
          </SheetDescription>
        </SheetHeader>
        <DataTable
          label="Lantai"
          columns={columns}
          rows={result?.rows}
          rowKey={(floor) => floor.id}
          total={result?.total ?? 0}
          table={table}
          search={{ placeholder: 'Cari nama lantai' }}
          filters={filters}
          error={floors.error?.message ?? null}
          onRetry={() => void floors.refetch()}
          empty={
            <p className="text-ink-muted">
              Belum ada lantai. Tambahkan lantai pertama, misalnya GF dengan level 0.
            </p>
          }
        />
        <Can action="venue.edit">
          {target ? (
            <FloorForm
              key={editing?.id ?? `new-${target}`}
              floor={editing}
              suggestedLevel={nextLevel}
              pending={save.isPending}
              error={save.error?.message ?? null}
              onSubmit={(input, done) =>
                save.mutate(
                  { buildingId: target, id: editing?.id ?? null, input },
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
          ) : (
            <p className="text-ink-muted">
              Pilih satu gedung di filter Gedung untuk menambah lantai.
            </p>
          )}
        </Can>
        {planFor ? <FloorPlanDialog floor={planFor} onClose={() => setPlanFor(null)} /> : null}
        {deleting?.buildingId ? (
          <DeleteFloorDialog
            buildingId={deleting.buildingId}
            floor={deleting}
            onClose={() => setDeleting(null)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
