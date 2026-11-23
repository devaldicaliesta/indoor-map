import { Label } from '@indoor/ui';

/** Pilihan tunggal berupa tombol radio dalam satu baris. */
export function Choice<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 font-bold text-sm">{legend}</legend>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <Label key={option.value} className="flex cursor-pointer items-center gap-2 font-normal">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 accent-(--color-ink)"
            />
            {option.label}
          </Label>
        ))}
      </div>
    </fieldset>
  );
}
