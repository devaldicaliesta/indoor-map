import { LOCATION_STATUSES, type LocationStatus } from '@indoor/domain';
import { Input } from '@indoor/ui';
import { Field } from '../../app/components/field';
import { LOCATION_STATUS_LABELS } from './labels';

/**
 * Status lokasi; segera buka meminta tanggal, dan nonaktif permanen menyebut unit yang akan
 * menjadi kosong sebelum disimpan.
 */
export function StatusField({
  status,
  openingDate,
  emptiedUnits,
  dateError,
  disabled,
  onStatus,
  onOpeningDate,
}: {
  status: LocationStatus;
  openingDate: string;
  /** Kode unit yang kosong bila nonaktif permanen (tidak ditempati lokasi aktif lain). */
  emptiedUnits: readonly string[];
  dateError: string | undefined;
  disabled: boolean;
  onStatus: (status: LocationStatus) => void;
  onOpeningDate: (date: string) => void;
}) {
  return (
    <fieldset className="grid gap-2" disabled={disabled}>
      <legend className="mb-1 font-bold">Status</legend>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {LOCATION_STATUSES.map((value) => (
          <label key={value} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="location-status"
              className="size-4 accent-ink"
              checked={status === value}
              onChange={() => onStatus(value)}
            />
            {LOCATION_STATUS_LABELS[value]}
          </label>
        ))}
      </div>
      {status === 'coming_soon' ? (
        <Field id="location-opening-date" label="Tanggal buka" error={dateError}>
          <Input
            id="location-opening-date"
            type="date"
            className="w-48"
            value={openingDate}
            aria-invalid={dateError ? true : undefined}
            onChange={(e) => onOpeningDate(e.target.value)}
          />
        </Field>
      ) : null}
      {status === 'inactive_permanent' ? (
        <p
          role="status"
          className="rounded-sm border border-line border-l-4 border-l-danger p-2 text-sm"
        >
          Lokasi tidak lagi tampil di Visitor.{' '}
          {emptiedUnits.length
            ? `Unit ${emptiedUnits.join(', ')} akan menjadi kosong.`
            : 'Tidak ada unit yang menjadi kosong.'}
        </p>
      ) : null}
    </fieldset>
  );
}
