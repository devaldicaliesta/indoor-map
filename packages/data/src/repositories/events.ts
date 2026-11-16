import {
  type EventInput,
  type EventKind,
  MAX_IMAGE_BYTES,
  type VenueEvent,
  type VenueId,
} from '@indoor/domain';
import type { Tables } from '../database.types';
import { DataError, toDataError } from '../errors';
import { geometryToColumn, positionFromColumn } from '../geometry';
import { zeroRowsError } from '../mutations';
import { fetchAllPages, listPage, type Page, type PageQuery } from '../pagination';
import type { Db } from '../supabase';

const ASSETS_BUCKET = 'public-assets';
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const FIELDS = `id, venue_id, kind, status, title_id, title_en, summary_id, summary_en,
  description_id, description_en, image_path, link_url, starts_at, ends_at, repeat, repeat_until,
  last_ends_at, floor_id, geom`;
const COLUMNS = `${FIELDS}, event_locations(location_id)`;

type EventRow = Pick<
  Tables<'events'>,
  | 'id'
  | 'venue_id'
  | 'kind'
  | 'status'
  | 'title_id'
  | 'title_en'
  | 'summary_id'
  | 'summary_en'
  | 'description_id'
  | 'description_en'
  | 'image_path'
  | 'link_url'
  | 'starts_at'
  | 'ends_at'
  | 'repeat'
  | 'repeat_until'
  | 'last_ends_at'
  | 'floor_id'
  | 'geom'
> & { event_locations: { location_id: string }[] | null };

export type EventListState = 'draft' | 'current' | 'ended';

export interface EventPageFilters {
  kinds: readonly EventKind[];
  states: readonly EventListState[];
  from: string | null;
  to: string | null;
  locationId: string | null;
  timeZone: string;
}

export interface EventsRepository {
  listPage(venueId: VenueId, query: PageQuery<EventPageFilters>): Promise<Page<VenueEvent>>;
  listCurrent(venueId: VenueId, now: Date): Promise<VenueEvent[]>;
  get(id: string): Promise<VenueEvent>;
  create(venueId: VenueId, input: EventInput): Promise<VenueEvent>;
  update(id: string, input: EventInput): Promise<VenueEvent>;
  remove(id: string): Promise<void>;
  uploadImage(venueId: VenueId, file: Blob): Promise<string>;
  imageUrl(path: string): string;
}

const blank = (value: string) => (value.trim() ? value.trim() : null);

export function toEventRow(input: EventInput) {
  return {
    kind: input.kind,
    status: input.status,
    title_id: input.title.id.trim(),
    title_en: blank(input.title.en),
    summary_id: blank(input.summary.id),
    summary_en: blank(input.summary.en),
    description_id: blank(input.description.id),
    description_en: blank(input.description.en),
    image_path: input.imagePath,
    link_url: input.linkUrl ? blank(input.linkUrl) : null,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    repeat: input.repeat,
    repeat_until: input.repeat === 'none' ? null : input.repeatUntil,
    floor_id: input.point?.floorId ?? null,
    geom: input.point
      ? geometryToColumn({ type: 'Point', coordinates: input.point.coordinates })
      : null,
  };
}

export function mapEventRow(row: EventRow): VenueEvent {
  const coordinates = row.geom ? positionFromColumn(row.geom) : null;
  return {
    id: row.id,
    venueId: row.venue_id,
    kind: row.kind,
    status: row.status,
    title: { id: row.title_id, en: row.title_en ?? '' },
    summary: { id: row.summary_id ?? '', en: row.summary_en ?? '' },
    description: { id: row.description_id ?? '', en: row.description_en ?? '' },
    imagePath: row.image_path,
    linkUrl: row.link_url,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    repeat: row.repeat,
    repeatUntil: row.repeat_until,
    lastEndsAt: row.last_ends_at,
    point:
      row.floor_id && coordinates
        ? { floorId: row.floor_id, coordinates: [coordinates[0], coordinates[1]] }
        : null,
    locationIds: (row.event_locations ?? []).map((l) => l.location_id).sort(),
  };
}

const quote = (value: string) => `"${value.replace(/["\\]/g, '\\$&')}"`;

export function createEventsRepository(db: Db): EventsRepository {
  const storage = () => db.storage.from(ASSETS_BUCKET);

  async function isVisible(id: string) {
    const { data } = await db.from('events').select('id').eq('id', id).maybeSingle();
    return data !== null;
  }

  async function get(id: string): Promise<VenueEvent> {
    const { data, error } = await db.from('events').select(COLUMNS).eq('id', id).single();
    if (error) throw toDataError(error);
    return mapEventRow(data as EventRow);
  }

  async function setLocations(eventId: string, locationIds: readonly string[]) {
    const { error: removeError } = await db
      .from('event_locations')
      .delete()
      .eq('event_id', eventId);
    if (removeError) throw toDataError(removeError);
    if (!locationIds.length) return;
    const { error } = await db
      .from('event_locations')
      .insert([...new Set(locationIds)].map((location_id) => ({ event_id: eventId, location_id })));
    if (error) throw toDataError(error);
  }

  return {
    listPage(venueId, { q, filters, page, size }) {
      const now = new Date().toISOString();
      const embed = filters.locationId
        ? 'event_locations!inner(location_id)'
        : 'event_locations(location_id)';
      return listPage(
        (from, to) => {
          let request = db
            .from('events')
            .select(`${FIELDS}, ${embed}`, { count: 'exact' })
            .eq('venue_id', venueId);
          const needle = q
            .trim()
            .replace(/[%_,()]/g, ' ')
            .trim();
          if (needle) {
            const like = quote(`%${needle}%`);
            request = request.or(
              `title_id.ilike.${like},title_en.ilike.${like},summary_id.ilike.${like}`,
            );
          }
          if (filters.kinds.length) request = request.in('kind', [...filters.kinds]);
          if (filters.locationId) {
            request = request.eq('event_locations.location_id', filters.locationId);
          }
          if (filters.states.length) {
            const parts: string[] = [];
            for (const state of filters.states) {
              if (state === 'draft') parts.push('status.eq.draft');
              if (state === 'ended') {
                parts.push(
                  'status.eq.ended',
                  `and(status.eq.active,last_ends_at.lte.${quote(now)})`,
                );
              }
              if (state === 'current') {
                parts.push(`and(status.eq.active,last_ends_at.gt.${quote(now)})`);
              }
            }
            request = request.or([...new Set(parts)].join(','));
          }
          if (filters.from) {
            request = request.gt('last_ends_at', dayStart(filters.from, filters.timeZone));
          }
          if (filters.to) {
            request = request.lt('starts_at', dayStart(nextDay(filters.to), filters.timeZone));
          }
          return request.order('starts_at', { ascending: false }).order('id').range(from, to);
        },
        { page, size },
        (rows) => (rows as unknown as EventRow[]).map(mapEventRow),
      );
    },

    async listCurrent(venueId, now) {
      const rows = await fetchAllPages((from, to) =>
        db
          .from('events')
          .select(COLUMNS)
          .eq('venue_id', venueId)
          .eq('status', 'active')
          .gt('last_ends_at', now.toISOString())
          .order('starts_at')
          .order('id')
          .range(from, to),
      );
      return (rows as unknown as EventRow[]).map(mapEventRow);
    },

    get,

    async create(venueId, input) {
      const { data, error } = await db
        .from('events')
        .insert({ venue_id: venueId, ...toEventRow(input) })
        .select('id')
        .single();
      if (error) throw toDataError(error);
      await setLocations(data.id, input.locationIds);
      return get(data.id);
    },

    async update(id, input) {
      const before = await get(id);
      const { data, error } = await db
        .from('events')
        .update(toEventRow(input))
        .eq('id', id)
        .select('id');
      if (error) throw toDataError(error);
      if (!data?.length) throw await zeroRowsError(() => isVisible(id));
      await setLocations(id, input.locationIds);
      if (before.imagePath && before.imagePath !== input.imagePath) {
        await storage()
          .remove([before.imagePath])
          .then(undefined, () => undefined);
      }
      return get(id);
    },

    async remove(id) {
      const { data, error } = await db.from('events').delete().eq('id', id).select('image_path');
      if (error) throw toDataError(error);
      if (!data?.length) throw await zeroRowsError(() => isVisible(id));
      const path = data[0]?.image_path;
      if (path)
        await storage()
          .remove([path])
          .then(undefined, () => undefined);
    },

    async uploadImage(venueId, file) {
      const extension = IMAGE_EXTENSIONS[file.type];
      if (!extension) {
        throw new DataError('invalid', { message: 'Gambar harus berupa PNG, JPG, atau WebP.' });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new DataError('invalid', { message: 'Gambar terlalu besar. Maksimal 5 MB.' });
      }
      const path = `events/${venueId}/${globalThis.crypto.randomUUID()}.${extension}`;
      const { error } = await storage().upload(path, file, { contentType: file.type });
      if (error) throw toDataError(error);
      return path;
    },

    imageUrl(path) {
      return storage().getPublicUrl(path).data.publicUrl;
    },
  };
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function dayStart(date: string, timeZone: string): string {
  const utc = Date.parse(`${date}T00:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(utc));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return new Date(utc - (wall - utc)).toISOString();
}
