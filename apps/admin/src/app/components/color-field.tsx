import { Input } from '@indoor/ui';
import { Field } from './field';

/** `''` (kosong) atau `#rrggbb`. */
export const isColorValue = (value: string) => value === '' || /^#[0-9a-f]{6}$/i.test(value);

/** Warna opsional: pemilih warna browser dan isian `#rrggbb` yang selalu sama nilainya. */
export function ColorField({
  id,
  label,
  hint,
  value,
  showError,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  showError: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const invalid = !isColorValue(value);
  return (
    <Field
      id={id}
      label={label}
      {...(hint ? { hint } : {})}
      error={showError && invalid ? 'Format warna #rrggbb.' : undefined}
    >
      <div className="flex gap-2">
        <input
          type="color"
          aria-label="Pilih warna"
          value={invalid || !value ? '#888888' : value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="size-(--control-height) cursor-pointer rounded-sm border border-ink-muted bg-surface p-0.5"
        />
        <Input
          id={id}
          className="font-mono"
          placeholder="#rrggbb"
          value={value}
          disabled={disabled}
          aria-invalid={showError && invalid ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}
