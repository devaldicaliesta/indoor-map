import { DataError } from '@indoor/data';
import { type Snapshot, type VenueId, VenueIdSchema } from '@indoor/domain';
import { Button, Skeleton } from '@indoor/ui';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { PanelMessage } from '../app/panel-message';
import { VisitorShell } from '../app/visitor-shell';
import { useSnapshot } from '../data/loadSnapshot';
import { VenueMap } from '../features/map/venue-map';
import { BrowsePanel } from '../features/search/browse-panel';
import { useBrowseStore } from '../features/search/browse-store';
import { VenueSearchField } from '../features/search/venue-search-field';
import { VenueProvider } from '../features/venue/venue-context';
import { VenueInfo } from '../features/venue/venue-info';
import { applyVenueLanguage } from '../i18n';

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

/** Peta, pencarian, dan panel jelajah satu venue; keadaan panel dimulai ulang per venue. */
function VenueBrowser({ snapshot }: { snapshot: Snapshot }) {
  const sheet = useBrowseStore((state) => state.sheet);
  const setSheet = useBrowseStore((state) => state.setSheet);
  const reset = useBrowseStore((state) => state.reset);

  useEffect(() => {
    reset();
    return reset;
  }, [reset]);

  return (
    <VenueProvider snapshot={snapshot}>
      <VisitorShell
        title={snapshot.venue.name}
        actions={<VenueInfo snapshot={snapshot} />}
        search={<VenueSearchField />}
        sheet={{ snap: sheet, onSnapChange: setSheet }}
        hideMobileTitle
        map={<VenueMap snapshot={snapshot} />}
      >
        <BrowsePanel />
      </VisitorShell>
    </VenueProvider>
  );
}

function VenueView({ venueId }: { venueId: VenueId }) {
  const { t } = useTranslation();
  const snapshot = useSnapshot(venueId);
  const defaultLanguage = snapshot.data?.venue.defaultLanguage;

  useEffect(() => {
    if (defaultLanguage) applyVenueLanguage(defaultLanguage);
  }, [defaultLanguage]);

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

  return <VenueBrowser snapshot={snapshot.data} />;
}

export function VenuePage() {
  const parsed = VenueIdSchema.safeParse(useParams().venueId);
  return parsed.success ? <VenueView venueId={parsed.data} /> : <Unavailable />;
}
