import { normalizeHeading } from '@indoor/domain';
import { Button, Input } from '@indoor/ui';
import { useState } from 'react';
import { Field } from '../../app/components/field';

/** Arah hadap 0–359,9° dengan tombol putar ±15°; dipakai titik asal dan Info Point. */
export function HeadingField({
  id,
  value,
  onChange,
  hint,
}: {
  id: string;
  value: number;
  onChange: (deg: number) => void;
  hint: string;
}) {
  // Teks mentah agar "359," atau isian kosong bisa diketik; angkanya dinormalkan saat diterima.
  const [text, setText] = useState(() => String(value).replace('.', ','));
  const apply = (deg: number) => {
    const next = normalizeHeading(deg);
    onChange(next);
    setText(String(next).replace('.', ','));
  };
  return (
    <Field id={id} label="Arah hadap (°, dari utara searah jarum jam)" hint={hint}>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={() => apply(value - 15)}>
          Putar −15°
        </Button>
        <Input
          id={id}
          inputMode="decimal"
          className="w-24 font-mono tabular-nums"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const deg = Number(e.target.value.replace(',', '.'));
            if (e.target.value.trim() && Number.isFinite(deg)) onChange(normalizeHeading(deg));
          }}
          onBlur={() => apply(value)}
        />
        <Button type="button" variant="ghost" onClick={() => apply(value + 15)}>
          Putar +15°
        </Button>
      </div>
    </Field>
  );
}
