import {
  checkLocationTypeName,
  type LocationType,
  parseFacilityIcon,
  type VenueId,
} from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { ColorField, isColorValue } from '../../app/components/color-field';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { PictogramPicker } from '../facilities/pictogram-picker';
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
  const colorInvalid = !isColorValue(color);
  const parsedIcon = parseFacilityIcon(icon === NO_ICON ? null : icon);
  const iconKey = parsedIcon?.kind === 'builtin' ? parsedIcon.key : null;

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
          <div className="grid gap-1">
            <Label>Ikon</Label>
            <PictogramPicker
              value={iconKey}
              disabled={save.isPending}
              allowNone
              onChange={(key) => setIcon(key ? `builtin:${key}` : NO_ICON)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              id="type-color"
              label="Warna (opsional)"
              value={color}
              showError={submitted}
              onChange={setColor}
            />
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
