import type { VenueId } from '@indoor/domain';
import { checkImdfAddress, type ImdfAddressProblem } from '@indoor/domain/export';
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
import { Download } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Choice } from '../../app/components/choice';
import { Field } from '../../app/components/field';
import { saveBlob } from '../../app/download';
import { FormNotice } from '../auth/auth-layout';
import { describeSkipped, useExportMap } from './export-map';

type Format = 'geojson' | 'imdf';

const PROBLEM_TEXT: Record<ImdfAddressProblem, [field: string, message: string]> = {
  address_required: ['address', 'Isi alamat venue.'],
  locality_required: ['locality', 'Isi kota atau kabupaten.'],
  invalid_country: ['country', 'Kode negara dua huruf ISO 3166-1, misalnya ID.'],
  invalid_province: ['province', 'Kode provinsi ISO 3166-2, misalnya ID-JK, atau kosongkan.'],
};

const FORMAT_HINT: Record<Format, string> = {
  geojson:
    'Zip berisi fitur peta, gedung, lokasi, dan graf jalur dalam GeoJSON (WGS84), untuk GIS seperti QGIS atau sistem klien.',
  imdf: 'Paket IMDF 1.0.0 (venue, gedung, lantai, unit, bukaan, amenity, occupant, anchor) yang diperiksa validator sebelum diunduh.',
};

function AddressFields({
  defaultAddress,
  errors,
  disabled,
}: {
  defaultAddress: string;
  errors: Record<string, string>;
  disabled: boolean;
}) {
  const field = (name: string, label: string, props: { defaultValue?: string; hint?: string }) => (
    <Field id={`export-${name}`} label={label} hint={props.hint} error={errors[name]}>
      <Input
        id={`export-${name}`}
        name={name}
        defaultValue={props.defaultValue}
        disabled={disabled}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={
          errors[name] ? `export-${name}-error` : props.hint ? `export-${name}-hint` : undefined
        }
      />
    </Field>
  );
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 font-bold text-sm">Alamat venue (wajib di IMDF)</legend>
      {field('address', 'Alamat', { defaultValue: defaultAddress })}
      <div className="grid grid-cols-2 gap-3">
        {field('locality', 'Kota/kabupaten', {})}
        {field('postalCode', 'Kode pos (opsional)', {})}
        {field('province', 'Kode provinsi (opsional)', { hint: 'ISO 3166-2, misalnya ID-JK' })}
        {field('country', 'Kode negara', { defaultValue: 'ID', hint: 'ISO 3166-1, misalnya ID' })}
      </div>
    </fieldset>
  );
}

/** Export versi published aktif ke GeoJSON atau IMDF (Admin dan Super Admin). */
export function ExportButton({
  venueId,
  version,
  venueAddress,
}: {
  venueId: VenueId;
  version: number;
  venueAddress: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>('geojson');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const exportMap = useExportMap(venueId);

  const close = () => {
    if (exportMap.isPending) return;
    setOpen(false);
    setErrors({});
    exportMap.reset();
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let request: Parameters<typeof exportMap.mutate>[0] = { format: 'geojson' };
    if (format === 'imdf') {
      const form = new FormData(event.currentTarget);
      const text = (name: string) => String(form.get(name) ?? '');
      const { value, problems } = checkImdfAddress({
        address: text('address'),
        locality: text('locality'),
        province: text('province'),
        country: text('country'),
        postalCode: text('postalCode'),
      });
      setErrors(Object.fromEntries(problems.map((p) => PROBLEM_TEXT[p])));
      if (problems.length > 0) return;
      request = { format: 'imdf', address: value };
    }
    exportMap.mutate(request, {
      onSuccess: ({ blob, filename, skipped }) => {
        saveBlob(blob, filename);
        toast.success('Export selesai', {
          description: [filename, skipped && describeSkipped(skipped)].filter(Boolean).join(' · '),
        });
        close();
      },
    });
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Download aria-hidden className="size-4" />
        Export data
      </Button>
      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={submit} noValidate>
            <DialogHeader>
              <DialogTitle>Export data peta v{version}</DialogTitle>
              <DialogDescription>
                Isi versi published v{version} diekspor apa adanya; perubahan draft yang belum
                diterbitkan tidak ikut.
              </DialogDescription>
            </DialogHeader>
            <Choice
              name="export-format"
              legend="Format"
              value={format}
              onChange={(next) => {
                setFormat(next);
                setErrors({});
              }}
              options={[
                { value: 'geojson', label: 'GeoJSON' },
                { value: 'imdf', label: 'IMDF' },
              ]}
            />
            <p className="text-ink-muted text-sm">{FORMAT_HINT[format]}</p>
            {format === 'imdf' ? (
              <AddressFields
                defaultAddress={venueAddress ?? ''}
                errors={errors}
                disabled={exportMap.isPending}
              />
            ) : null}
            {exportMap.error ? (
              <FormNotice tone="error">{exportMap.error.message}</FormNotice>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close} disabled={exportMap.isPending}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={exportMap.isPending}>
                {exportMap.isPending ? 'Menyiapkan…' : 'Unduh zip'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
