import { DataError } from '@indoor/data';
import { type VenueId, VenueIdSchema } from '@indoor/domain';
import { Button, Skeleton } from '@indoor/ui';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { PanelMessage } from '../app/panel-message';
import { VisitorShell } from '../app/visitor-shell';
import { useSnapshot } from '../data/loadSnapshot';
import { BuildingList } from '../features/venue/building-list';
import { VenueInfo } from '../features/venue/venue-info';

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

  return (
    <VisitorShell title={snapshot.data.venue.name} actions={<VenueInfo snapshot={snapshot.data} />}>
      <BuildingList snapshot={snapshot.data} />
    </VisitorShell>
  );
}

export function VenuePage() {
  const parsed = VenueIdSchema.safeParse(useParams().venueId);
  return parsed.success ? <VenueView venueId={parsed.data} /> : <Unavailable />;
}
