import {
  deepLinkUrl,
  type EventListing,
  localizedText,
  type VenueEvent,
  type VenueId,
} from '@indoor/domain';
import { Badge, Button, cn } from '@indoor/ui';
import { ArrowLeftIcon, ExternalLinkIcon, MapPinIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PanelMessage } from '../../app/panel-message';
import { data } from '../../data/client';
import { RouteAction } from '../location/route-action';
import { useExplore, useExploreStore } from '../search/explore-context';
import { ShareButton } from '../share/share-button';
import { occurrenceText, useEventListings } from './use-live-events';

function useLanguage(): 'id' | 'en' {
  const { i18n } = useTranslation();
  return i18n.resolvedLanguage === 'en' ? 'en' : 'id';
}

function KindBadge({ event }: { event: VenueEvent }) {
  const { t } = useTranslation();
  return (
    <Badge className="w-fit">
      {event.kind === 'promotion' ? t('events.kindPromotion') : t('events.kindEvent')}
    </Badge>
  );
}

function LiveBadge() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-sm bg-ok px-2 py-0.5 font-bold text-surface text-xs">
      {t('events.liveBadge')}
    </span>
  );
}

function usePlaceNames(event: VenueEvent): string[] {
  const { index } = useExplore();
  return event.locationIds.flatMap((id) => index.locations.get(id)?.name ?? []);
}

function EventRow({ listing }: { listing: EventListing }) {
  const language = useLanguage();
  const { snapshot } = useExplore();
  const openEvent = useExploreStore((s) => s.openEvent);
  const { event, occurrence, phase } = listing;
  const places = usePlaceNames(event);
  const title = localizedText(event.title, language);
  return (
    <button
      type="button"
      aria-label={title}
      onClick={() => openEvent(event.id)}
      className="flex w-full cursor-pointer items-start gap-3 py-3 text-left hover:bg-canvas"
    >
      {event.imagePath ? (
        <img
          src={data.events.imageUrl(event.imagePath)}
          alt=""
          loading="lazy"
          className="aspect-video w-24 shrink-0 rounded-sm border border-line object-cover"
        />
      ) : null}
      <span className="grid min-w-0 flex-1 gap-1 [overflow-wrap:anywhere]">
        <span className="flex flex-wrap items-center gap-2">
          <KindBadge event={event} />
          {phase === 'live' ? <LiveBadge /> : null}
        </span>
        <span className="font-bold">{title}</span>
        <span className="text-ink-muted text-sm">
          {occurrenceText(occurrence, snapshot.venue.timezone, language)}
        </span>
        {places.length ? <span className="text-sm">{places.join(', ')}</span> : null}
      </span>
    </button>
  );
}

function Section({ title, listings }: { title: string; listings: EventListing[] }) {
  if (!listings.length) return null;
  return (
    <section className="grid gap-1" aria-label={title}>
      <h3 className="font-bold text-ink-muted text-sm">{title}</h3>
      <ul className="grid divide-y divide-line">
        {listings.map((listing) => (
          <li key={listing.event.id}>
            <EventRow listing={listing} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EventList() {
  const { t } = useTranslation();
  const listings = useEventListings();
  const eventId = useExploreStore((s) => s.eventId);
  if (eventId) return <EventDetail id={eventId} />;
  if (!listings.length) return <p className="text-ink-muted">{t('events.empty')}</p>;
  return (
    <div className="grid gap-4">
      <h2 className="font-bold text-lg">{t('events.heading')}</h2>
      <Section title={t('events.live')} listings={listings.filter((l) => l.phase === 'live')} />
      <Section title={t('events.soon')} listings={listings.filter((l) => l.phase === 'upcoming')} />
    </div>
  );
}

function ShowOnMap({ event }: { event: VenueEvent }) {
  const { t } = useTranslation();
  const openEvent = useExploreStore((s) => s.openEvent);
  const setSheetSnap = useExploreStore((s) => s.setSheetSnap);
  return (
    <Button
      variant="primary"
      className="w-full"
      onClick={() => {
        openEvent(event.id);
        setSheetSnap('peek');
      }}
    >
      <MapPinIcon aria-hidden="true" strokeWidth={1.75} />
      {t('events.showOnMap')}
    </Button>
  );
}

export function EventDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const { snapshot, index } = useExplore();
  const listings = useEventListings();
  const closeEvent = useExploreStore((s) => s.closeEvent);
  const openDetail = useExploreStore((s) => s.openDetail);
  const listing = listings.find((l) => l.event.id === id);
  const back = (
    <Button variant="ghost" size="sm" className="-ml-3 justify-self-start" onClick={closeEvent}>
      <ArrowLeftIcon aria-hidden="true" strokeWidth={1.75} />
      {t('events.back')}
    </Button>
  );
  if (!listing) {
    return (
      <div className="grid gap-2">
        {back}
        <PanelMessage
          title={t('events.notFoundTitle')}
          description={t('events.notFoundDescription')}
        />
      </div>
    );
  }
  const { event, occurrence, phase } = listing;
  const title = localizedText(event.title, language);
  const summary = localizedText(event.summary, language);
  const description = localizedText(event.description, language);
  const locations = event.locationIds.flatMap((locationId) => {
    const location = index.locations.get(locationId);
    return location ? [location] : [];
  });
  const target = locations[0];
  const shareUrl = deepLinkUrl(window.location.origin, {
    venueId: snapshot.venue.id as VenueId,
    eventId: event.id,
    language,
  });
  return (
    <article className="grid gap-4 [overflow-wrap:anywhere]" aria-label={title}>
      {back}
      {event.imagePath ? (
        <img
          src={data.events.imageUrl(event.imagePath)}
          alt=""
          className="aspect-video w-full rounded-sm border border-line object-cover"
        />
      ) : null}
      <header className="grid gap-2">
        <span className="flex flex-wrap items-center gap-2">
          <KindBadge event={event} />
          {phase === 'live' ? <LiveBadge /> : null}
        </span>
        <h2 className="font-bold text-lg">{title}</h2>
        {summary ? <p className="text-ink-muted">{summary}</p> : null}
      </header>
      <p>
        {occurrenceText(occurrence, snapshot.venue.timezone, language)}
        {event.repeat !== 'none' ? (
          <span className="text-ink-muted">
            {' · '}
            {event.repeat === 'daily' ? t('events.repeatsDaily') : t('events.repeatsWeekly')}
          </span>
        ) : null}
      </p>
      {locations.length ? (
        <section className="grid gap-1" aria-label={t('events.places')}>
          <h3 className="font-bold text-ink-muted text-sm">{t('events.places')}</h3>
          <ul className="flex flex-wrap gap-2">
            {locations.map((location) => (
              <li key={location.id}>
                <Button size="sm" onClick={() => openDetail({ kind: 'location', id: location.id })}>
                  <MapPinIcon aria-hidden="true" strokeWidth={1.75} />
                  {location.name}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {target ? (
        <RouteAction target={{ kind: 'location', id: target.id }} />
      ) : event.point ? (
        <ShowOnMap event={event} />
      ) : null}
      <ShareButton title={title} url={shareUrl} />
      {description ? <p className="whitespace-pre-line">{description}</p> : null}
      {event.linkUrl ? (
        <a
          href={event.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold underline"
        >
          <ExternalLinkIcon aria-hidden="true" strokeWidth={1.75} className="size-4" />
          {t('events.moreInfo')}
        </a>
      ) : null}
    </article>
  );
}

export function LocationEvents({ locationId }: { locationId: string }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const listings = useEventListings().filter((l) => l.event.locationIds.includes(locationId));
  const openEvent = useExploreStore((s) => s.openEvent);
  if (!listings.length) return null;
  return (
    <section className="grid gap-2" aria-label={t('events.atLocation')}>
      <h3 className="font-bold text-ink-muted text-sm">{t('events.atLocation')}</h3>
      <ul className="flex flex-wrap gap-2">
        {listings.map(({ event, phase }) => (
          <li key={event.id}>
            <button
              type="button"
              onClick={() => openEvent(event.id)}
              className={cn(
                'inline-flex max-w-full cursor-pointer items-center gap-2 rounded-sm border px-3 py-1 text-left font-bold text-sm',
                phase === 'live' ? 'border-ok bg-ok/10' : 'border-line bg-surface',
              )}
            >
              {phase === 'live' ? <LiveBadge /> : null}
              <span className="truncate">{localizedText(event.title, language)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
