import {
  checkImageFile,
  EVENT_KIND_LABELS,
  EVENT_KINDS,
  EVENT_LIMITS,
  EVENT_REPEAT_LABELS,
  EVENT_REPEATS,
  EVENT_STATUS_LABELS,
  EVENT_STATUSES,
  type EventInput,
  type EventKind,
  type EventPoint,
  type EventRepeat,
  type EventStatus,
  localDate,
  normalizeSearchText,
  type VenueEvent,
  type VenueId,
  validateEventInput,
} from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@indoor/ui';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { fromVenueInput, toVenueInput } from '../closures/closure-model';
import { IMAGE_MESSAGES } from '../locations/labels';
import { EventCard } from './event-card';
import { EventPointPicker } from './event-point-picker';
import { eventImageUrl, useEventMutations, useVenueLocationNames } from './queries';

const TEXTAREA =
  'w-full rounded-sm border border-ink-muted bg-surface px-3 py-2 text-ink disabled:cursor-not-allowed disabled:opacity-50';

const HOUR = 3_600_000;

function emptyInput(): EventInput {
  const start = new Date(Math.ceil(Date.now() / HOUR) * HOUR);
  return {
    kind: 'event',
    status: 'draft',
    title: { id: '', en: '' },
    summary: { id: '', en: '' },
    description: { id: '', en: '' },
    imagePath: null,
    linkUrl: null,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 2 * HOUR).toISOString(),
    repeat: 'none',
    repeatUntil: null,
    point: null,
    locationIds: [],
  };
}

const inputOf = (event: VenueEvent): EventInput => {
  const { id: _id, venueId: _venue, lastEndsAt: _last, ...input } = event;
  return input;
};

function LocationPicker({
  venueId,
  value,
  onChange,
}: {
  venueId: VenueId;
  value: readonly string[];
  onChange: (ids: string[]) => void;
}) {
  const locations = useVenueLocationNames(venueId).data ?? [];
  const [q, setQ] = useState('');
  const needle = normalizeSearchText(q);
  const shown = locations
    .filter(
      (l) =>
        value.includes(l.id) ||
        !needle ||
        normalizeSearchText(`${l.name} ${l.code ?? ''}`).includes(needle),
    )
    .slice(0, 50);
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-bold text-sm">Lokasi ({value.length} dipilih)</legend>
      <Input
        type="search"
        aria-label="Cari lokasi"
        placeholder="Cari nama atau kode lokasi"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="grid max-h-40 gap-1 overflow-y-auto rounded-sm border border-line p-2">
        {shown.length === 0 ? (
          <li className="text-ink-muted text-sm">Tidak ada lokasi.</li>
        ) : (
          shown.map((location) => (
            <li key={location.id}>
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <input
                  type="checkbox"
                  aria-label={`Tautkan ${location.name}`}
                  checked={value.includes(location.id)}
                  onChange={() => toggle(location.id)}
                  className="size-4 accent-(--color-ink)"
                />
                {location.name}
                {location.code ? (
                  <span className="text-ink-muted text-xs">{location.code}</span>
                ) : null}
              </Label>
            </li>
          ))
        )}
      </ul>
    </fieldset>
  );
}

function EventForm({
  venueId,
  timezone,
  event,
  onDone,
}: {
  venueId: VenueId;
  timezone: string;
  event: VenueEvent | null;
  onDone: () => void;
}) {
  const { save } = useEventMutations(venueId);
  const [input, setInput] = useState<EventInput>(() => (event ? inputOf(event) : emptyInput()));
  const [starts, setStarts] = useState(() => toVenueInput(input.startsAt, timezone));
  const [ends, setEnds] = useState(() => toVenueInput(input.endsAt, timezone));
  const [image, setImage] = useState<File | null>(null);
  const [imageProblem, setImageProblem] = useState<string | null>(null);
  const [preview, setPreview] = useState<'id' | 'en'>('id');
  const [picking, setPicking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const locations = useVenueLocationNames(venueId).data ?? [];

  const localUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => (localUrl ? URL.revokeObjectURL(localUrl) : undefined), [localUrl]);

  const draft: EventInput = {
    ...input,
    startsAt: fromVenueInput(starts, timezone) ?? '',
    endsAt: fromVenueInput(ends, timezone) ?? '',
    linkUrl: input.linkUrl?.trim() ? input.linkUrl.trim() : null,
  };
  const errors = validateEventInput(draft, timezone);
  const shown = submitted ? errors : {};
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));
  const setText = (
    key: 'title' | 'summary' | 'description',
    language: 'id' | 'en',
    value: string,
  ) => setInput((current) => ({ ...current, [key]: { ...current[key], [language]: value } }));

  function chooseImage(file: File | undefined) {
    if (!file) return;
    const check = checkImageFile(file);
    setImageProblem(check.ok ? null : IMAGE_MESSAGES[check.problem]);
    if (check.ok) setImage(file);
  }

  function changeRepeat(repeat: EventRepeat) {
    setInput((current) => ({
      ...current,
      repeat,
      repeatUntil:
        repeat === 'none'
          ? null
          : (current.repeatUntil ??
            localDate(new Date(fromVenueInput(starts, timezone) ?? Date.now()), timezone)),
    }));
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || imageProblem) return;
    save.mutate(
      { id: event?.id ?? null, input: draft, image },
      {
        onSuccess: () => {
          toast.success(event ? 'Event diperbarui' : 'Event disimpan');
          onDone();
        },
      },
    );
  }

  const imageUrl = localUrl ?? (input.imagePath ? eventImageUrl(input.imagePath) : null);
  const names = locations.filter((l) => input.locationIds.includes(l.id)).map((l) => l.name);

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>{event ? 'Ubah event' : 'Event baru'}</DialogTitle>
        <DialogDescription>
          Tampil di Visitor tanpa publish selama status Aktif dan jadwalnya belum lewat.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid content-start gap-4">
          <div className="grid grid-cols-2 gap-3">
            <fieldset className="grid gap-1">
              <legend className="mb-1 font-bold text-sm">Jenis</legend>
              <div className="flex gap-4">
                {EVENT_KINDS.map((kind) => (
                  <Label key={kind} className="flex cursor-pointer items-center gap-2 font-normal">
                    <input
                      type="radio"
                      name="event-kind"
                      checked={input.kind === kind}
                      onChange={() => set('kind', kind as EventKind)}
                      className="size-4 accent-(--color-ink)"
                    />
                    {EVENT_KIND_LABELS[kind]}
                  </Label>
                ))}
              </div>
            </fieldset>
            <Field id="event-status" label="Status">
              <Select value={input.status} onValueChange={(v) => set('status', v as EventStatus)}>
                <SelectTrigger id="event-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {EVENT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id="event-title-id" label="Judul (Indonesia)" error={shown.title}>
              <Input
                id="event-title-id"
                value={input.title.id}
                maxLength={EVENT_LIMITS.title + 20}
                aria-invalid={shown.title ? true : undefined}
                onChange={(e) => setText('title', 'id', e.target.value)}
              />
            </Field>
            <Field id="event-title-en" label="Judul (English, opsional)" error={shown.titleEn}>
              <Input
                id="event-title-en"
                value={input.title.en}
                onChange={(e) => setText('title', 'en', e.target.value)}
              />
            </Field>
            <Field id="event-summary-id" label="Ringkasan (Indonesia)" error={shown.summary}>
              <textarea
                id="event-summary-id"
                rows={2}
                value={input.summary.id}
                onChange={(e) => setText('summary', 'id', e.target.value)}
                className={TEXTAREA}
              />
            </Field>
            <Field id="event-summary-en" label="Ringkasan (English)">
              <textarea
                id="event-summary-en"
                rows={2}
                value={input.summary.en}
                onChange={(e) => setText('summary', 'en', e.target.value)}
                className={TEXTAREA}
              />
            </Field>
            <Field
              id="event-description-id"
              label="Deskripsi (Indonesia)"
              error={shown.description}
            >
              <textarea
                id="event-description-id"
                rows={4}
                value={input.description.id}
                onChange={(e) => setText('description', 'id', e.target.value)}
                className={TEXTAREA}
              />
            </Field>
            <Field id="event-description-en" label="Deskripsi (English)">
              <textarea
                id="event-description-en"
                rows={4}
                value={input.description.en}
                onChange={(e) => setText('description', 'en', e.target.value)}
                className={TEXTAREA}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id="event-starts" label="Mulai" error={shown.startsAt}>
              <Input
                id="event-starts"
                type="datetime-local"
                value={starts}
                onChange={(e) => setStarts(e.target.value)}
              />
            </Field>
            <Field id="event-ends" label="Selesai" error={shown.endsAt}>
              <Input
                id="event-ends"
                type="datetime-local"
                value={ends}
                aria-invalid={shown.endsAt ? true : undefined}
                onChange={(e) => setEnds(e.target.value)}
              />
            </Field>
            <Field id="event-repeat" label="Ulangi">
              <Select value={input.repeat} onValueChange={(v) => changeRepeat(v as EventRepeat)}>
                <SelectTrigger id="event-repeat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_REPEATS.map((repeat) => (
                    <SelectItem key={repeat} value={repeat}>
                      {EVENT_REPEAT_LABELS[repeat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {input.repeat !== 'none' ? (
              <Field
                id="event-repeat-until"
                label="Ulangi sampai"
                hint="Tanggal terakhir, paling lama 1 tahun."
                error={shown.repeatUntil}
              >
                <Input
                  id="event-repeat-until"
                  type="date"
                  value={input.repeatUntil ?? ''}
                  onChange={(e) => set('repeatUntil', e.target.value || null)}
                />
              </Field>
            ) : null}
          </div>
          <Field id="event-link" label="Tautan (opsional)" error={shown.linkUrl}>
            <Input
              id="event-link"
              type="url"
              placeholder="https://"
              value={input.linkUrl ?? ''}
              onChange={(e) => set('linkUrl', e.target.value)}
            />
          </Field>
          <Field
            id="event-image"
            label="Gambar (opsional)"
            hint="PNG, JPG, atau WebP, maksimal 5 MB. Rasio 16:9 paling pas."
            error={imageProblem ?? undefined}
          >
            <div className="flex items-center gap-2">
              <Input
                id="event-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => chooseImage(e.target.files?.[0])}
              />
              {imageUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setImage(null);
                    set('imagePath', null);
                  }}
                >
                  Hapus gambar
                </Button>
              ) : null}
            </div>
          </Field>
          <LocationPicker
            venueId={venueId}
            value={input.locationIds}
            onChange={(ids) => set('locationIds', ids)}
          />
          <div className="grid gap-1">
            <span className="font-bold text-sm">Titik peta (opsional)</span>
            <p className="text-ink-muted text-sm">
              Untuk acara di area umum yang tidak punya lokasi, misalnya panggung di lobi.
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={() => setPicking(true)}>
                {input.point ? 'Ubah titik' : 'Pilih titik di peta'}
              </Button>
              {input.point ? (
                <>
                  <span className="text-sm">Titik dipilih</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => set('point', null)}
                  >
                    Hapus titik
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid content-start gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">Pratinjau kartu</span>
            <div className="flex gap-1">
              {(['id', 'en'] as const).map((language) => (
                <Button
                  key={language}
                  type="button"
                  size="sm"
                  variant={preview === language ? 'primary' : 'ghost'}
                  aria-pressed={preview === language}
                  onClick={() => setPreview(language)}
                >
                  {language.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <EventCard
            event={draft}
            imageUrl={imageUrl}
            timezone={timezone}
            locationNames={names}
            language={preview}
          />
        </div>
      </div>
      {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={save.isPending}>
          {save.isPending ? 'Menyimpan…' : 'Simpan event'}
        </Button>
      </DialogFooter>
      {picking ? (
        <EventPointPicker
          venueId={venueId}
          initial={input.point}
          onClose={() => setPicking(false)}
          onDone={(point: EventPoint) => {
            set('point', point);
            setPicking(false);
          }}
        />
      ) : null}
    </form>
  );
}

export function EventDialog({
  venueId,
  timezone,
  open,
  event,
  onClose,
}: {
  venueId: VenueId;
  timezone: string;
  open: boolean;
  event: VenueEvent | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        {open ? (
          <EventForm
            key={event?.id ?? 'baru'}
            venueId={venueId}
            timezone={timezone}
            event={event}
            onDone={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
