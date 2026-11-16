import {
  EVENT_KIND_LABELS,
  EVENT_REPEAT_LABELS,
  type EventInput,
  type LocalizedText,
} from '@indoor/domain';
import { Badge } from '@indoor/ui';
import { ExternalLinkIcon, MapPinIcon } from 'lucide-react';
import { inVenueTime } from '../../app/format';

const pick = (text: LocalizedText, language: 'id' | 'en') =>
  language === 'en' && text.en.trim() ? text.en : text.id;

export function scheduleText(
  event: Pick<EventInput, 'startsAt' | 'endsAt' | 'repeat' | 'repeatUntil'>,
  timezone: string,
): string {
  if (!event.startsAt || !event.endsAt) return '';
  const range = `${inVenueTime(event.startsAt, timezone)} – ${inVenueTime(event.endsAt, timezone)}`;
  if (event.repeat === 'none' || !event.repeatUntil) return range;
  const until = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${event.repeatUntil}T00:00:00Z`));
  return `${range} · ${EVENT_REPEAT_LABELS[event.repeat].toLowerCase()} sampai ${until}`;
}

export function EventCard({
  event,
  imageUrl,
  timezone,
  locationNames,
  language,
}: {
  event: EventInput;
  imageUrl: string | null;
  timezone: string;
  locationNames: readonly string[];
  language: 'id' | 'en';
}) {
  const title = pick(event.title, language);
  const summary = pick(event.summary, language);
  return (
    <article
      aria-label="Pratinjau kartu"
      className="grid w-full min-w-0 max-w-sm overflow-hidden rounded-md border border-line bg-surface shadow-sm"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="aspect-video w-full object-cover" />
      ) : (
        <div className="aspect-video w-full bg-canvas" aria-hidden="true" />
      )}
      <div className="grid min-w-0 gap-2 p-4 [overflow-wrap:anywhere]">
        <Badge className="w-fit">{EVENT_KIND_LABELS[event.kind]}</Badge>
        <h3 className="font-bold text-lg leading-tight">{title || 'Judul event'}</h3>
        {summary ? <p className="text-ink-muted text-sm">{summary}</p> : null}
        <p className="text-sm">{scheduleText(event, timezone)}</p>
        {locationNames.length ? (
          <p className="flex items-center gap-1 text-sm">
            <MapPinIcon className="size-4 shrink-0" aria-hidden="true" />
            {locationNames.join(', ')}
          </p>
        ) : null}
        {event.linkUrl ? (
          <p className="flex items-center gap-1 truncate text-sm underline">
            <ExternalLinkIcon className="size-4 shrink-0" aria-hidden="true" />
            {event.linkUrl}
          </p>
        ) : null}
      </div>
    </article>
  );
}
