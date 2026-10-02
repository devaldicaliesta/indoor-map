import {
  can,
  EMPTY_LOCATION_FILTER,
  type FeatureId,
  FeatureIdSchema,
  filterLocations,
  type Location,
  LocationIdSchema,
  orderedUnits,
  type VenueId,
} from '@indoor/domain';
import {
  Button,
  EmptyState,
  Skeleton,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import { TriangleAlertIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Can, useRole } from '../../app/auth/can';
import { ImportDialog } from '../import/import-dialog';
import { useBuildings, useOutdoorLayer } from '../venues/buildings/queries';
import { DeleteLocationDialog } from './delete-location-dialog';
import { buildingNames, floorNames, LOCATION_STATUS_LABELS, LOCATION_STATUS_TONE } from './labels';
import { LocationFilters } from './location-filters';
import { LocationSheet } from './location-sheet';
import { useCategories, useLocations, useLocationTypes, useVenueUnits } from './queries';

const PAGE_SIZE = 50;

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

/** Lokasi dari tautan editor: `?location=<id>` membuka lokasi, `?unit=<id>` membuat lokasi untuk unit itu. */
function useDeepLink(locations: readonly Location[] | undefined, open: (value: Open) => void) {
  const [params, setParams] = useSearchParams();
  const locationId = LocationIdSchema.safeParse(params.get('location'));
  const unitId = FeatureIdSchema.safeParse(params.get('unit'));
  useEffect(() => {
    if (!locations || (!locationId.success && !unitId.success)) return;
    const found = locationId.success ? locations.find((l) => l.id === locationId.data) : undefined;
    if (found) open({ kind: 'form', location: found, unitId: null });
    else if (unitId.success) open({ kind: 'form', location: null, unitId: unitId.data });
    setParams({}, { replace: true });
  }, [
    locations,
    locationId.success,
    locationId.data,
    unitId.success,
    unitId.data,
    open,
    setParams,
  ]);
}

export function LocationsPanel({ venueId }: { venueId: VenueId }) {
  const role = useRole();
  const canEdit = role !== null && can(role, 'location.edit');
  const locations = useLocations(venueId);
  const categories = useCategories(venueId);
  const types = useLocationTypes(venueId);
  const [importing, setImporting] = useState(false);
  const typeName = (id: string) => types.data?.find((t) => t.id === id)?.name ?? '';
  const units = useVenueUnits(venueId);
  const buildings = useBuildings(venueId);
  const outdoorName = useOutdoorLayer(venueId).data?.name ?? 'Area Luar';
  const [filter, setFilter] = useState(EMPTY_LOCATION_FILTER);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<Open>(null);
  useDeepLink(locations.data, setOpen);

  const all = locations.data ?? [];
  const filtered = useMemo(() => filterLocations(all, filter), [all, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const categoryName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="grid gap-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <LocationFilters
            value={filter}
            categories={categories.data ?? []}
            buildings={buildings.data ?? []}
            outdoorName={outdoorName}
            onChange={(next) => {
              setFilter(next);
              setPage(0);
            }}
          />
        </div>
        <Can action="location.edit">
          <Button disabled={!types.data?.length} onClick={() => setImporting(true)}>
            Import
          </Button>
          <Button
            variant="primary"
            disabled={!types.data?.length}
            onClick={() => setOpen({ kind: 'form', location: null, unitId: null })}
          >
            Tambah lokasi
          </Button>
        </Can>
      </div>
      {locations.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : locations.error ? (
        <p className="text-danger">{locations.error.message}</p>
      ) : all.length === 0 ? (
        <EmptyState
          title="Belum ada lokasi"
          description="Tambah lokasi pertama, lalu tautkan ke unit yang sudah digambar di Editor Peta."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Gedung</TableHead>
                <TableHead>Lantai</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((location) => {
                const tone = LOCATION_STATUS_TONE[location.status];
                const categoryText = location.categoryIds
                  .flatMap((id) => categoryName.get(id) ?? [])
                  .join(' · ');
                return (
                  <TableRow key={location.id}>
                    <TableCell className="font-mono">{location.code ?? '—'}</TableCell>
                    <TableCell className="min-w-48 whitespace-normal">
                      <span className="font-bold">{location.name}</span>
                      {categoryText ? (
                        <span className="block text-ink-muted text-sm">{categoryText}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>{typeName(location.locationTypeId)}</TableCell>
                    <TableCell>
                      {buildingNames(location.units, outdoorName).join(', ') || '—'}
                    </TableCell>
                    <TableCell>{floorNames(location.units).join(', ') || '—'}</TableCell>
                    <TableCell>
                      <UnitCell location={location} />
                    </TableCell>
                    <TableCell>
                      <StatusDot tone={tone.tone} hollow={tone.hollow}>
                        {LOCATION_STATUS_LABELS[location.status]}
                      </StatusDot>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => setOpen({ kind: 'form', location, unitId: null })}
                        >
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end gap-2 text-sm">
            <span className="font-mono tabular-nums">
              {filtered.length === 0
                ? 'Tidak ada lokasi yang cocok dengan filter.'
                : `${current * PAGE_SIZE + 1}–${Math.min((current + 1) * PAGE_SIZE, filtered.length)} dari ${filtered.length}`}
            </span>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Halaman sebelumnya"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              ‹
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Halaman berikutnya"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              ›
            </Button>
          </div>
        </>
      )}
      {open?.kind === 'form' && types.data ? (
        <LocationSheet
          key={open.location?.id ?? `new-${open.unitId ?? ''}`}
          venueId={venueId}
          types={types.data}
          location={open.location}
          initialUnitId={open.unitId}
          readOnly={!canEdit}
          locations={all}
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
