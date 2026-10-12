import { DataError, SERVICE_INACTIVE, TRIAL_ENDED } from '@indoor/data';
import {
  type DeepLink,
  decodeDeepLink,
  type LanguageCode,
  parseVenueRef,
  type Snapshot,
  type VenueId,
  type VenueSlug,
} from '@indoor/domain';
import { Button, Skeleton } from '@indoor/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router';
import { PanelMessage } from '../app/panel-message';
import { useMediaQuery } from '../app/use-media-query';
import { DESKTOP_QUERY, VisitorShell } from '../app/visitor-shell';
import { data } from '../data/client';
import { useRouteSnapshot, useSnapshot } from '../data/loadSnapshot';
import { takeSlugPrefetch } from '../data/prefetch';
import { closuresQuery, useLiveClosures } from '../features/closures/use-live-closures';
import { VenueMap } from '../features/map/venue-map';
import { ExploreProvider, useExploreStore } from '../features/search/explore-context';
import { DetailBackBar, ExplorePanel } from '../features/search/explore-panel';
import { VenueSearch } from '../features/search/venue-search';
import { useVenueBranding } from '../features/venue/use-venue-branding';
import { VenueInfo } from '../features/venue/venue-info';
import { applyVenueLanguage, showLanguage } from '../i18n';

type UnavailableReason = 'unavailable' | 'serviceInactive' | 'trialEnded';

/** Judul dan penjelasan per alasan peta tidak bisa dibuka; kunci ditulis utuh (uji i18n). */
export function useUnavailableText(reason: UnavailableReason) {
  const { t } = useTranslation();
  switch (reason) {
    case 'serviceInactive':
      return {
        title: t('venue.serviceInactiveTitle'),
        description: t('venue.serviceInactiveDescription'),
      };
    case 'trialEnded':
      return { title: t('venue.trialEndedTitle'), description: t('venue.trialEndedDescription') };
    default:
      return { title: t('venue.unavailableTitle'), description: t('venue.unavailableDescription') };
  }
}

/** Belum ada peta terbit, layanan dihentikan karena lisensi, atau trial ter-hosting berakhir. */
function Unavailable({ reason = 'unavailable' }: { reason?: UnavailableReason }) {
  const message = useUnavailableText(reason);
  return (
    <VisitorShell>
      <PanelMessage title={message.title} description={message.description} />
    </VisitorShell>
  );
}

/** Penanda di `latest.json` (lisensi, trial) menjadi alasan yang ditampilkan; selain itu null. */
export function markerReason(error: unknown): 'serviceInactive' | 'trialEnded' | null {
  if (!(error instanceof DataError)) return null;
  if (error.code === SERVICE_INACTIVE) return 'serviceInactive';
  if (error.code === TRIAL_ENDED) return 'trialEnded';
  return null;
}

function Loading() {
  return (
    <VisitorShell>
      <div className="grid gap-2" aria-busy="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </VisitorShell>
  );
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <VisitorShell>
      <div className="grid justify-items-start gap-3">
        <PanelMessage
          title={t('venue.loadFailedTitle')}
          description={t('venue.loadFailedDescription')}
        />
        <Button onClick={onRetry}>{t('venue.retry')}</Button>
      </div>
    </VisitorShell>
  );
}

function VenueView({ venueId }: { venueId: VenueId }) {
  const snapshot = useSnapshot(venueId);
  // Penutupan hanya butuh id venue: diminta bersamaan dengan snapshot, bukan sesudahnya.
  const queryClient = useQueryClient();
  useEffect(() => {
    void queryClient.prefetchQuery(closuresQuery(venueId));
  }, [queryClient, venueId]);
  const location = useLocation();
  // Dibaca sekali per pembukaan: berpindah keadaan di dalam Visitor tidak mengubah URL. Path
  // ditulis ulang dengan id venue agar parameter tautan juga berlaku untuk alamat slug.
  const [link] = useState(() => decodeDeepLink(`/v/${venueId}${location.search}`));
  useVisitLanguage(link, snapshot.data?.venue.defaultLanguage);

  if (snapshot.isPending) return <Loading />;
  if (snapshot.error) {
    if (snapshot.error instanceof DataError && snapshot.error.kind === 'not_found') {
      return <Unavailable />;
    }
    const marker = markerReason(snapshot.error);
    if (marker) return <Unavailable reason={marker} />;
    return <LoadFailed onRetry={() => void snapshot.refetch()} />;
  }

  return <SnapshotExplorer key={venueId} snapshot={snapshot.data} link={link} />;
}

/** Bahasa kunjungan: dari tautan bila ada, selain itu bahasa bawaan venue. */
export function useVisitLanguage(link: DeepLink | null, defaultLanguage: LanguageCode | undefined) {
  useEffect(() => {
    // Bahasa di tautan bagikan berlaku untuk kunjungan ini tanpa mengganti pilihan tersimpan.
    if (link?.language) showLanguage(link.language);
    else if (defaultLanguage) applyVenueLanguage(defaultLanguage);
  }, [defaultLanguage, link]);
}

/** Visitor untuk satu snapshot: published (`/v/:venueId`) atau draft dari preview Admin. */
export function SnapshotExplorer({
  snapshot,
  link,
}: {
  snapshot: Snapshot;
  link: DeepLink | null;
}) {
  const route = useRouteSnapshot(snapshot);
  return (
    <ExploreProvider snapshot={snapshot} route={route} link={link}>
      <VenueExplorer snapshot={snapshot} />
    </ExploreProvider>
  );
}

/** Peta dengan pencarian, chip, daftar, dan detail; semuanya dari snapshot di perangkat. */
function VenueExplorer({ snapshot }: { snapshot: Snapshot }) {
  const { t } = useTranslation();
  const brand = useVenueBranding(snapshot);
  useLiveClosures(snapshot);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const sheetSnap = useExploreStore((s) => s.sheetSnap);
  const setSheetSnap = useExploreStore((s) => s.setSheetSnap);
  const hasDetail = useExploreStore((s) => s.detail !== null);
  return (
    <VisitorShell
      title={brand.name}
      logoUrl={brand.logoUrl}
      actions={<VenueInfo snapshot={snapshot} />}
      map={<VenueMap snapshot={snapshot} />}
      search={
        // Di HP kolom cari terlalu sempit untuk nama venue; logo yang menandai venue.
        <VenueSearch
          placeholder={isDesktop ? t('search.placeholderIn', { name: brand.name }) : undefined}
        />
      }
      mobileHeader={hasDetail ? <DetailBackBar /> : undefined}
      sheet={{ snap: sheetSnap, onSnapChange: setSheetSnap }}
    >
      <ExplorePanel desktop={isDesktop} />
    </VisitorShell>
  );
}

/** `/v/<slug>`: penunjuk slug dibaca dari Storage, lalu sama dengan `/v/<id>`. */
function SlugVenueView({ slug }: { slug: VenueSlug }) {
  const venue = useQuery({
    queryKey: ['venue-slug', slug],
    queryFn: () =>
      data.snapshots.venueIdForSlug(slug, takeSlugPrefetch(data.snapshots.slugPointerUrl(slug))),
    staleTime: Number.POSITIVE_INFINITY,
  });
  if (venue.isPending) return <Loading />;
  if (venue.error) {
    if (venue.error instanceof DataError && venue.error.kind === 'not_found') {
      return <Unavailable />;
    }
    return <LoadFailed onRetry={() => void venue.refetch()} />;
  }
  return <VenueView venueId={venue.data} />;
}

export function VenuePage() {
  const ref = parseVenueRef(useParams().venue);
  if (!ref) return <Unavailable />;
  return ref.kind === 'id' ? (
    <VenueView venueId={ref.venueId} />
  ) : (
    <SlugVenueView slug={ref.slug} />
  );
}
