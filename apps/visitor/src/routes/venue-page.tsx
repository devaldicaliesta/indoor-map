import { DataError } from '@indoor/data';
import {
  type DeepLink,
  decodeDeepLink,
  type LanguageCode,
  type Snapshot,
  type VenueId,
  VenueIdSchema,
} from '@indoor/domain';
import { Button, Skeleton } from '@indoor/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router';
import { PanelMessage } from '../app/panel-message';
import { useMediaQuery } from '../app/use-media-query';
import { DESKTOP_QUERY, VisitorShell } from '../app/visitor-shell';
import { useSnapshot } from '../data/loadSnapshot';
import { useLiveClosures } from '../features/closures/use-live-closures';
import { VenueMap } from '../features/map/venue-map';
import { ExploreProvider, useExploreStore } from '../features/search/explore-context';
import { DetailBackBar, ExplorePanel } from '../features/search/explore-panel';
import { VenueSearch } from '../features/search/venue-search';
import { useVenueBranding } from '../features/venue/use-venue-branding';
import { VenueInfo } from '../features/venue/venue-info';
import { applyVenueLanguage, showLanguage } from '../i18n';

function Unavailable() {
  const { t } = useTranslation();
  return (
    <VisitorShell>
      <PanelMessage
        title={t('venue.unavailableTitle')}
        description={t('venue.unavailableDescription')}
      />
    </VisitorShell>
  );
}

function VenueView({ venueId }: { venueId: VenueId }) {
  const { t } = useTranslation();
  const snapshot = useSnapshot(venueId);
  const location = useLocation();
  // Dibaca sekali per pembukaan: berpindah keadaan di dalam Visitor tidak mengubah URL.
  const [link] = useState(() => decodeDeepLink(`${location.pathname}${location.search}`));
  useVisitLanguage(link, snapshot.data?.venue.defaultLanguage);

  if (snapshot.isPending) {
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
  if (snapshot.error) {
    if (snapshot.error instanceof DataError && snapshot.error.kind === 'not_found') {
      return <Unavailable />;
    }
    return (
      <VisitorShell>
        <div className="grid justify-items-start gap-3">
          <PanelMessage
            title={t('venue.loadFailedTitle')}
            description={t('venue.loadFailedDescription')}
          />
          <Button onClick={() => void snapshot.refetch()}>{t('venue.retry')}</Button>
        </div>
      </VisitorShell>
    );
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
  return (
    <ExploreProvider snapshot={snapshot} link={link}>
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

export function VenuePage() {
  const parsed = VenueIdSchema.safeParse(useParams().venueId);
  return parsed.success ? <VenueView venueId={parsed.data} /> : <Unavailable />;
}
