import type { CategoryWithUsage } from '@indoor/data';
import {
  type CategoryId,
  checkLocationInput,
  customFieldInput,
  type FeatureId,
  keepFieldsOf,
  LOCATION_DESCRIPTION_MAX,
  type Location,
  type LocationInputProblems,
  type LocationType,
  type LocationTypeId,
  parseCustomFieldInputs,
  type VenueId,
  type VenueUnit,
} from '@indoor/domain';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { CustomFieldInputs, type FieldDraft } from './custom-field-inputs';
import { codeMessage, NAME_MESSAGES } from './labels';
import {
  type ImagesDraft,
  initialImages,
  LocationImagesField,
  toLocationImages,
} from './location-images';
import { uploadFieldImage, useSaveLocation } from './queries';
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
        <p className="text-ink-muted text-sm">
          Tipe ini belum punya kategori. Tambahkan di tab Tipe lokasi.
        </p>
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
  types,
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
  /** Tipe lokasi venue; formulir menampilkan field kustom tipe yang dipilih. */
  types: readonly LocationType[];
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
  const [typeId, setTypeId] = useState<LocationTypeId | null>(
    location?.locationTypeId ?? types[0]?.id ?? null,
  );
  const type = types.find((t) => t.id === typeId) ?? null;
  const [draft, setDraft] = useState<FieldDraft>(() => ({
    inputs: Object.fromEntries(
      Object.entries(location?.customFields ?? {}).map(([k, v]) => [k, customFieldInput(v)]),
    ),
    files: {},
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Tipe tujuan yang menunggu konfirmasi karena isian lama akan hilang.
  const [pendingType, setPendingType] = useState<{ id: LocationTypeId; lost: string[] } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
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
  const busy = save.isPending || uploading;
  const typeCategories = categories.filter((c) => c.locationTypeId === typeId);

  /** Isian tipe lama yang hilang bila pindah ke `nextId`: field kustom dan kategori. */
  function lostOnChange(nextId: LocationTypeId): string[] {
    const next = types.find((t) => t.id === nextId);
    const filled = Object.fromEntries(
      Object.entries(draft.inputs).filter(([key, value]) => value.trim() || draft.files[key]),
    );
    const { dropped } = keepFieldsOf(filled, type?.fields ?? [], next?.fields ?? []);
    const labels = dropped.map((key) => type?.fields.find((f) => f.key === key)?.label ?? key);
    const categoryNames = categories
      .filter((c) => categoryIds.includes(c.id) && c.locationTypeId !== nextId)
      .map((c) => `kategori ${c.name}`);
    return [...labels, ...categoryNames];
  }

  function changeType(nextId: LocationTypeId, confirmed: boolean) {
    const lost = lostOnChange(nextId);
    if (lost.length > 0 && !confirmed) {
      setPendingType({ id: nextId, lost });
      return;
    }
    const next = types.find((t) => t.id === nextId);
    const keep = new Set(next?.fields.map((f) => f.key) ?? []);
    const { kept } = keepFieldsOf(draft.inputs, type?.fields ?? [], next?.fields ?? []);
    setDraft({
      inputs: kept as Record<string, string>,
      files: Object.fromEntries(Object.entries(draft.files).filter(([k]) => keep.has(k))),
    });
    setCategoryIds(
      categoryIds.filter((id) => categories.find((c) => c.id === id)?.locationTypeId === nextId),
    );
    setTypeId(nextId);
    setPendingType(null);
    setFieldErrors({});
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!type) return;
    const found = checkLocationInput({ code, name, description }, locations, location?.id ?? null);
    setProblems(found);
    // Berkas gambar yang belum diunggah dihitung terisi untuk pemeriksaan wajib.
    const inputs = { ...draft.inputs };
    for (const key of Object.keys(draft.files)) inputs[key] = 'berkas-baru';
    const parsed = parseCustomFieldInputs(type.fields, inputs);
    setFieldErrors(parsed.errors);
    if (Object.keys(found).length > 0 || Object.keys(parsed.errors).length > 0) return;
    const customFields = { ...parsed.values };
    try {
      setUploading(true);
      for (const [key, file] of Object.entries(draft.files)) {
        customFields[key] = await uploadFieldImage(venueId, file);
      }
    } catch (error) {
      setFieldErrors({ upload: error instanceof Error ? error.message : 'Gambar gagal diunggah.' });
      return;
    } finally {
      setUploading(false);
    }
    save.mutate(
      {
        typeId: type.id,
        id: location?.id ?? null,
        input: {
          code,
          name,
          description,
          categoryIds,
          unitIds: selection.unitIds,
          primaryUnitId: selection.primaryUnitId,
          customFields,
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
            Field tambahan mengikuti tipe lokasi; atur tipe dan field-nya di tab Tipe lokasi.
          </SheetDescription>
        </SheetHeader>
        <form className="grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
          <Field id="location-type" label="Tipe lokasi">
            <Select
              value={typeId ?? ''}
              disabled={readOnly || busy}
              onValueChange={(id) => changeType(id as LocationTypeId, false)}
            >
              <SelectTrigger id="location-type">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {pendingType ? (
            <div role="alert" className="grid gap-2 rounded-sm border border-line p-3 text-sm">
              <p>
                Mengganti tipe menghapus isian yang tidak ada di tipe baru:{' '}
                <strong>{pendingType.lost.join(', ')}</strong>.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => changeType(pendingType.id, true)}>
                  Ganti tipe
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingType(null)}>
                  Batal
                </Button>
              </div>
            </div>
          ) : null}
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
            categories={typeCategories}
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
          <CustomFieldInputs
            fields={type?.fields ?? []}
            draft={draft}
            errors={fieldErrors}
            disabled={readOnly || busy}
            onChange={setDraft}
          />
          {fieldErrors.upload ? <FormNotice tone="error">{fieldErrors.upload}</FormNotice> : null}
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
