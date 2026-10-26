import {
  type BuildingId,
  BuildingIdSchema,
  type FeatureId,
  FeatureIdSchema,
  type Location,
  LocationIdSchema,
  orderedUnits,
  type VenueId,
} from '@indoor/domain';
import {
  Button,
  type DataColumn,
  DataTable,
  EmptyState,
  type FilterUpdate,
  StatusDot,
  type TableController,
} from '@indoor/ui';
import { TriangleAlertIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Can, useCan, useRole } from '../../app/auth/can';
import { useTableState } from '../../hooks/use-table-state';
import { ImportDialog } from '../import/import-dialog';
import { QuotaNotice, useQuotaBlock } from '../license/quota-notice';
import { useBuildings, useOutdoorLayer } from '../venues/buildings/queries';
import { useFloors } from '../venues/floors/queries';
import { DeleteLocationDialog } from './delete-location-dialog';
import { buildingNames, floorNames, LOCATION_STATUS_LABELS, LOCATION_STATUS_TONE } from './labels';
import { LocationSheet } from './location-sheet';
import { LOCATION_FILTER, locationFilters, toLocationPageFilters } from './location-table';
import {
  useCategories,
  useLocation,
  useLocationCodes,
  useLocationPage,
  useLocationTypes,
  useVenueUnits,
} from './queries';

type Open =
  | { kind: 'form'; location: Location | null; unitId: FeatureId | null }
  | { kind: 'delete'; location: Location }
  | null;

function UnitCell({ location }: { location: Location }) {
  if (location.units.length === 0) {
    return (
      <span className="inline-flex items-center gap-1">
        <TriangleAlertIcon aria-hidden="true" className="size-4 text-warn" strokeWidth={1.75} />
        Belum tertaut
      </span>
    );
  }
  return (
    <span className="font-mono">
      {orderedUnits(location.units)
        .map((u) => u.unitCode)
        .join(', ')}
    </span>
  );
}

/**
 * Tautan dari editor: `?location=<id>` membuka lokasi (walau di luar halaman tabel saat ini),
 * `?unit=<id>` membuat lokasi untuk unit itu. Parameter tabel lain di URL tetap.
 */
function useDeepLink(venueId: VenueId, open: (value: Open) => void) {
  const [params, setParams] = useSearchParams();
  const locationId = LocationIdSchema.safeParse(params.get('location'));
  const unitId = FeatureIdSchema.safeParse(params.get('unit'));
  const target = useLocation(venueId, locationId.success ? locationId.data : null);
  useEffect(() => {
    if (!unitId.success && (!locationId.success || target.isPending)) return;
    if (target.data) open({ kind: 'form', location: target.data, unitId: null });
    else if (unitId.success) open({ kind: 'form', location: null, unitId: unitId.data });
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('location');
        next.delete('unit');
        return next;
      },
      { replace: true },
    );
  }, [
    locationId.success,
    unitId.success,
    unitId.data,
    target.isPending,
    target.data,
    open,
    setParams,
  ]);
}

/** Gedung terpilih di URL (bukan Area Luar), untuk pilihan filter lantai. */
function useSelectedBuilding(): BuildingId | null {
  const [params] = useSearchParams();
  const parsed = BuildingIdSchema.safeParse(params.get(LOCATION_FILTER.building));
  return parsed.success ? parsed.data : null;
}

export function LocationsPanel({ venueId }: { venueId: VenueId }) {
  const _role = useRole();
  const canEdit = useCan('location.edit');
  const categories = useCategories(venueId);
  const types = useLocationTypes(venueId);
  const units = useVenueUnits(venueId);
  const codes = useLocationCodes(venueId);
  const buildings = useBuildings(venueId);
  const outdoorName = useOutdoorLayer(venueId).data?.name ?? 'Area Luar';
  const floors = useFloors(useSelectedBuilding()).data;
  const [importing, setImporting] = useState(false);
  const locationQuota = useQuotaBlock('locations');
  const [open, setOpen] = useState<Open>(null);
  useDeepLink(venueId, setOpen);

  const filters = locationFilters({
    categories: categories.data,
    types: types.data,
    buildings: buildings.data,
    outdoorName,
    floors,
  });
  const table = useTableState({ filters });
  // Ganti gedung mengosongkan lantai dalam satu perubahan URL (lantai milik gedung lama).
  const controller = useMemo<TableController>(
    () => ({
      ...table,
      setFilter: (key: string, update: FilterUpdate) =>
        key === LOCATION_FILTER.building
          ? table.setFilters({ [key]: update, [LOCATION_FILTER.floor]: [] })
          : table.setFilter(key, update),
    }),
    [table],
  );
  const { q, page, size } = table.state;
  const result = useLocationPage(venueId, {
    q,
    filters: toLocationPageFilters(table.state),
    page,
    size,
  });

  const typeName = (id: string) => types.data?.find((t) => t.id === id)?.name ?? '';
  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const columns: DataColumn<Location>[] = [
    { id: 'code', header: 'Kode', cell: (l) => l.code ?? '—', className: 'font-mono' },
    {
      id: 'name',
      header: 'Nama',
      className: 'min-w-48 whitespace-normal',
      cell: (l) => {
        const text = l.categoryIds.flatMap((id) => categoryName.get(id) ?? []).join(' · ');
        return (
          <>
            <span className="font-bold">{l.name}</span>
            {text ? <span className="block text-ink-muted text-sm">{text}</span> : null}
          </>
        );
      },
    },
    { id: 'type', header: 'Tipe', cell: (l) => typeName(l.locationTypeId) },
    {
      id: 'building',
      header: 'Gedung',
      cell: (l) => buildingNames(l.units, outdoorName).join(', ') || '—',
    },
    { id: 'floor', header: 'Lantai', cell: (l) => floorNames(l.units).join(', ') || '—' },
    { id: 'unit', header: 'Unit', cell: (l) => <UnitCell location={l} /> },
    {
      id: 'status',
      header: 'Status',
      cell: (l) => (
        <StatusDot
          tone={LOCATION_STATUS_TONE[l.status].tone}
          hollow={LOCATION_STATUS_TONE[l.status].hollow}
        >
          {LOCATION_STATUS_LABELS[l.status]}
        </StatusDot>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (location) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={() => setOpen({ kind: 'form', location, unitId: null })}>
            {canEdit ? 'Ubah' : 'Lihat'}
          </Button>
          {canEdit ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              onClick={() => setOpen({ kind: 'delete', location })}
            >
              Hapus
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <DataTable
        label="Lokasi"
        columns={columns}
        rows={result.data?.rows}
        rowKey={(l) => l.id}
        total={result.data?.total ?? 0}
        table={controller}
        search={{ placeholder: 'Cari nama, kode lokasi, atau kode unit' }}
        filters={filters}
        loading={result.isFetching}
        error={result.error?.message ?? null}
        onRetry={() => void result.refetch()}
        actions={
          <Can action="location.edit">
            <Button
              data-tour="locations-import"
              disabled={!types.data?.length}
              onClick={() => setImporting(true)}
            >
              Import
            </Button>
            <QuotaNotice message={locationQuota} />
            <Button
              variant="primary"
              data-tour="locations-add"
              disabled={!types.data?.length || locationQuota !== null}
              onClick={() => setOpen({ kind: 'form', location: null, unitId: null })}
            >
              Tambah lokasi
            </Button>
          </Can>
        }
        empty={
          <EmptyState
            title="Belum ada lokasi"
            description="Tambah lokasi pertama, lalu tautkan ke unit yang sudah digambar di Editor Peta."
          />
        }
      />
      {open?.kind === 'form' && types.data ? (
        <LocationSheet
          key={open.location?.id ?? `new-${open.unitId ?? ''}`}
          venueId={venueId}
          types={types.data}
          location={open.location}
          initialUnitId={open.unitId}
          readOnly={!canEdit}
          locations={codes.data ?? []}
          categories={categories.data ?? []}
          units={units.data ?? []}
          outdoorName={outdoorName}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {importing && types.data ? (
        <ImportDialog venueId={venueId} types={types.data} onClose={() => setImporting(false)} />
      ) : null}
      {open?.kind === 'delete' ? (
        <DeleteLocationDialog
          venueId={venueId}
          location={open.location}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
