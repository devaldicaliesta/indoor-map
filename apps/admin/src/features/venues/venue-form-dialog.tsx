import { checkVenueInput, formatLatLng, parseLatLng, type Venue } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { Field } from '../../app/components/field';
import { TimezoneSelect } from '../../app/components/timezone-select';
import { FormNotice } from '../auth/auth-layout';
import { CreateVenueSteps, type VenueBasics } from './create-venue-wizard';
import { useSaveVenue } from './queries';

interface Errors {
  name?: string;
  center?: string;
  timezone?: string;
}

export function VenueFormDialog({
  venue,
  open,
  onOpenChange,
}: {
  venue: Venue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [timezone, setTimezone] = useState(venue?.timezone ?? 'Asia/Jakarta');
  const [errors, setErrors] = useState<Errors>({});
  const save = useSaveVenue();
  // Venue baru: data dasar disimpan setelah tipe venue dipilih (wizard langkah 2 dan 3).
  const [basics, setBasics] = useState<VenueBasics | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const centerText = String(form.get('center')).trim();
    const center = centerText ? parseLatLng(centerText) : null;
    const input = {
      name: String(form.get('name')),
      address: String(form.get('address')),
      center,
      timezone,
    };
    const found: Errors = {};
    for (const problem of checkVenueInput(input)) {
      if (problem === 'name_required') found.name = 'Nama venue wajib diisi.';
      if (problem === 'invalid_timezone') found.timezone = 'Pilih zona waktu dari daftar.';
    }
    if (centerText && !center) found.center = 'Tempel koordinat seperti -6.175400, 106.827200.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const logo = form.get('logo');
    const file = logo instanceof File && logo.size > 0 ? logo : null;
    if (!venue) {
      setBasics({ input, logo: file });
      return;
    }
    save.mutate(
      { id: venue.id, input, logo: file },
      {
        onSuccess: (saved) => {
          toast.success('Venue disimpan', { description: saved.name });
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          save.reset();
          setBasics(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{venue ? `Ubah ${venue.name}` : 'Tambah venue'}</DialogTitle>
          <DialogDescription>
            Venue adalah satu kawasan, misalnya satu rumah sakit atau satu kampus.
          </DialogDescription>
        </DialogHeader>
        {basics ? (
          <CreateVenueSteps
            basics={basics}
            onBack={() => setBasics(null)}
            onDone={() => {
              setBasics(null);
              onOpenChange(false);
            }}
          />
        ) : null}
        <form className={basics ? 'hidden' : 'grid gap-4'} onSubmit={submit} noValidate>
          {venue ? null : <p className="font-bold">Langkah 1 dari 3 · Data dasar</p>}
          <Field id="venue-name" label="Nama" error={errors.name}>
            <Input
              id="venue-name"
              name="name"
              defaultValue={venue?.name}
              required
              autoFocus
              aria-invalid={errors.name ? true : undefined}
            />
          </Field>
          <Field id="venue-address" label="Alamat">
            <Input id="venue-address" name="address" defaultValue={venue?.address ?? ''} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="venue-center"
              label="Titik pusat"
              hint="Salin dari Google Maps: klik kanan di peta → salin koordinat."
              error={errors.center}
            >
              <Input
                id="venue-center"
                name="center"
                className="font-mono"
                placeholder="-6.175400, 106.827200"
                defaultValue={venue?.center ? formatLatLng(venue.center) : ''}
                aria-invalid={errors.center ? true : undefined}
              />
            </Field>
            <Field id="venue-timezone" label="Zona waktu" error={errors.timezone}>
              <TimezoneSelect id="venue-timezone" value={timezone} onChange={setTimezone} />
            </Field>
          </div>
          <Field
            id="venue-logo"
            label="Logo"
            hint="PNG, JPG, atau WebP, maksimal 5 MB. Tampil di Visitor dan Info Point."
          >
            <Input
              id="venue-logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
            />
          </Field>
          {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={save.isPending}>
              {save.isPending ? 'Menyimpan…' : venue ? 'Simpan venue' : 'Lanjut'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
