export const EVENT_KINDS = ['event', 'promotion'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const EVENT_STATUSES = ['draft', 'active', 'ended'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_REPEATS = ['none', 'daily', 'weekly'] as const;
export type EventRepeat = (typeof EVENT_REPEATS)[number];

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  event: 'Acara',
  promotion: 'Promosi',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draf',
  active: 'Aktif',
  ended: 'Diakhiri',
};

export const EVENT_REPEAT_LABELS: Record<EventRepeat, string> = {
  none: 'Tidak berulang',
  daily: 'Setiap hari',
  weekly: 'Setiap minggu',
};

export const EVENT_LIMITS = { title: 120, summary: 280, description: 5000, link: 500 } as const;

export interface LocalizedText {
  id: string;
  en: string;
}

export interface EventPoint {
  floorId: string;
  coordinates: [number, number];
}

export interface VenueEvent {
  id: string;
  venueId: string;
  kind: EventKind;
  status: EventStatus;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  imagePath: string | null;
  linkUrl: string | null;
  startsAt: string;
  endsAt: string;
  repeat: EventRepeat;
  repeatUntil: string | null;
  lastEndsAt: string;
  point: EventPoint | null;
  locationIds: string[];
}

export type EventInput = Omit<VenueEvent, 'id' | 'venueId' | 'lastEndsAt'>;

export interface EventOccurrence {
  startsAt: string;
  endsAt: string;
}

export type EventPhase = 'draft' | 'live' | 'upcoming' | 'ended';

export const EVENT_PHASE_LABELS: Record<EventPhase, string> = {
  draft: 'Draf',
  live: 'Berlangsung',
  upcoming: 'Akan datang',
  ended: 'Selesai',
};

const DAY_MS = 86_400_000;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function wallClock(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
    instant.getUTCMilliseconds(),
  );
}

const offsetAt = (instant: number, timeZone: string) =>
  wallClock(new Date(instant), timeZone) - instant;

function fromWallClock(wall: number, timeZone: string): number {
  let guess = wall - offsetAt(wall, timeZone);
  guess = wall - offsetAt(guess, timeZone);
  return guess;
}

export function localDate(instant: Date, timeZone: string): string {
  return new Date(wallClock(instant, timeZone)).toISOString().slice(0, 10);
}

const addYear = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

const stepDays = (repeat: EventRepeat) => (repeat === 'weekly' ? 7 : 1);

type Schedule = Pick<VenueEvent, 'startsAt' | 'endsAt' | 'repeat' | 'repeatUntil'>;

function occurrenceCount(event: Schedule, timeZone: string): number {
  if (event.repeat === 'none' || !event.repeatUntil) return 1;
  const first = localDate(new Date(event.startsAt), timeZone);
  const days = Math.round(
    (Date.parse(`${event.repeatUntil}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / DAY_MS,
  );
  return days < 0 ? 0 : Math.floor(days / stepDays(event.repeat)) + 1;
}

function occurrenceAt(event: Schedule, timeZone: string, index: number): EventOccurrence {
  const start = Date.parse(event.startsAt);
  const duration = Date.parse(event.endsAt) - start;
  const shifted =
    index === 0
      ? start
      : fromWallClock(
          wallClock(new Date(start), timeZone) + index * stepDays(event.repeat) * DAY_MS,
          timeZone,
        );
  return {
    startsAt: new Date(shifted).toISOString(),
    endsAt: new Date(shifted + duration).toISOString(),
  };
}

export function eventLastEndsAt(event: Schedule, timeZone: string): string {
  const count = occurrenceCount(event, timeZone);
  return occurrenceAt(event, timeZone, Math.max(0, count - 1)).endsAt;
}

export function eventOccurrences(
  event: Schedule,
  timeZone: string,
  from: Date,
  to: Date,
): EventOccurrence[] {
  const count = occurrenceCount(event, timeZone);
  const result: EventOccurrence[] = [];
  const start = Date.parse(event.startsAt);
  const span = stepDays(event.repeat) * DAY_MS;
  const skip =
    event.repeat === 'none' ? 0 : Math.max(0, Math.floor((from.getTime() - start) / span) - 1);
  for (let index = skip; index < count; index++) {
    const occurrence = occurrenceAt(event, timeZone, index);
    if (Date.parse(occurrence.startsAt) >= to.getTime()) break;
    if (Date.parse(occurrence.endsAt) > from.getTime()) result.push(occurrence);
  }
  return result;
}

export function nextOccurrence(
  event: Schedule,
  timeZone: string,
  now: Date,
): EventOccurrence | null {
  const horizon = new Date(Date.parse(eventLastEndsAt(event, timeZone)) + 1);
  return eventOccurrences(event, timeZone, now, horizon)[0] ?? null;
}

export function eventPhase(
  event: Schedule & Pick<VenueEvent, 'status'>,
  timeZone: string,
  now: Date,
): EventPhase {
  if (event.status === 'draft') return 'draft';
  if (event.status === 'ended') return 'ended';
  const next = nextOccurrence(event, timeZone, now);
  if (!next) return 'ended';
  return Date.parse(next.startsAt) <= now.getTime() ? 'live' : 'upcoming';
}

export type EventInputErrors = Partial<
  Record<
    | 'title'
    | 'titleEn'
    | 'summary'
    | 'description'
    | 'startsAt'
    | 'endsAt'
    | 'repeatUntil'
    | 'linkUrl',
    string
  >
>;

export function validateEventInput(input: EventInput, timeZone: string): EventInputErrors {
  const errors: EventInputErrors = {};
  const title = input.title.id.trim();
  if (!title) errors.title = 'Judul (Indonesia) wajib diisi.';
  else if (title.length > EVENT_LIMITS.title) {
    errors.title = `Judul paling banyak ${EVENT_LIMITS.title} karakter.`;
  }
  if (input.title.en.length > EVENT_LIMITS.title) {
    errors.titleEn = `Judul paling banyak ${EVENT_LIMITS.title} karakter.`;
  }
  if (Math.max(input.summary.id.length, input.summary.en.length) > EVENT_LIMITS.summary) {
    errors.summary = `Ringkasan paling banyak ${EVENT_LIMITS.summary} karakter.`;
  }
  if (
    Math.max(input.description.id.length, input.description.en.length) > EVENT_LIMITS.description
  ) {
    errors.description = `Deskripsi paling banyak ${EVENT_LIMITS.description} karakter.`;
  }
  if (input.linkUrl !== null && input.linkUrl !== '') {
    if (!/^https?:\/\/\S+$/.test(input.linkUrl) || input.linkUrl.length > EVENT_LIMITS.link) {
      errors.linkUrl = 'Tautan harus diawali http:// atau https://.';
    }
  }
  const starts = Date.parse(input.startsAt);
  const ends = Date.parse(input.endsAt);
  if (Number.isNaN(starts)) errors.startsAt = 'Waktu mulai tidak valid.';
  if (Number.isNaN(ends)) errors.endsAt = 'Waktu selesai tidak valid.';
  if (errors.startsAt || errors.endsAt) return errors;
  if (ends <= starts) {
    errors.endsAt = 'Waktu selesai harus setelah waktu mulai.';
    return errors;
  }
  const limit = new Date(starts);
  limit.setUTCFullYear(limit.getUTCFullYear() + 1);
  if (ends > limit.getTime()) {
    errors.endsAt = 'Durasi event paling lama 1 tahun.';
    return errors;
  }
  if (input.repeat !== 'none') {
    const first = localDate(new Date(starts), timeZone);
    if (!input.repeatUntil || !DATE.test(input.repeatUntil) || input.repeatUntil < first) {
      errors.repeatUntil = 'Ulangi sampai harus pada atau setelah tanggal mulai.';
    } else if (input.repeatUntil > addYear(first)) {
      errors.repeatUntil = 'Jadwal berulang paling lama 1 tahun.';
    } else if (ends - starts > stepDays(input.repeat) * DAY_MS) {
      errors.endsAt = 'Durasi satu kemunculan lebih panjang dari jarak pengulangannya.';
    }
  }
  return errors;
}

export function eventTitle(event: Pick<VenueEvent, 'title'>, language: string): string {
  return language === 'en' && event.title.en.trim() ? event.title.en : event.title.id;
}

export const EVENT_SOON_DAYS = 7;

export interface EventListing {
  event: VenueEvent;
  phase: 'live' | 'upcoming';
  occurrence: EventOccurrence;
}

export function currentEvents(
  events: readonly VenueEvent[],
  timeZone: string,
  now: Date,
  soonDays = EVENT_SOON_DAYS,
): EventListing[] {
  const horizon = now.getTime() + soonDays * DAY_MS;
  const listings: EventListing[] = [];
  for (const event of events) {
    if (event.status !== 'active') continue;
    const occurrence = nextOccurrence(event, timeZone, now);
    if (!occurrence) continue;
    const start = Date.parse(occurrence.startsAt);
    if (start <= now.getTime()) listings.push({ event, phase: 'live', occurrence });
    else if (start <= horizon) listings.push({ event, phase: 'upcoming', occurrence });
  }
  return listings.sort(
    (a, b) =>
      (a.phase === b.phase ? 0 : a.phase === 'live' ? -1 : 1) ||
      Date.parse(a.occurrence.startsAt) - Date.parse(b.occurrence.startsAt) ||
      a.event.title.id.localeCompare(b.event.title.id, 'id'),
  );
}

export function localizedText(text: LocalizedText, language: string): string {
  return language === 'en' && text.en.trim() ? text.en : text.id;
}
