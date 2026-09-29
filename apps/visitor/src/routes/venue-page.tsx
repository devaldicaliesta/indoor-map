import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { PanelMessage } from '../app/panel-message';
import { VisitorShell } from '../app/visitor-shell';

// Snapshot venue dimuat di T-117/T-118; sampai itu venue tampil sebagai belum menerbitkan peta.
export function VenuePage() {
  const { t } = useTranslation();
  const { venueId } = useParams();
  return (
    <VisitorShell>
      <div data-venue-id={venueId}>
        <PanelMessage
          title={t('venue.unavailableTitle')}
          description={t('venue.unavailableDescription')}
        />
      </div>
    </VisitorShell>
  );
}
