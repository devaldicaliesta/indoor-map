import { Button, cn, Input, Label } from '@indoor/ui';
import type { ColorNote } from './branding-form-model';

export function ColorField({
  id,
  label,
  fallback,
  value,
  error,
  note,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  fallback: string;
  value: string;
  error: string | undefined;
  note: ColorNote | null;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const swatch = /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim().toLowerCase() : fallback;
  const describedBy = error ? `${id}-error` : note ? `${id}-note` : undefined;
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="grid grid-cols-[auto_8rem_auto] items-center justify-start gap-2">
        <input
          type="color"
          aria-label={`Pilih ${label.toLowerCase()}`}
          value={swatch}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 cursor-pointer rounded-sm border border-ink-muted bg-surface p-0.5 disabled:cursor-not-allowed"
        />
        <Input
          id={id}
          className="font-mono"
          placeholder={fallback}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && !disabled ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
            Bawaan
          </Button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-danger text-sm">
          {error}
        </p>
      ) : note ? (
        <p
          id={`${id}-note`}
          className={cn('text-sm', note.tone === 'warn' ? 'text-ink' : 'text-ink-muted')}
        >
          {note.tone === 'warn' ? (
            <span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-warn" />
          ) : null}
          {note.text}
        </p>
      ) : null}
    </div>
  );
}
