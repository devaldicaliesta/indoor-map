import type { CategoryWithUsage } from '@indoor/data';
import {
  type CategoryId,
  checkLocationInput,
  checkOpeningHours,
  customFieldInput,
  EMPTY_OPENING_HOURS,
  type FeatureId,
  keepFieldsOf,
  LOCATION_DESCRIPTION_MAX,
  type Location,
  type LocationInputProblems,
  type LocationStatus,
  type LocationType,
  type LocationTypeId,
  type OpeningHours,
  parseCustomFieldInputs,
  unitsLeftEmpty,
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
import { CategoryChecklist } from './category-checklist';
import { CustomFieldInputs, type FieldDraft } from './custom-field-inputs';
import { HoursEditor } from './hours-editor';
import { codeMessage, NAME_MESSAGES } from './labels';
import {
  type ImagesDraft,
  initialImages,
  LocationImagesField,
  toLocationImages,
} from './location-images';
import { uploadFieldImage, useSaveLocation } from './queries';
import { StatusField } from './status-field';
import { TypeChoice, useTypeChoice } from './type-choice';
import { UnitLinks, type UnitSelection } from './unit-links';
import { UnitMapPicker } from './unit-map-picker';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const choice = useTypeChoice(types, location, categories, () => setFieldErrors({}));
  const { type, typeId, draft, setDraft, categoryIds, setCategoryIds } = choice;
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<LocationStatus>(location?.status ?? 'active');
  const [openingDate, setOpeningDate] = useState(location?.openingDate ?? '');
  const [hours, setHours] = useState<OpeningHours>(location?.hours ?? EMPTY_OPENING_HOURS);
  const [detailErrors, setDetailErrors] = useState<{ date?: string; hours?: string }>({});
  const [code, setCode] = useState(location?.code ?? '');
  const [name, setName] = useState(location?.name ?? '');
  const [description, setDescription] = useState(location?.description ?? '');
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
    const details: { date?: string; hours?: string } = {};
    if (status === 'coming_soon' && !openingDate) details.date = 'Isi tanggal buka.';
    if (checkOpeningHours(hours).length > 0) details.hours = 'Isi jam dengan format JJ:MM.';
    setDetailErrors(details);
    if (
      Object.keys(found).length > 0 ||
      Object.keys(parsed.errors).length > 0 ||
      Object.keys(details).length > 0
    ) {
      return;
    }
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
          status,
          openingDate: status === 'coming_soon' ? openingDate : null,
          hours,
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
          <TypeChoice choice={choice} types={types} disabled={readOnly || busy} />
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
          <StatusField
            status={status}
            openingDate={openingDate}
            emptiedUnits={unitsLeftEmpty(location?.id ?? null, selection.unitIds, units)}
            dateError={detailErrors.date}
            disabled={readOnly || busy}
            onStatus={setStatus}
            onOpeningDate={setOpeningDate}
          />
          <HoursEditor
            hours={hours}
            error={detailErrors.hours}
            disabled={readOnly || busy}
            onChange={setHours}
          />
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
