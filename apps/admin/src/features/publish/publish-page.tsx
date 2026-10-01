import type { VenueId } from '@indoor/domain';
import { Button, EmptyState, Skeleton, StatusDot, toast } from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { Can } from '../../app/auth/can';
import { data } from '../../app/data-client';
import { inVenueTime } from '../../app/format';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { useActivePublication, usePublish } from './queries';

const kilobytes = (bytes: number) =>
  `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`;

// Sementara sampai alur publish lengkap (validasi, ringkasan perubahan, riwayat) di T-307 s.d. T-310.
function DevPublishButton({ venueId }: { venueId: VenueId }) {
  const publish = usePublish(venueId);
  return (
    <Button
      variant="primary"
      disabled={publish.isPending}
      onClick={() =>
        publish.mutate(undefined, {
          onSuccess: (result) =>
            toast.success(`Versi ${result.version} diterbitkan`, {
              description: `Visitor memuat versi ini pada kunjungan berikutnya. Ukuran snapshot ${kilobytes(result.sizeBytes)}.`,
            }),
          onError: (error) => toast.error('Gagal menerbitkan', { description: error.message }),
        })
      }
    >
      {publish.isPending ? 'Menerbitkan…' : 'Terbitkan (dev)'}
    </Button>
  );
}

function ActiveVersion({ venueId }: { venueId: VenueId }) {
  const active = useActivePublication(venueId);
  // Waktu terbit ditampilkan dalam zona waktu venue, seperti di halaman Venue.
  const venue = useQuery({ queryKey: ['venue', venueId], queryFn: () => data.venues.get(venueId) });
  if (active.isPending || venue.isPending) return <Skeleton className="h-24 max-w-xl" />;
  if (active.error) {
    return (
      <EmptyState title="Versi published tidak bisa dimuat" description={active.error.message} />
    );
  }
  if (!active.data) {
    return (
      <EmptyState
        title="Belum ada versi published"
        description="Pengunjung belum bisa membuka peta venue ini. Terbitkan draft agar Visitor menampilkannya."
      />
    );
  }
  const { version, publishedAt, publisherName } = active.data;
  return (
    <section
      aria-labelledby="active-version"
      className="grid max-w-xl gap-2 rounded-md border border-line bg-surface p-(--panel-padding)"
    >
      <h2 id="active-version" className="font-bold">
        Versi published
      </h2>
      <p className="flex items-baseline gap-3">
        <span className="font-bold font-mono text-2xl">v{version}</span>
        <span className="text-ink-muted">
          {inVenueTime(publishedAt, venue.data?.timezone ?? 'Asia/Jakarta')}
          {publisherName ? ` · ${publisherName}` : ''}
        </span>
      </p>
      <StatusDot tone="ok">Dibaca Visitor dan Info Point</StatusDot>
    </section>
  );
}

export function PublishPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="publish">
      {(access) => (
        <ModulePage
          module="publish"
          access={access}
          actions={
            venue ? (
              <Can action="publish.publish">
                <DevPublishButton venueId={venue.id} />
              </Can>
            ) : null
          }
        >
          {venue ? (
            <ActiveVersion venueId={venue.id} />
          ) : (
            <EmptyState
              title="Belum ada venue"
              description="Buat venue lebih dulu di menu Venue."
            />
          )}
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
