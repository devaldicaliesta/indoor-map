import type { CategoryWithUsage } from '@indoor/data';
import {
  type CategoryId,
  customFieldInput,
  keepFieldsOf,
  type Location,
  type LocationType,
  type LocationTypeId,
} from '@indoor/domain';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { useState } from 'react';
import { Field } from '../../app/components/field';
import type { FieldDraft } from './custom-field-inputs';

/**
 * Tipe lokasi di formulir beserta isian yang bergantung padanya (field kustom dan kategori).
 * Pindah tipe yang membuang isian menunggu konfirmasi lebih dulu.
 */
export function useTypeChoice(
  types: readonly LocationType[],
  location: Location | null,
  categories: readonly CategoryWithUsage[],
  onChanged: () => void,
) {
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
  const [categoryIds, setCategoryIds] = useState<CategoryId[]>(location?.categoryIds ?? []);
  // Tipe tujuan yang menunggu konfirmasi karena isian lama akan hilang.
  const [pending, setPending] = useState<{ id: LocationTypeId; lost: string[] } | null>(null);

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

  function change(nextId: LocationTypeId, confirmed: boolean) {
    const lost = lostOnChange(nextId);
    if (lost.length > 0 && !confirmed) {
      setPending({ id: nextId, lost });
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
    setPending(null);
    onChanged();
  }

  return {
    typeId,
    type,
    draft,
    setDraft,
    categoryIds,
    setCategoryIds,
    pending,
    change,
    cancel: () => setPending(null),
  };
}

export function TypeChoice({
  choice,
  types,
  disabled,
}: {
  choice: ReturnType<typeof useTypeChoice>;
  types: readonly LocationType[];
  disabled: boolean;
}) {
  return (
    <>
      <Field id="location-type" label="Tipe lokasi">
        <Select
          value={choice.typeId ?? ''}
          disabled={disabled}
          onValueChange={(id) => choice.change(id as LocationTypeId, false)}
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
      {choice.pending ? (
        <div role="alert" className="grid gap-2 rounded-sm border border-line p-3 text-sm">
          <p>
            Mengganti tipe menghapus isian yang tidak ada di tipe baru:{' '}
            <strong>{choice.pending.lost.join(', ')}</strong>.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => choice.pending && choice.change(choice.pending.id, true)}
            >
              Ganti tipe
            </Button>
            <Button size="sm" variant="ghost" onClick={choice.cancel}>
              Batal
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
