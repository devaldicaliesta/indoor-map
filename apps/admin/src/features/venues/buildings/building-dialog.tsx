import { type Building, checkBuildingInput, type Polygon, type Venue } from '@indoor/domain';
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
import { Field } from '../../../app/components/field';
import { FormNotice } from '../../auth/auth-layout';
import { FootprintMap } from './footprint-map';
import { useSaveBuilding } from './queries';

const MESSAGES = {
  name_required: 'Nama gedung wajib diisi.',
  code_required: 'Kode gedung wajib diisi, misalnya GU.',
  code_format: 'Kode hanya huruf, angka, dan tanda hubung, maksimal 12 karakter.',
} as const;

export function BuildingDialog({
  venue,
  building,
  others,
  onClose,
}: {
  venue: Venue;
  building: Building | null;
  others: Building[];
  onClose: () => void;
}) {
  const [footprint, setFootprint] = useState<Polygon | null>(building?.footprint ?? null);
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const save = useSaveBuilding(venue.id);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = { name: String(form.get('name')), code: String(form.get('code')), footprint };
    const found: { name?: string; code?: string } = {};
    for (const problem of checkBuildingInput(input)) {
      if (problem === 'name_required') found.name = MESSAGES[problem];
      else found.code = MESSAGES[problem];
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    save.mutate(
      { id: building?.id ?? null, input },
      {
        onSuccess: (saved) => {
          toast.success(building ? 'Gedung disimpan' : 'Gedung ditambahkan', {
            description: building ? saved.name : `${saved.name}. Lanjutkan dengan menambah lantai.`,
          });
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{building ? `Ubah ${building.name}` : 'Tambah gedung'}</DialogTitle>
          <DialogDescription>
            Gedung di {venue.name}. Footprint dipakai untuk menempatkan gedung di peta.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <div className="grid grid-cols-[1fr_12rem] gap-4">
            <Field id="building-name" label="Nama" error={errors.name}>
              <Input
                id="building-name"
                name="name"
                defaultValue={building?.name}
                autoFocus
                aria-invalid={errors.name ? true : undefined}
              />
            </Field>
            <Field id="building-code" label="Kode" error={errors.code}>
              <Input
                id="building-code"
                name="code"
                defaultValue={building?.code}
                className="font-mono uppercase"
                aria-invalid={errors.code ? true : undefined}
              />
            </Field>
          </div>
          <Field id="building-footprint" label="Footprint (opsional)">
            <FootprintMap
              center={venue.center}
              others={others.filter((b) => b.id !== building?.id)}
              value={footprint}
              onChange={setFootprint}
            />
          </Field>
          {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={save.isPending}>
              {save.isPending ? 'Menyimpan…' : building ? 'Simpan gedung' : 'Tambah gedung'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
