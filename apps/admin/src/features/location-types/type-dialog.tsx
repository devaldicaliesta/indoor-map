import { checkLocationTypeName, type LocationType, type VenueId } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { PICTOGRAM_LABELS } from '../facilities/icons';
import { CATEGORY_NAME_MESSAGES } from '../locations/labels';
import { useSaveLocationType } from '../locations/queries';

const NO_ICON = 'tanpa';

/** Tambah/ubah tipe lokasi: nama, ikon bawaan, dan warna. */
export function TypeDialog({
  venueId,
  type,
  others,
  onClose,
}: {
  venueId: VenueId;
  type: LocationType | null;
  others: readonly LocationType[];
  onClose: () => void;
}) {
  const save = useSaveLocationType(venueId);
  const [name, setName] = useState(type?.name ?? '');
  const [icon, setIcon] = useState(type?.icon ?? NO_ICON);
  const [color, setColor] = useState(type?.color ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [problem] = checkLocationTypeName(name, others, type?.id ?? null);
  const colorInvalid = color !== '' && !/^#[0-9a-f]{6}$/i.test(color);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (problem || colorInvalid) return;
    save.mutate(
      {
        id: type?.id ?? null,
        input: { name, icon: icon === NO_ICON ? null : icon, color: color || null },
      },
      {
        onSuccess: () => {
          toast.success(type ? 'Tipe disimpan' : 'Tipe ditambahkan', { description: name.trim() });
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{type ? `Ubah tipe ${type.name}` : 'Tambah tipe lokasi'}</DialogTitle>
          </DialogHeader>
          <Field
            id="type-name"
            label="Nama"
            error={submitted && problem ? CATEGORY_NAME_MESSAGES[problem] : undefined}
          >
            <Input id="type-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="type-icon" label="Ikon">
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger id="type-icon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ICON}>Tanpa ikon</SelectItem>
                  {Object.entries(PICTOGRAM_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={`builtin:${key}`}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              id="type-color"
              label="Warna (opsional)"
              error={submitted && colorInvalid ? 'Format warna #rrggbb.' : undefined}
            >
              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label="Pilih warna"
                  value={colorInvalid || !color ? '#888888' : color}
                  onChange={(e) => setColor(e.target.value)}
                  className="size-(--control-height) cursor-pointer rounded-sm border border-ink-muted bg-surface p-0.5"
                />
                <Input
                  id="type-color"
                  className="font-mono"
                  placeholder="#rrggbb"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </Field>
          </div>
          {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={save.isPending}>
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
