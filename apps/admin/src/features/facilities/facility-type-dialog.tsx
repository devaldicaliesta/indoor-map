import type { FacilityTypeWithUsage } from '@indoor/data';
import { checkFacilityTypeName, type FacilityTypeNameProblem, type VenueId } from '@indoor/domain';
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
import { FormNotice } from '../auth/auth-layout';
import {
  type IconChoice,
  IconField,
  iconChoicePng,
  iconChoiceValue,
  initialIconChoice,
} from './icon-field';
import { useSaveFacilityType } from './queries';

const NAME_MESSAGES: Record<FacilityTypeNameProblem, string> = {
  required: 'Nama jenis wajib diisi.',
  too_long: 'Nama maksimal 60 karakter.',
  duplicate: 'Nama ini sudah dipakai jenis lain di venue ini.',
};

export function FacilityTypeDialog({
  venueId,
  type,
  others,
  onClose,
}: {
  venueId: VenueId;
  type: FacilityTypeWithUsage | null;
  others: readonly FacilityTypeWithUsage[];
  onClose: () => void;
}) {
  const save = useSaveFacilityType(venueId);
  const [name, setName] = useState(type?.name ?? '');
  const [isSafety, setIsSafety] = useState(type?.isSafety ?? false);
  const [choice, setChoice] = useState<IconChoice>(() => initialIconChoice(type?.icon ?? null));
  const [nameError, setNameError] = useState<string>();
  const [reading, setReading] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = checkFacilityTypeName(name, others, type?.id ?? null)[0];
    setNameError(problem ? NAME_MESSAGES[problem] : undefined);
    if (problem) return;
    save.mutate(
      {
        id: type?.id ?? null,
        input: { name, isSafety, icon: iconChoiceValue(choice) },
        iconPng: iconChoicePng(choice),
      },
      {
        onSuccess: (saved) => {
          toast.success(type ? 'Jenis fasilitas disimpan' : 'Jenis fasilitas ditambahkan', {
            description: saved.name,
          });
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{type ? `Ubah ${type.name}` : 'Tambah jenis fasilitas'}</DialogTitle>
          <DialogDescription>
            Jenis dipilih saat menaruh fasilitas di Editor Peta. Ikonnya tampil di peta dan di
            Visitor.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <Field id="facility-type-name" label="Nama" error={nameError}>
            <Input
              id="facility-type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              aria-invalid={nameError ? true : undefined}
            />
          </Field>
          <IconField
            id="facility-type-icon"
            choice={choice}
            onChange={setChoice}
            onBusyChange={setReading}
            disabled={save.isPending}
            isSafety={isSafety}
            beforePreview={
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={isSafety}
                  onChange={(e) => setIsSafety(e.target.checked)}
                  className="mt-0.5 size-4 accent-ink"
                />
                <span>
                  <span className="font-bold">Fasilitas keselamatan</span>
                  <span className="block text-ink-muted text-sm">
                    APAR, titik kumpul, pintu darurat, dan sejenisnya. Ikon berlatar merah di peta.
                  </span>
                </span>
              </label>
            }
          />
          {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={save.isPending || reading}>
              {save.isPending ? 'Menyimpan…' : type ? 'Simpan jenis' : 'Tambah jenis'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
