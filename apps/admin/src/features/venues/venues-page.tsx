import { VENUE_TEMPLATES, VENUE_TYPES, type Venue } from '@indoor/domain';
import {
  Button,
  type DataColumn,
  DataTable,
  EmptyState,
  type FilterDef,
  queryRows,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@indoor/ui';
import { type ReactNode, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Can } from '../../app/auth/can';
import { data } from '../../app/data-client';
import { inVenueTime } from '../../app/format';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { useTableState } from '../../hooks/use-table-state';
import { QuotaNotice, useQuotaBlock } from '../license/quota-notice';
import { BuildingsPanel } from './buildings/buildings-panel';
import { DeleteVenueDialog } from './delete-venue-dialog';
import { useVenuesDetailed } from './queries';
import { VenueFormDialog } from './venue-form-dialog';

type Dialog = { kind: 'form'; venue: Venue | null } | { kind: 'delete'; venue: Venue } | null;

/** Dua tabel di satu halaman (tab Gedung dan Semua venue): parameter URL diberi awalan. */
const VENUE_PREFIX = 'v.';

function venueFilters(venues: readonly Venue[] | undefined): FilterDef[] {
  return [
    {
      kind: 'select',
      key: 'tipe',
      label: 'Tipe venue',
      allLabel: 'Semua tipe venue',
      options: VENUE_TYPES.map((value) => ({ value, label: VENUE_TEMPLATES[value].label })),
    },
    {
      kind: 'select',
      key: 'zona',
      label: 'Zona waktu',
      allLabel: 'Semua zona waktu',
      options:
        venues &&
        [...new Set(venues.map((v) => v.timezone))]
          .sort()
          .map((value) => ({ value, label: value })),
    },
  ];
}

function VenuesTable({
  actions,
  onEdit,
  onDelete,
}: {
  actions: ReactNode;
  onEdit: (v: Venue) => void;
  onDelete: (v: Venue) => void;
}) {
  const venues = useVenuesDetailed();
  const filters = venueFilters(venues.data);
  const table = useTableState({ filters, prefix: VENUE_PREFIX });
  const result = venues.data
    ? queryRows(venues.data, table.state, {
        text: (v) => [v.name, v.address],
        filters: {
          tipe: (v, values) => values.includes(v.venueType),
          zona: (v, values) => values.includes(v.timezone),
        },
      })
    : undefined;
  const columns: DataColumn<Venue>[] = [
    {
      id: 'logo',
      header: <span className="sr-only">Logo</span>,
      className: 'w-12',
      cell: (venue) =>
        venue.logoPath ? (
          <img
            src={data.venues.logoUrl(venue.logoPath)}
            alt=""
            className="size-8 rounded-sm border border-line object-contain"
          />
        ) : (
          <span
            aria-hidden="true"
            className="block size-8 rounded-sm border border-line border-dashed"
          />
        ),
    },
    {
      id: 'name',
      header: 'Nama',
      className: 'min-w-48 whitespace-normal font-bold',
      cell: (venue) => venue.name,
    },
    { id: 'type', header: 'Tipe', cell: (venue) => VENUE_TEMPLATES[venue.venueType].label },
    {
      id: 'address',
      header: 'Alamat',
      className: 'max-w-72 truncate',
      cell: (venue) => venue.address ?? '—',
    },
    {
      id: 'timezone',
      header: 'Zona waktu',
      className: 'font-mono',
      cell: (venue) => venue.timezone,
    },
    {
      id: 'updated',
      header: 'Diubah (waktu venue)',
      className: 'font-mono tabular-nums',
      cell: (venue) => inVenueTime(venue.updatedAt, venue.timezone),
    },
    {
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (venue) => (
        <Can action="venue.edit">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => onEdit(venue)}>
              Ubah
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              onClick={() => onDelete(venue)}
            >
              Hapus
            </Button>
          </div>
        </Can>
      ),
    },
  ];
  return (
    <DataTable
      label="Venue"
      columns={columns}
      rows={result?.rows}
      rowKey={(venue) => venue.id}
      total={result?.total ?? 0}
      table={table}
      search={{ placeholder: 'Cari nama atau alamat venue' }}
      filters={filters}
      actions={actions}
      error={venues.error?.message ?? null}
      onRetry={() => void venues.refetch()}
      empty={
        <EmptyState
          title="Belum ada venue"
          description="Tambah venue pertama, lalu tambahkan gedung dan lantainya."
        />
      }
    />
  );
}

function SelectedVenueBuildings() {
  const { venue: selected } = useSelectedVenue();
  const venues = useVenuesDetailed();
  const venue = venues.data?.find((v) => v.id === selected?.id);
  if (venues.isPending) return <Skeleton className="h-32 w-full" />;
  if (!venue) {
    return (
      <EmptyState
        title="Belum ada venue"
        description="Buat venue di tab Semua venue, lalu tambahkan gedungnya di sini."
      />
    );
  }
  return <BuildingsPanel venue={venue} />;
}

export function VenuesPage() {
  const [dialog, setDialog] = useState<Dialog>(null);
  const venueQuota = useQuotaBlock('venues');
  // Tab di URL agar muat ulang membuka tab yang sama beserta cari/filter tabelnya.
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'venues' ? 'venues' : 'buildings';
  return (
    <ModuleRoute module="venues">
      {(access) => (
        <ModulePage module="venues" access={access}>
          <Tabs
            value={tab}
            onValueChange={(value) =>
              setParams(value === 'venues' ? { tab: value } : {}, { replace: true })
            }
          >
            <TabsList>
              <TabsTrigger value="buildings">Gedung</TabsTrigger>
              <TabsTrigger value="venues">Semua venue</TabsTrigger>
            </TabsList>
            <TabsContent value="buildings">
              <SelectedVenueBuildings />
            </TabsContent>
            <TabsContent value="venues" className="grid gap-4">
              <VenuesTable
                actions={
                  <Can action="venue.edit">
                    <QuotaNotice message={venueQuota} />
                    <Button
                      variant="primary"
                      disabled={venueQuota !== null}
                      onClick={() => setDialog({ kind: 'form', venue: null })}
                    >
                      Tambah venue
                    </Button>
                  </Can>
                }
                onEdit={(venue) => setDialog({ kind: 'form', venue })}
                onDelete={(venue) => setDialog({ kind: 'delete', venue })}
              />
            </TabsContent>
          </Tabs>
          {dialog?.kind === 'form' ? (
            <VenueFormDialog
              key={dialog.venue?.id ?? 'new'}
              venue={dialog.venue}
              open
              onOpenChange={(open) => !open && setDialog(null)}
            />
          ) : null}
          {dialog?.kind === 'delete' ? (
            <DeleteVenueDialog venue={dialog.venue} onClose={() => setDialog(null)} />
          ) : null}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
