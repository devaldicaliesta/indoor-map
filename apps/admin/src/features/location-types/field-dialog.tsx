import {
  type CustomField,
  checkCustomField,
  FIELD_TYPES,
  type FieldDefinition,
  type FieldType,
  fieldKeyFromLabel,
  type LocationType,
  type VenueId,
} from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useSaveField } from '../locations/queries';
import { FIELD_PROBLEM_MESSAGES, FIELD_TYPE_LABELS } from './labels';

function Check({
  label,
  hint,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-60">
      <input
        type="checkbox"
        className="mt-1 size-4 accent-ink"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {label}
        <span className="block text-ink-muted text-sm">{hint}</span>
      </span>
    </label>
  );
}

/**
 * Tambah/ubah field kustom. Kunci dibuat otomatis dari label dan tidak berubah setelah field
 * dibuat; jenis juga tetap, karena nilai tersimpan di lokasi bergantung pada keduanya.
 */
export function FieldDialog({
  venueId,
  type,
  field,
  onClose,
}: {
  venueId: VenueId;
  type: LocationType;
  field: FieldDefinition | null;
  onClose: () => void;
}) {
  const save = useSaveField(venueId);
  const others = type.fields.filter((f) => f.id !== field?.id);
  const [label, setLabel] = useState(field?.label ?? '');
  const [kind, setKind] = useState<FieldType>(field?.type ?? 'text');
  const [options, setOptions] = useState((field?.options ?? []).join('\n'));
  const [isRequired, setRequired] = useState(field?.isRequired ?? false);
  const [isVisible, setVisible] = useState(field?.isVisible ?? true);
  const [isSearchable, setSearchable] = useState(field?.isSearchable ?? false);
  const [submitted, setSubmitted] = useState(false);
  const key =
    field?.key ??
    fieldKeyFromLabel(
      label,
      others.map((f) => f.key),
    );
  const draft: CustomField = {
    key,
    label,
    type: kind,
    options: options
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean),
    isRequired,
    isVisible,
    // Isi field yang dapat dicari masuk indeks pencarian snapshot publik, jadi field tersembunyi
    // tidak boleh dapat dicari.
    isSearchable: isVisible && isSearchable,
  };
  const problems = checkCustomField(draft, others);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (problems.length > 0) return;
    const sortOrder = Math.max(-1, ...type.fields.map((f) => f.sortOrder)) + 1;
    save.mutate(
      { typeId: type.id, id: field?.id ?? null, field: draft, sortOrder },
      {
        onSuccess: () => {
          toast.success(field ? 'Field disimpan' : 'Field ditambahkan', { description: label });
          onClose();
        },
      },
    );
  }

  const message = (problem: (typeof problems)[number]) =>
    submitted && problems.includes(problem) ? FIELD_PROBLEM_MESSAGES[problem] : undefined;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>
              {field ? `Ubah field ${field.label}` : `Tambah field ${type.name}`}
            </DialogTitle>
            <DialogDescription>
              Kunci: <span className="font-mono">{key}</span>
            </DialogDescription>
          </DialogHeader>
          <Field
            id="field-label"
            label="Label"
            error={
              message('label_required') ?? message('label_too_long') ?? message('key_duplicate')
            }
          >
            <Input id="field-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field
            id="field-type"
            label="Jenis"
            hint={field ? 'Jenis tidak bisa diubah setelah field dibuat.' : undefined}
          >
            <Select
              value={kind}
              disabled={field !== null}
              onValueChange={(v) => setKind(v as FieldType)}
            >
              <SelectTrigger id="field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {FIELD_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {kind === 'select' ? (
            <Field
              id="field-options"
              label="Opsi (satu per baris)"
              error={message('options_required') ?? message('options_duplicate')}
            >
              <textarea
                id="field-options"
                rows={4}
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                className="w-full rounded-sm border border-ink-muted bg-surface px-3 py-2 text-ink"
              />
            </Field>
          ) : null}
          <div className="grid gap-2">
            <Check
              label="Wajib diisi"
              hint="Lokasi tipe ini tidak bisa disimpan tanpa nilai."
              checked={isRequired}
              onChange={setRequired}
            />
            <Check
              label="Tampil di Visitor"
              hint="Matikan untuk catatan internal."
              checked={isVisible}
              onChange={setVisible}
            />
            <Check
              label="Dapat dicari"
              hint={
                isVisible
                  ? 'Isi field ikut dicari di Visitor.'
                  : 'Hanya field yang tampil di Visitor yang dapat dicari.'
              }
              checked={isVisible && isSearchable}
              disabled={!isVisible}
              onChange={setSearchable}
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
