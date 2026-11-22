import { type FeatureId, type Location, orderedUnits, type VenueId } from '@indoor/domain';
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
import { useCallback, useMemo, useState } from 'react';
import { Can, useCan } from '../../app/auth/can';
import { useTableState } from '../../hooks/use-table-state';
import { ImportDialog } from '../import/import-dialog';
import { QuotaNotice, useQuotaBlock } from '../license/quota-notice';
import { useBuildings, useOutdoorLayer } from '../venues/buildings/queries';
import { useFloors } from '../venues/floors/queries';
import { BulkEditDialog } from './bulk-edit-dialog';
import {
  BulkUndoBanner,
  SelectCheckbox,
  SelectionBar,
  useLocationSelection,
} from './bulk-selection';
import { DeleteLocationDialog } from './delete-location-dialog';
import { buildingNames, floorNames, LOCATION_STATUS_LABELS, LOCATION_STATUS_TONE } from './labels';
import { LocationSheet } from './location-sheet';
import { LOCATION_FILTER, locationFilters, toLocationPageFilters } from './location-table';
import {
  useCategories,
  useLocationCodes,
  useLocationPage,
  useLocationTypes,
  useVenueUnits,
} from './queries';
import { type DeepLinkTarget, useDeepLink, useSelectedBuilding } from './use-location-deep-link';

type Open =
  | { kind: 'form'; location: Location | null; unitId: FeatureId | null }
  | { kind: 'delete'; location: Location }
  | { kind: 'bulk' }
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

export function LocationsPanel({ venueId }: { venueId: VenueId }) {
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
  const openForm = useCallback(
    (target: DeepLinkTarget) => setOpen({ kind: 'form', ...target }),
    [],
  );
  useDeepLink(venueId, openForm);

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
  const pageFilters = toLocationPageFilters(table.state);
  const result = useLocationPage(venueId, { q, filters: pageFilters, page, size });
  const selection = useLocationSelection(JSON.stringify([q, pageFilters]));
  const pageIds = result.data?.rows.map((l) => l.id) ?? [];
  const pageSelected = pageIds.filter((id) => selection.has(id)).length;

  const typeName = (id: string) => types.data?.find((t) => t.id === id)?.name ?? '';
  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const selectColumn: DataColumn<Location> = {
    id: 'select',
    className: 'w-10',
    header: (
      <SelectCheckbox
        label="Pilih semua lokasi di halaman ini"
        tour="locations-select"
        checked={pageIds.length > 0 && pageSelected === pageIds.length}
        indeterminate={pageSelected > 0 && pageSelected < pageIds.length}
        onChange={(checked) => selection.setMany(pageIds, checked)}
      />
    ),
    cell: (l) => (
      <SelectCheckbox
        label={`Pilih ${l.name}`}
        checked={selection.has(l.id)}
        onChange={() => selection.toggle(l.id)}
      />
    ),
  };
  const columns: DataColumn<Location>[] = [
    ...(canEdit ? [selectColumn] : []),
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
      <BulkUndoBanner
        venueId={venueId}
        types={types.data ?? []}
        categories={categories.data ?? []}
        canEdit={canEdit}
      />
      {canEdit ? (
        <SelectionBar
          venueId={venueId}
          selection={selection}
          total={result.data?.total ?? 0}
          q={q}
          filters={pageFilters}
          onEdit={() => setOpen({ kind: 'bulk' })}
        />
      ) : null}
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
      {open?.kind === 'bulk' && types.data ? (
        <BulkEditDialog
          venueId={venueId}
          ids={[...selection.ids]}
          types={types.data}
          categories={categories.data ?? []}
          onDone={() => {
            selection.clear();
            setOpen(null);
          }}
          onClose={() => setOpen(null)}
        />
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
