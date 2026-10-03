import type { CategoryWithUsage } from '@indoor/data';
import { checkCategoryName, type LocationTypeId, type VenueId } from '@indoor/domain';
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
import { ColorField, isColorValue } from '../../app/components/color-field';
import { Field } from '../../app/components/field';
import { AliasField, useAliasDraft } from '../aliases/alias-field';
import { FormNotice } from '../auth/auth-layout';
import {
  type IconChoice,
  IconField,
  iconChoicePng,
  iconChoiceValue,
  initialIconChoice,
} from '../facilities/icon-field';
import { CATEGORY_NAME_MESSAGES } from './labels';
import { useSaveCategory } from './queries';

export function CategoryDialog({
  venueId,
  typeId,
  category,
  others,
  onClose,
}: {
  venueId: VenueId;
  typeId: LocationTypeId;
  category: CategoryWithUsage | null;
  others: readonly CategoryWithUsage[];
  onClose: () => void;
}) {
  const save = useSaveCategory(venueId);
  const [name, setName] = useState(category?.name ?? '');
  const [choice, setChoice] = useState<IconChoice>(() => initialIconChoice(category?.icon ?? null));
  const [nameError, setNameError] = useState<string>();
  const [color, setColor] = useState(category?.color ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [reading, setReading] = useState(false);
  const aliases = useAliasDraft(venueId, 'category', category?.id ?? null, name);
  const [aliasError, setAliasError] = useState<string>();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sameType = others.filter((c) => c.locationTypeId === typeId);
    const problem = checkCategoryName(name, sameType, category?.id ?? null)[0];
    setNameError(problem ? CATEGORY_NAME_MESSAGES[problem] : undefined);
    setSubmitted(true);
    if (problem || aliases.error || !isColorValue(color)) return;
    save.mutate(
      {
        id: category?.id ?? null,
        typeId,
        input: { name, icon: iconChoiceValue(choice), color: color || null },
        sortOrder: others.length,
        iconPng: iconChoicePng(choice),
      },
      {
        onSuccess: async (saved) => {
          try {
            await aliases.save(saved.id);
          } catch (error) {
            setAliasError(error instanceof Error ? error.message : 'Alias tidak tersimpan.');
            return;
          }
          toast.success(category ? 'Kategori disimpan' : 'Kategori ditambahkan', {
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
          <DialogTitle>{category ? `Ubah ${category.name}` : 'Tambah kategori'}</DialogTitle>
          <DialogDescription>
            Kategori mengelompokkan lokasi, misalnya spesialisasi atau fakultas. Ikon dan urutannya
            dipakai di Visitor.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <Field id="category-name" label="Nama" error={nameError}>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              aria-invalid={nameError ? true : undefined}
            />
          </Field>
          <IconField
            id="category-icon"
            choice={choice}
            onChange={setChoice}
            onBusyChange={setReading}
            disabled={save.isPending}
          />
          <ColorField
            id="category-color"
            label="Warna di peta (opsional)"
            hint="Unit lokasi berkategori ini diwarnai di Visitor; kosong = warna tipe lokasi."
            value={color}
            showError={submitted}
            disabled={save.isPending}
            onChange={setColor}
          />
          <AliasField id="category-aliases" draft={aliases} disabled={save.isPending} />
          {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
          {aliasError ? <FormNotice tone="error">{aliasError}</FormNotice> : null}
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={save.isPending || reading}>
              {save.isPending ? 'Menyimpan…' : category ? 'Simpan kategori' : 'Tambah kategori'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
