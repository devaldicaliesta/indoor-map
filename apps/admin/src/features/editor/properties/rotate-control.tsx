import { Button, Input, Label } from '@indoor/ui';
import { RotateCcwIcon, RotateCwIcon } from 'lucide-react';
import { useState } from 'react';

const STEPS = [-90, -15, 15, 90] as const;

/** Putar fitur terpilih terhadap pusatnya: tombol langkah cepat atau sudut bebas. */
export function RotateControl({ onRotate }: { onRotate: (degrees: number) => void }) {
  const [value, setValue] = useState('');
  const degrees = Number(value.trim().replace(',', '.'));
  return (
    <div className="grid gap-2">
      <Label htmlFor="rotate-degrees">Putar (searah jarum jam)</Label>
      <div className="grid grid-cols-4 gap-1">
        {STEPS.map((step) => (
          <Button
            key={step}
            size="sm"
            aria-label={`Putar ${step > 0 ? '' : 'berlawanan arah '}${Math.abs(step)}°`}
            className="px-1"
            onClick={() => onRotate(step)}
          >
            {step < 0 ? <RotateCcwIcon /> : <RotateCwIcon />}
            {Math.abs(step)}°
          </Button>
        ))}
      </div>
      <form
        className="flex min-w-0 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (Number.isFinite(degrees) && degrees !== 0) {
            onRotate(degrees);
            setValue('');
          }
        }}
      >
        <Input
          id="rotate-degrees"
          inputMode="decimal"
          placeholder="mis. 12,5"
          className="min-w-0 font-mono tabular-nums"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="submit" disabled={!Number.isFinite(degrees) || degrees === 0}>
          Putar
        </Button>
      </form>
    </div>
  );
}
