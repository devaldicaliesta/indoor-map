import type { CategoryWithUsage } from '@indoor/data';
import {
  type CategoryId,
  checkLocationInput,
  type FeatureId,
  LOCATION_DESCRIPTION_MAX,
  type Location,
  type LocationInputProblems,
  type LocationTypeId,
  type VenueId,
  type VenueUnit,
} from '@indoor/domain';
import {
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  toast,
} from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { FacilityIconPreview } from '../facilities/facility-icon-preview';
import { iconSource } from '../facilities/icons';
import { codeMessage, NAME_MESSAGES } from './labels';
import {
  type ImagesDraft,
  initialImages,
  LocationImagesField,
  toLocationImages,
} from './location-images';
import { useSaveLocation } from './queries';
import { UnitLinks, type UnitSelection } from './unit-links';
import { UnitMapPicker } from './unit-map-picker';

function CategoryChecklist({
  categories,
  value,
  disabled,
  onChange,
}: {
  categories: readonly CategoryWithUsage[];
  value: readonly CategoryId[];
  disabled: boolean;
  onChange: (value: CategoryId[]) => void;
}) {
  return (
    <fieldset className="grid gap-1" disabled={disabled}>
      <legend className="mb-1 font-bold">Kategori</legend>
      {categories.length === 0 ? (
        <p className="text-ink-muted text-sm">Belum ada kategori. Tambahkan di tab Kategori.</p>
      ) : (
        <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded-md border border-line p-2">
          {categories.map((category) => (
            <label key={category.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="size-4 accent-ink"
                checked={value.includes(category.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...value, category.id]
                      : value.filter((id) => id !== category.id),
                  )
                }
              />
              <FacilityIconPreview
                source={iconSource(category.icon)}
                isSafety={false}
                scale={0.75}
              />
              <span className="truncate">{category.name}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

/** Formulir tambah/ubah lokasi; Viewer melihatnya dalam mode baca. */
export function LocationSheet({
  venueId,
  typeId,
  location,
  initialUnitId,
  readOnly,
  locations,
  categories,
  units,
  outdoorName,
  onClose,
}: {
  venueId: VenueId;
  typeId: LocationTypeId;
  location: Location | null;
  initialUnitId: FeatureId | null;
  readOnly: boolean;
  locations: readonly Location[];
  categories: readonly CategoryWithUsage[];
  units: readonly VenueUnit[];
  outdoorName: string;
  onClose: () => void;
}) {
  const save = useSaveLocation(venueId);
  const [code, setCode] = useState(location?.code ?? '');
  const [name, setName] = useState(location?.name ?? '');
  const [description, setDescription] = useState(location?.description ?? '');
  const [categoryIds, setCategoryIds] = useState<CategoryId[]>(location?.categoryIds ?? []);
  const [selection, setSelection] = useState<UnitSelection>(() => {
    const unitIds =
      location?.units.map((u) => u.featureId) ?? (initialUnitId ? [initialUnitId] : []);
    const primary = location?.units.find((u) => u.isPrimary)?.featureId ?? unitIds[0] ?? null;
    return { unitIds, primaryUnitId: primary };
  });
  const [images, setImages] = useState<ImagesDraft>(() =>
    initialImages(location?.logoPath ?? null, location?.photoPaths ?? []),
  );
  const [problems, setProblems] = useState<LocationInputProblems>({});
  const [picking, setPicking] = useState(false);
  const busy = save.isPending;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = checkLocationInput({ code, name, description }, locations, location?.id ?? null);
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    save.mutate(
      {
        typeId,
        id: location?.id ?? null,
        input: {
          code,
          name,
          description,
          categoryIds,
          unitIds: selection.unitIds,
          primaryUnitId: selection.primaryUnitId,
        },
        images: toLocationImages(images, location?.logoPath ?? null),
      },
      {
        onSuccess: () => {
          toast.success(location ? 'Lokasi disimpan' : 'Lokasi ditambahkan', {
            description: name.trim(),
          });
          onClose();
        },
      },
    );
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {readOnly ? location?.name : location ? `Ubah ${location.name}` : 'Tambah lokasi'}
          </SheetTitle>
          <SheetDescription>
            Tipe: Lokasi. Tipe lain dan field kustom menyusul di pengaturan tipe lokasi.
          </SheetDescription>
        </SheetHeader>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <div className="grid grid-cols-[12rem_1fr] gap-3">
            <Field
              id="location-code"
              label="Kode (opsional)"
              error={problems.code ? codeMessage(problems.code) : undefined}
            >
              <Input
                id="location-code"
                className="font-mono uppercase"
                value={code}
                disabled={readOnly || busy}
                aria-invalid={problems.code ? true : undefined}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <Field
              id="location-name"
              label="Nama"
              error={problems.name ? NAME_MESSAGES[problems.name] : undefined}
            >
              <Input
                id="location-name"
                value={name}
                disabled={readOnly || busy}
                aria-invalid={problems.name ? true : undefined}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!readOnly}
              />
            </Field>
          </div>
          <CategoryChecklist
            categories={categories}
            value={categoryIds}
            disabled={readOnly || busy}
            onChange={setCategoryIds}
          />
          <Field
            id="location-description"
            label={`Deskripsi (${description.trim().length}/${LOCATION_DESCRIPTION_MAX})`}
            error={problems.description ? 'Deskripsi maksimal 500 karakter.' : undefined}
          >
            <textarea
              id="location-description"
              rows={3}
              value={description}
              disabled={readOnly || busy}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-sm border border-ink-muted bg-surface px-3 py-2 text-ink disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>
          <UnitLinks
            units={units}
            selfId={location?.id ?? null}
            value={selection}
            outdoorName={outdoorName}
            disabled={readOnly || busy}
            onChange={setSelection}
            onPickOnMap={() => setPicking(true)}
          />
          <LocationImagesField value={images} disabled={readOnly || busy} onChange={setImages} />
          {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
          <SheetFooter className="flex flex-row justify-end gap-2">
            <Button type="button" onClick={onClose}>
              {readOnly ? 'Tutup' : 'Batal'}
            </Button>
            {readOnly ? null : (
              <Button type="submit" variant="primary" disabled={busy}>
                {busy ? 'Menyimpan…' : location ? 'Simpan lokasi' : 'Tambah lokasi'}
              </Button>
            )}
          </SheetFooter>
        </form>
        {picking ? (
          <UnitMapPicker
            venueId={venueId}
            units={units}
            selfId={location?.id ?? null}
            initial={selection.unitIds}
            onClose={() => setPicking(false)}
            onDone={(unitIds) => {
              setSelection({
                unitIds,
                primaryUnitId:
                  selection.primaryUnitId && unitIds.includes(selection.primaryUnitId)
                    ? selection.primaryUnitId
                    : (unitIds[0] ?? null),
              });
              setPicking(false);
            }}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
