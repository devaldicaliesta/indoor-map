import {
  EVENT_KIND_LABELS,
  eventTitle,
  INFO_POINT_PLAYLIST_SLIDE_RANGE,
  type InfoPointPlaylist,
  lockedFeatureMessage,
  type VenueId,
} from '@indoor/domain';
import { Input, Label } from '@indoor/ui';
import { Field } from '../../app/components/field';
import { useFeature } from '../license/queries';
import { usePlaylistEvents } from './queries';

export interface PlaylistDraft {
  enabled: boolean;
  slideSeconds: string;
  eventIds: string[];
  pick: 'all' | 'some';
}

export const playlistDraft = (playlist: InfoPointPlaylist): PlaylistDraft => ({
  enabled: playlist.enabled,
  slideSeconds: String(playlist.slideSeconds),
  eventIds: playlist.eventIds,
  pick: playlist.eventIds.length ? 'some' : 'all',
});

export const playlistOf = (draft: PlaylistDraft): InfoPointPlaylist => ({
  enabled: draft.enabled,
  slideSeconds: Number(draft.slideSeconds),
  eventIds: draft.pick === 'some' ? draft.eventIds : [],
});

export function PlaylistFields({
  venueId,
  draft,
  onChange,
}: {
  venueId: VenueId;
  draft: PlaylistDraft;
  onChange: (draft: PlaylistDraft) => void;
}) {
  const allowed = useFeature('events');
  const events = usePlaylistEvents(venueId, allowed && draft.enabled && draft.pick === 'some');
  const set = <K extends keyof PlaylistDraft>(key: K, value: PlaylistDraft[K]) =>
    onChange({ ...draft, [key]: value });
  const { min, max } = INFO_POINT_PLAYLIST_SLIDE_RANGE;
  return (
    <fieldset className="grid gap-3 rounded-md border border-line p-3">
      <legend className="px-1 font-bold text-sm">Playlist promosi saat idle</legend>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={allowed && draft.enabled}
          disabled={!allowed}
          onChange={(e) => set('enabled', e.target.checked)}
          className="size-4 accent-ink"
        />
        Putar Event & Promo di layar penuh saat tidak dipakai
      </label>
      {allowed ? null : <p className="text-ink-muted text-sm">{lockedFeatureMessage('events')}</p>}
      {allowed && draft.enabled ? (
        <>
          <Field id="ip-slide" label="Durasi per slide (detik)" hint={`${min}–${max} detik.`}>
            <Input
              id="ip-slide"
              inputMode="numeric"
              className="w-28 font-mono tabular-nums"
              value={draft.slideSeconds}
              onChange={(e) => set('slideSeconds', e.target.value)}
            />
          </Field>
          <div role="radiogroup" aria-label="Event yang diputar" className="flex gap-4">
            {(
              [
                ['all', 'Semua event aktif'],
                ['some', 'Event tertentu'],
              ] as const
            ).map(([value, label]) => (
              <Label key={value} className="flex cursor-pointer items-center gap-2 font-normal">
                <input
                  type="radio"
                  name="ip-playlist-pick"
                  checked={draft.pick === value}
                  onChange={() => set('pick', value)}
                  className="size-4 accent-(--color-ink)"
                />
                {label}
              </Label>
            ))}
          </div>
          {draft.pick === 'some' ? (
            <ul aria-label="Pilih event" className="grid max-h-48 gap-1 overflow-y-auto">
              {events.data?.length === 0 ? (
                <li className="text-ink-muted text-sm">Belum ada event aktif.</li>
              ) : null}
              {events.data?.map((event) => (
                <li key={event.id}>
                  <label className="flex items-center gap-2 [overflow-wrap:anywhere]">
                    <input
                      type="checkbox"
                      checked={draft.eventIds.includes(event.id)}
                      onChange={(e) =>
                        set(
                          'eventIds',
                          e.target.checked
                            ? [...draft.eventIds, event.id]
                            : draft.eventIds.filter((id) => id !== event.id),
                        )
                      }
                      className="size-4 shrink-0 accent-ink"
                    />
                    <span>
                      {eventTitle(event, 'id')}
                      <span className="text-ink-muted"> · {EVENT_KIND_LABELS[event.kind]}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </fieldset>
  );
}
