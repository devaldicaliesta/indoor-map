import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@indoor/ui';
import type { ReactNode } from 'react';
import { useSelectedVenue } from '../../app/venue-store';

export const timeFormat = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const formatTime = (value: string | null) =>
  value ? timeFormat.format(new Date(value)) : '—';

export function copy(text: string, label: string) {
  void navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} disalin`))
    .catch(() => toast.error(`${label} tidak bisa disalin; salin manual dari kotak.`));
}

/** Rahasia yang hanya tampil sekali: setelah dialog ditutup tidak bisa dilihat lagi. */
export function SecretDialog({
  title,
  description,
  label,
  value,
  onClose,
}: {
  title: string;
  description: ReactNode;
  label: string;
  value: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={value !== null} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <code
            data-testid="secret-value"
            className="min-w-0 flex-1 break-all rounded-sm bg-canvas px-2 py-1 font-mono text-sm"
          >
            {value}
          </code>
          <Button type="button" onClick={() => value && copy(value, label)}>
            Salin
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="primary" onClick={onClose}>
            Sudah saya simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirm,
  pending,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirm: string;
  pending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" variant="danger" disabled={pending} onClick={onConfirm}>
            {confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Pilihan venue: semua (termasuk venue baru nanti) atau beberapa saja. */
export function VenueScope({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: string[] | null;
  onChange: (value: string[] | null) => void;
}) {
  const { venues } = useSelectedVenue();
  return (
    <fieldset className="grid gap-1">
      <legend className="mb-1 font-bold text-sm">Venue</legend>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          id={`${idPrefix}-all`}
          type="radio"
          className="size-4 accent-ink"
          checked={value === null}
          onChange={() => onChange(null)}
        />
        Semua venue, termasuk yang dibuat nanti
      </label>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="radio"
          className="size-4 accent-ink"
          checked={value !== null}
          onChange={() => onChange(venues[0] ? [venues[0].id] : [])}
        />
        Venue tertentu
      </label>
      {value !== null ? (
        <fieldset aria-label="Venue yang dipilih" className="ml-6 grid gap-1">
          {venues.map((venue) => (
            <label key={venue.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-ink"
                checked={value.includes(venue.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked ? [...value, venue.id] : value.filter((id) => id !== venue.id),
                  )
                }
              />
              {venue.name}
            </label>
          ))}
        </fieldset>
      ) : null}
    </fieldset>
  );
}

export function useVenueNames() {
  const { venues } = useSelectedVenue();
  const names = new Map<string, string>(venues.map((v) => [v.id, v.name]));
  return (ids: string[] | null) =>
    ids === null ? 'Semua venue' : ids.map((id) => names.get(id) ?? 'Venue terhapus').join(', ');
}

export function CheckboxGroup<T extends string>({
  legend,
  options,
  labels,
  value,
  onChange,
}: {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: readonly T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <fieldset className="grid gap-1">
      <legend className="mb-1 font-bold text-sm">{legend}</legend>
      {options.map((option) => (
        <label key={option} className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="size-4 accent-ink"
            checked={value.includes(option)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? options.filter((o) => o === option || value.includes(o))
                  : value.filter((o) => o !== option),
              )
            }
          />
          {labels[option]}
        </label>
      ))}
    </fieldset>
  );
}
