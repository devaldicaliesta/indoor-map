import { DataError } from '@indoor/data';
import type { VenueId } from '@indoor/domain';
import { Button, EmptyState, Skeleton, StatusDot, toast } from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Can } from '../../app/auth/can';
import { data } from '../../app/data-client';
import { inVenueTime } from '../../app/format';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { useSelectedVenue } from '../../app/venue-store';
import { usePublicVisitorUrl } from '../origin-points/queries';
import { ChangeSummary } from './change-summary';
import { Preview } from './preview';
import {
  useActivePublication,
  useDraftChanges,
  useDraftPreview,
  usePublish,
  useValidateDraft,
} from './queries';
import { ReleaseDialog } from './release-dialog';
import { ValidationPanel } from './validation-panel';
import { VersionHistory } from './version-history';

const kilobytes = (bytes: number) =>
  `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`;

function PublishButton({ venueId, onBlocked }: { venueId: VenueId; onBlocked: () => void }) {
  const publish = usePublish(venueId);
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    publish.reset();
  };
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Terbitkan
      </Button>
      {open ? (
        <ReleaseDialog
          title="Terbitkan draft?"
          description="Draft divalidasi lagi di server. Bila lolos, Visitor dan Info Point memuat versi baru pada kunjungan atau pemeriksaan berikutnya."
          confirmLabel="Terbitkan"
          pending={publish.isPending}
          error={publish.error?.message ?? null}
          onClose={close}
          onConfirm={(notes) =>
            publish.mutate(notes, {
              onSuccess: (result) => {
                toast.success(`Versi ${result.version} diterbitkan`, {
                  description: `Visitor memuat versi ini pada kunjungan berikutnya. Ukuran snapshot ${kilobytes(result.sizeBytes)}.`,
                });
                close();
              },
              onError: (error) => {
                // Ditolak validasi: tampilkan temuan agar langsung bisa diperbaiki.
                if (error instanceof DataError && error.kind === 'invalid') onBlocked();
              },
            })
          }
        />
      ) : null}
    </>
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
  const changes = useDraftChanges(venueId);
  const preview = useDraftPreview(venueId);
  const visitorUrl = usePublicVisitorUrl();
  const venue = useQuery({ queryKey: ['venue', venueId], queryFn: () => data.venues.get(venueId) });
  return (
    <div className="grid gap-6">
      <Can action="publish.publish">
        <div className="flex justify-end">
          <PublishButton venueId={venueId} onBlocked={() => validation.mutate()} />
        </div>
      </Can>
      <ActiveVersion venueId={venueId} />
      <VersionHistory venueId={venueId} timezone={venue.data?.timezone ?? 'Asia/Jakarta'} />
      <Can action="publish.validate">
        <ChangeSummary
          changes={changes.data}
          pending={changes.isPending}
          error={changes.error?.message ?? null}
          onLoad={() => changes.mutate()}
        />
        <Preview
          venueId={venueId}
          visitorUrl={visitorUrl.data ?? null}
          snapshot={preview.data}
          pending={preview.isPending || visitorUrl.isPending}
          error={preview.error?.message ?? visitorUrl.error?.message ?? null}
          onLoad={() => preview.mutate()}
        />
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
