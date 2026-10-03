import { DataError } from '@indoor/data';
import type { VenueId } from '@indoor/domain';
import { Button, EmptyState, Skeleton, StatusDot, toast } from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { Can } from '../../app/auth/can';
import { data } from '../../app/data-client';
import { inVenueTime } from '../../app/format';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { useActivePublication, usePublish, useValidateDraft } from './queries';
import { ValidationPanel } from './validation-panel';

const kilobytes = (bytes: number) =>
  `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`;

// Sementara sampai alur publish lengkap (ringkasan perubahan, riwayat) di T-308 s.d. T-310.
function DevPublishButton({ venueId, onBlocked }: { venueId: VenueId; onBlocked: () => void }) {
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
          onError: (error) => {
            toast.error('Gagal menerbitkan', { description: error.message });
            // Ditolak validasi: tampilkan temuan agar langsung bisa diperbaiki.
            if (error instanceof DataError && error.kind === 'invalid') onBlocked();
          },
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

function VenuePublish({ venueId }: { venueId: VenueId }) {
  const validation = useValidateDraft(venueId);
  return (
    <div className="grid gap-6">
      <Can action="publish.publish">
        <div className="flex justify-end">
          <DevPublishButton venueId={venueId} onBlocked={() => validation.mutate()} />
        </div>
      </Can>
      <ActiveVersion venueId={venueId} />
      <Can action="publish.validate">
        <ValidationPanel
          findings={validation.data}
          pending={validation.isPending}
          error={validation.error?.message ?? null}
          onValidate={() => validation.mutate()}
        />
      </Can>
    </div>
  );
}

export function PublishPage() {
  const { venue } = useSelectedVenue();
  return (
    <ModuleRoute module="publish">
      {(access) => (
        <ModulePage module="publish" access={access}>
          {venue ? (
            <VenuePublish key={venue.id} venueId={venue.id} />
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
