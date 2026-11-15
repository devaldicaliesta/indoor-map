import {
  currentEvents,
  deepLinkUrl,
  type EventListing,
  localizedText,
  type Snapshot,
  type SnapshotPlaylist,
  type VenueId,
} from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { data } from '../data/client';
import {
  EVENT_REFRESH_MS,
  eventsQuery,
  occurrenceText,
  useNow,
} from '../features/events/use-live-events';
import { QrCode } from './qr-code';

export function usePlaylistListings(
  snapshot: Snapshot | null,
  playlist: SnapshotPlaylist | null,
): EventListing[] {
  const venueId = (snapshot?.venue.id ?? '') as VenueId;
  const events = useQuery({
    ...eventsQuery(venueId),
    enabled: snapshot !== null && playlist !== null,
    refetchInterval: EVENT_REFRESH_MS,
  }).data;
  const now = useNow((playlist?.slideSeconds ?? 30) * 1000);
  return useMemo(() => {
    if (!snapshot || !playlist || !events) return [];
    const chosen = playlist.eventIds.length
      ? events.filter((e) => playlist.eventIds.includes(e.id))
      : events;
    return currentEvents(chosen, snapshot.venue.timezone, new Date(now));
  }, [events, playlist, snapshot, now]);
}

function Slide({
  listing,
  snapshot,
  active,
}: {
  listing: EventListing;
  snapshot: Snapshot;
  active: boolean;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'id';
  const { event, occurrence, phase } = listing;
  const title = localizedText(event.title, language);
  const summary = localizedText(event.summary, language);
  const places = event.locationIds.flatMap(
    (id) => snapshot.locations.find((l) => l.id === id)?.name ?? [],
  );
  const url = deepLinkUrl(window.location.origin, {
    venueId: snapshot.venue.id as VenueId,
    eventId: event.id,
    language,
  });
  return (
    <article
      aria-label={title}
      aria-hidden={!active}
      data-event-id={event.id}
      className={active ? 'grid h-full grid-rows-[minmax(0,1fr)_auto] gap-8 p-12' : 'hidden'}
    >
      {event.imagePath ? (
        <img
          src={data.events.imageUrl(event.imagePath)}
          alt=""
          className="h-full min-h-0 w-full rounded-md object-cover"
        />
      ) : (
        <div className="h-full rounded-md bg-canvas" />
      )}
      <div className="grid grid-cols-[1fr_auto] items-end gap-8 [overflow-wrap:anywhere]">
        <div className="grid min-w-0 gap-3">
          <span className="flex flex-wrap items-center gap-3 font-bold text-lg">
            <span className="rounded-sm border border-line px-3 py-1">
              {event.kind === 'promotion' ? t('events.kindPromotion') : t('events.kindEvent')}
            </span>
            {phase === 'live' ? (
              <span className="rounded-sm bg-ok px-3 py-1 text-surface">
                {t('events.liveBadge')}
              </span>
            ) : null}
          </span>
          <h2 className="font-bold text-2xl leading-tight">{title}</h2>
          {summary ? <p className="text-ink-muted text-xl">{summary}</p> : null}
          <p className="text-xl">{occurrenceText(occurrence, snapshot.venue.timezone, language)}</p>
          {places.length ? <p className="font-bold text-xl">{places.join(', ')}</p> : null}
        </div>
        <figure className="grid justify-items-center gap-2">
          <QrCode url={url} label={t('infoPoint.playlistQr')} className="size-[220px] bg-white" />
          <figcaption className="text-ink-muted">{t('infoPoint.playlistScan')}</figcaption>
        </figure>
      </div>
    </article>
  );
}

export function PromoPlaylist({
  snapshot,
  listings,
  slideSeconds,
  onTouch,
}: {
  snapshot: Snapshot;
  listings: EventListing[];
  slideSeconds: number;
  onTouch: (listing: EventListing | null) => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep((s) => s + 1), slideSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [slideSeconds]);
  useEffect(() => {
    if (listings.length) return;
    const dismiss = () => onTouch(null);
    window.addEventListener('pointerdown', dismiss);
    return () => window.removeEventListener('pointerdown', dismiss);
  }, [listings.length, onTouch]);
  if (!listings.length) return null;
  const index = step % listings.length;
  return (
    <section
      aria-label={t('infoPoint.playlist')}
      data-slide={index}
      className="fixed inset-0 z-50 grid grid-rows-[minmax(0,1fr)_auto] bg-surface"
    >
      {listings.map((listing, i) => (
        <Slide key={listing.event.id} listing={listing} snapshot={snapshot} active={i === index} />
      ))}
      <p aria-hidden="true" className="bg-ink py-6 text-center font-bold text-2xl text-surface">
        {t('infoPoint.playlistTouch')}
      </p>
      <button
        type="button"
        aria-label={t('infoPoint.playlistTouch')}
        className="absolute inset-0 cursor-pointer"
        onClick={() => onTouch(listings[index] ?? null)}
      />
    </section>
  );
}
