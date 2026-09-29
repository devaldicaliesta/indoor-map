import type { Venue } from '@indoor/domain';
import {
  Button,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@indoor/ui';
import { useState } from 'react';
import { Can } from '../../app/auth/can';
import { data } from '../../app/data-client';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { BuildingsPanel } from './buildings/buildings-panel';
import { DeleteVenueDialog } from './delete-venue-dialog';
import { useVenuesDetailed } from './queries';
import { VenueFormDialog } from './venue-form-dialog';

/** FR-VEN-01: waktu venue selalu ditampilkan dalam zona waktu venue. */
function inVenueTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short',
  }).format(new Date(iso));
}

type Dialog = { kind: 'form'; venue: Venue | null } | { kind: 'delete'; venue: Venue } | null;

function VenuesTable({
  onEdit,
  onDelete,
}: {
  onEdit: (v: Venue) => void;
  onDelete: (v: Venue) => void;
}) {
  const venues = useVenuesDetailed();
  if (venues.isPending) return <Skeleton className="h-40 w-full" />;
  if (venues.error) return <p className="text-danger">{venues.error.message}</p>;
  if (venues.data.length === 0) {
    return (
      <EmptyState
        title="Belum ada venue"
        description="Tambah venue pertama, lalu tambahkan gedung dan lantainya."
      />
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <span className="sr-only">Logo</span>
          </TableHead>
          <TableHead>Nama</TableHead>
          <TableHead>Alamat</TableHead>
          <TableHead>Zona waktu</TableHead>
          <TableHead>Diubah (waktu venue)</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {venues.data.map((venue) => (
          <TableRow key={venue.id}>
            <TableCell>
              {venue.logoPath ? (
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
              )}
            </TableCell>
            <TableCell className="font-bold">{venue.name}</TableCell>
            <TableCell className="max-w-72 truncate">{venue.address ?? '—'}</TableCell>
            <TableCell className="font-mono">{venue.timezone}</TableCell>
            <TableCell className="font-mono tabular-nums">
              {inVenueTime(venue.updatedAt, venue.timezone)}
            </TableCell>
            <TableCell className="text-right">
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
  return (
    <ModuleRoute module="venues">
      {(access) => (
        <ModulePage module="venues" access={access}>
          <Tabs defaultValue="buildings">
            <TabsList>
              <TabsTrigger value="buildings">Gedung</TabsTrigger>
              <TabsTrigger value="venues">Semua venue</TabsTrigger>
            </TabsList>
            <TabsContent value="buildings">
              <SelectedVenueBuildings />
            </TabsContent>
            <TabsContent value="venues" className="grid gap-4">
              <div className="flex justify-end">
                <Can action="venue.edit">
                  <Button
                    variant="primary"
                    onClick={() => setDialog({ kind: 'form', venue: null })}
                  >
                    Tambah venue
                  </Button>
                </Can>
              </div>
              <VenuesTable
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
