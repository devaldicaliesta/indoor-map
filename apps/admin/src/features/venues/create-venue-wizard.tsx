import {
  templateSummary,
  VENUE_TEMPLATES,
  VENUE_TYPES,
  type Venue,
  type VenueInput,
  type VenueType,
} from '@indoor/domain';
import { Button, cn, DialogFooter, toast } from '@indoor/ui';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { data } from '../../app/data-client';
import { useVenueSelection } from '../../app/venue-store';
import { FormNotice } from '../auth/auth-layout';
import { useInvalidateVenues } from './queries';

/** Data dasar dari langkah 1, belum disimpan. */
export interface VenueBasics {
  input: VenueInput;
  logo: File | null;
}

/**
 * Buat venue lalu salin template. Bila template gagal setelah venue terbuat, percobaan berikutnya
 * hanya menerapkan template ke venue yang sama (tidak membuat venue ganda).
 */
function useCreateFromTemplate() {
  const invalidate = useInvalidateVenues();
  const select = useVenueSelection((state) => state.setVenueId);
  const [created, setCreated] = useState<Venue | null>(null);
  const mutation = useMutation({
    mutationFn: async ({ basics, type }: { basics: VenueBasics; type: VenueType }) => {
      let venue = created;
      if (!venue) {
        venue = await data.venues.create(basics.input);
        if (basics.logo) venue = await data.venues.uploadLogo(venue.id, basics.logo);
        setCreated(venue);
      }
      await data.venues.applyTemplate(venue.id, VENUE_TEMPLATES[type]);
      return venue;
    },
    onSettled: async (venue) => {
      await invalidate();
      if (venue) select(venue.id);
    },
  });
  return { mutation, created };
}

function TemplatePreview({ type }: { type: VenueType }) {
  const summary = templateSummary(VENUE_TEMPLATES[type]);
  return (
    <div className="grid max-h-72 gap-3 overflow-y-auto rounded-sm border border-line p-3 text-sm">
      {summary.locationTypes.map((t) => (
        <div key={t.name}>
          <p className="font-bold">{t.name}</p>
          {t.fields.length ? <p className="text-ink-muted">Field: {t.fields.join(', ')}</p> : null}
          {t.categories.length ? (
            <p className="text-ink-muted">Kategori: {t.categories.join(', ')}</p>
          ) : null}
        </div>
      ))}
      <div>
        <p className="font-bold">Jenis fasilitas</p>
        <p className="text-ink-muted">{summary.facilityTypes.join(', ')}</p>
      </div>
      {summary.aliases ? (
        <p className="text-ink-muted">{summary.aliases} kata pencarian awal.</p>
      ) : null}
    </div>
  );
}

/** Langkah 2 (pilih tipe dengan pratinjau) dan 3 (konfirmasi) wizard tambah venue. */
export function CreateVenueSteps({
  basics,
  onBack,
  onDone,
}: {
  basics: VenueBasics;
  onBack: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<VenueType>('custom');
  const [step, setStep] = useState<'type' | 'confirm'>('type');
  const { mutation, created } = useCreateFromTemplate();
  const template = VENUE_TEMPLATES[type];

  if (step === 'type') {
    return (
      <div className="grid gap-4">
        <fieldset className="grid gap-2">
          <legend className="mb-1 font-bold">Langkah 2 dari 3 · Tipe venue</legend>
          <div className="grid grid-cols-2 gap-2">
            {VENUE_TYPES.map((key) => (
              <label
                key={key}
                className={cn(
                  'flex cursor-pointer flex-col gap-0.5 rounded-sm border border-line p-3',
                  key === type && 'border-ink bg-canvas',
                )}
              >
                <span className="flex items-center gap-2 font-bold">
                  <input
                    type="radio"
                    name="venue-type"
                    className="size-4 accent-ink"
                    checked={key === type}
                    onChange={() => setType(key)}
                  />
                  {VENUE_TEMPLATES[key].label}
                </span>
                <span className="text-ink-muted text-sm">{VENUE_TEMPLATES[key].description}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <TemplatePreview type={type} />
        <DialogFooter>
          <Button variant="ghost" onClick={onBack}>
            Kembali
          </Button>
          <Button variant="primary" onClick={() => setStep('confirm')}>
            Lanjut
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="font-bold">Langkah 3 dari 3 · Konfirmasi</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-ink-muted">Nama</dt>
        <dd className="font-bold">{basics.input.name}</dd>
        <dt className="text-ink-muted">Zona waktu</dt>
        <dd>{basics.input.timezone}</dd>
        <dt className="text-ink-muted">Tipe venue</dt>
        <dd>{template.label}</dd>
        <dt className="text-ink-muted">Isi awal</dt>
        <dd>
          {template.locationTypes.length} tipe lokasi, {template.facilityTypes.length} jenis
          fasilitas
        </dd>
      </dl>
      <p className="text-ink-muted text-sm">
        Tipe, field, dan kategori bisa diubah setelahnya tanpa memengaruhi venue lain.
      </p>
      {mutation.error ? (
        <FormNotice tone="error">
          {created
            ? `Venue ${created.name} sudah dibuat, tetapi isi template gagal disimpan: ${mutation.error.message}`
            : mutation.error.message}
        </FormNotice>
      ) : null}
      <DialogFooter>
        <Button
          variant="ghost"
          disabled={mutation.isPending || created !== null}
          onClick={() => setStep('type')}
        >
          Kembali
        </Button>
        <Button
          variant="primary"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate(
              { basics, type },
              {
                onSuccess: (venue) => {
                  toast.success('Venue dibuat', {
                    description: `${venue.name} dipilih. Lanjutkan dengan menambah gedung.`,
                  });
                  onDone();
                },
              },
            )
          }
        >
          {mutation.isPending ? 'Membuat…' : created ? 'Coba lagi' : 'Buat venue'}
        </Button>
      </DialogFooter>
    </div>
  );
}
