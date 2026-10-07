import type { Building, Venue } from '@indoor/domain';
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
  hasActiveFilters,
  queryRows,
  StatusDot,
  toast,
} from '@indoor/ui';
import { useState } from 'react';
import { Can } from '../../../app/auth/can';
import { useTableState } from '../../../hooks/use-table-state';
import { FormNotice } from '../../auth/auth-layout';
import { QuotaNotice, useQuotaBlock } from '../../license/quota-notice';
import { FloorsSheet } from '../floors/floors-sheet';
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
  | { kind: 'floors'; building: Building }
  | null;

/** Area Luar ikut tampil sebagai baris tetap: lapisan yang selalu ada di setiap venue. */
type BuildingRow = { kind: 'building'; building: Building } | { kind: 'outdoor'; name: string };

const FOOTPRINT = { drawn: 'digambar', missing: 'belum' } as const;

const FILTERS: FilterDef[] = [
  {
    kind: 'select',
    key: 'footprint',
    label: 'Footprint',
    allLabel: 'Semua footprint',
    options: [
      { value: FOOTPRINT.drawn, label: 'Digambar' },
      { value: FOOTPRINT.missing, label: 'Belum digambar' },
    ],
  },
];

/** Tab Gedung berbagi URL dengan tab Semua venue (`v.`) dan sheet Lantai. */
const BUILDING_PREFIX = 'g.';

const rowKey = (row: BuildingRow) => (row.kind === 'building' ? row.building.id : 'outdoor');

export function BuildingsPanel({ venue }: { venue: Venue }) {
  const buildings = useBuildings(venue.id);
  const outdoor = useOutdoorLayer(venue.id);
  const setDefault = useSetDefaultBuilding(venue.id);
  const [open, setOpen] = useState<Open>(null);
  const buildingQuota = useQuotaBlock('buildings');
  const table = useTableState({ filters: FILTERS, prefix: BUILDING_PREFIX });

  const list = buildings.data ?? [];
  const result = buildings.data
    ? queryRows<BuildingRow>(
        [
          ...list.map((building) => ({ kind: 'building' as const, building })),
          { kind: 'outdoor', name: outdoor.data?.name ?? 'Area Luar' },
        ],
        table.state,
        {
          text: (row) =>
            row.kind === 'building' ? [row.building.name, row.building.code] : [row.name],
          filters: {
            footprint: (row, values) =>
              row.kind === 'building' &&
              values.includes(row.building.footprint ? FOOTPRINT.drawn : FOOTPRINT.missing),
          },
        },
      )
    : undefined;

  const columns: DataColumn<BuildingRow>[] = [
    {
      id: 'name',
      header: 'Nama',
      className: 'font-bold',
      cell: (row) => (row.kind === 'building' ? row.building.name : row.name),
    },
    {
      id: 'code',
      header: 'Kode',
      className: 'font-mono',
      cell: (row) =>
        row.kind === 'building' ? row.building.code : <span className="text-ink-muted">—</span>,
    },
    {
      id: 'floors',
      header: 'Lantai',
      className: 'text-right font-mono tabular-nums',
      cell: (row) =>
        row.kind === 'building' ? (
          row.building.floorCount
        ) : (
          <span className="font-sans text-ink-muted">1 lapisan</span>
        ),
    },
    {
      id: 'footprint',
      header: 'Footprint',
      cell: (row) =>
        row.kind === 'outdoor' ? (
          <span className="text-ink-muted">Jalan, taman, parkir, dan jalur antar-gedung</span>
        ) : row.building.footprint ? (
          <StatusDot tone="ok">Digambar</StatusDot>
        ) : (
          <StatusDot tone="neutral" hollow>
            Belum
          </StatusDot>
        ),
    },
    {
      id: 'default',
      header: 'Tampilan awal',
      cell: (row) =>
        row.kind === 'outdoor' ? null : venue.defaultBuildingId === row.building.id ? (
          <Badge variant="signal">Default</Badge>
        ) : (
          <Can action="venue.edit">
            <Button size="sm" variant="ghost" onClick={() => setDefault.mutate(row.building.id)}>
              Jadikan default
            </Button>
          </Can>
        ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (row) => {
        if (row.kind === 'outdoor') return <Badge>Selalu ada</Badge>;
        const { building } = row;
        return (
          <Can action="venue.edit">
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={() => setOpen({ kind: 'floors', building })}>
                Lantai
              </Button>
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
        );
      },
    },
  ];

  return (
    <div className="grid gap-4">
      <p className="text-ink-muted">
        Gedung di {venue.name}. Venue dengan satu gedung tetap memakai struktur ini.
      </p>
      <DataTable
        label="Gedung"
        columns={columns}
        rows={result?.rows}
        rowKey={rowKey}
        total={result?.total ?? 0}
        table={table}
        search={{ placeholder: 'Cari nama atau kode gedung' }}
        filters={FILTERS}
        error={buildings.error?.message ?? null}
        onRetry={() => void buildings.refetch()}
        actions={
          <Can action="venue.edit">
            <QuotaNotice message={buildingQuota} />
            <Button
              variant="primary"
              disabled={buildingQuota !== null}
              onClick={() => setOpen({ kind: 'form', building: null })}
            >
              Tambah gedung
            </Button>
          </Can>
        }
        empty={null}
      />
      {buildings.data && list.length === 0 && !hasActiveFilters(table.state) ? (
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
      {open?.kind === 'floors' ? (
        <FloorsSheet
          buildings={list}
          initialBuildingId={open.building.id}
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
