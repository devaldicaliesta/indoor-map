import type { FieldDefinition } from '@indoor/domain';
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { Field } from '../../app/components/field';
import { locationImageUrl } from './queries';

/** Isian formulir per kunci; gambar baru disimpan sebagai berkas sampai lokasi disimpan. */
export interface FieldDraft {
  inputs: Record<string, string>;
  files: Record<string, File>;
}

const NO_VALUE = '__kosong__';

function FieldInput({
  field,
  value,
  file,
  disabled,
  invalid,
  onChange,
  onFile,
}: {
  field: FieldDefinition;
  value: string;
  file: File | undefined;
  disabled: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
  onFile: (file: File | undefined) => void;
}) {
  const id = `field-${field.key}`;
  const common = { id, disabled, 'aria-invalid': invalid ? true : undefined } as const;
  switch (field.type) {
    case 'select':
      return (
        <Select
          value={value || NO_VALUE}
          disabled={disabled}
          onValueChange={(v) => onChange(v === NO_VALUE ? '' : v)}
        >
          <SelectTrigger id={id} aria-invalid={invalid ? true : undefined}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_VALUE}>Tidak diisi</SelectItem>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'opening_hours':
      return (
        <textarea
          {...common}
          rows={2}
          value={value}
          placeholder="Misalnya: Senin–Jumat 08.00–16.00"
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-sm border border-ink-muted bg-surface px-3 py-2 text-ink disabled:cursor-not-allowed disabled:opacity-50"
        />
      );
    case 'image':
      return (
        <div className="flex items-center gap-3">
          {value && !file ? (
            <img
              src={locationImageUrl(value)}
              alt=""
              className="size-12 rounded-sm border border-line object-cover"
            />
          ) : null}
          <input
            {...common}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="text-sm"
          />
          {value || file ? (
            <button
              type="button"
              disabled={disabled}
              className="cursor-pointer text-sm underline"
              onClick={() => {
                onFile(undefined);
                onChange('');
              }}
            >
              Hapus
            </button>
          ) : null}
        </div>
      );
    default:
      return (
        <Input
          {...common}
          inputMode={field.type === 'number' ? 'decimal' : undefined}
          type={field.type === 'link' ? 'url' : 'text'}
          placeholder={field.type === 'link' ? 'https://' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/** Field kustom milik tipe lokasi yang dipilih, berurutan sesuai pengaturan tipe. */
export function CustomFieldInputs({
  fields,
  draft,
  errors,
  disabled,
  onChange,
}: {
  fields: readonly FieldDefinition[];
  draft: FieldDraft;
  errors: Readonly<Record<string, string>>;
  disabled: boolean;
  onChange: (draft: FieldDraft) => void;
}) {
  if (fields.length === 0) return null;
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 font-bold">Informasi tambahan</legend>
      {fields.map((field) => (
        <Field
          key={field.key}
          id={`field-${field.key}`}
          label={`${field.label}${field.isRequired ? '' : ' (opsional)'}`}
          hint={field.isVisible ? undefined : 'Tidak tampil di Visitor.'}
          error={errors[field.key]}
        >
          <FieldInput
            field={field}
            value={draft.inputs[field.key] ?? ''}
            file={draft.files[field.key]}
            disabled={disabled}
            invalid={Boolean(errors[field.key])}
            onChange={(value) =>
              onChange({ ...draft, inputs: { ...draft.inputs, [field.key]: value } })
            }
            onFile={(file) => {
              const files = { ...draft.files };
              if (file) files[field.key] = file;
              else delete files[field.key];
              onChange({ ...draft, files });
            }}
          />
        </Field>
      ))}
    </fieldset>
  );
}
