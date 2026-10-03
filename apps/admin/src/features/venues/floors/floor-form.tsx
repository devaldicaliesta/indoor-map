import { checkFloorInput, FLOOR_HEIGHT_RANGE, type Floor, type FloorInput } from '@indoor/domain';
import { Button, Input, toast } from '@indoor/ui';
import { type FormEvent, useState } from 'react';
import { Field } from '../../../app/components/field';
import { FormNotice } from '../../auth/auth-layout';
import { QuotaNotice, useQuotaBlock } from '../../license/quota-notice';

const MESSAGES = {
  name_required: 'Isi nama tampilan, misalnya GF atau L1.',
  level_integer: 'Level bilangan bulat; lantai bawah tanah negatif (B1 = −1).',
  height_range: `Tinggi ${FLOOR_HEIGHT_RANGE.min}–${FLOOR_HEIGHT_RANGE.max} m.`,
} as const;

export function FloorForm({
  floor,
  suggestedLevel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  floor: Floor | null;
  suggestedLevel: number;
  pending: boolean;
  error: string | null;
  onSubmit: (input: FloorInput, done: () => void) => void;
  onCancel?: () => void;
}) {
  const floorQuota = useQuotaBlock('floors');
  const [problems, setProblems] = useState<Partial<Record<keyof FloorInput, string>>>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const input = {
      name: String(form.get('name')),
      level: Number(form.get('level')),
      heightM: Number(String(form.get('height')).replace(',', '.')),
    };
    const found: Partial<Record<keyof FloorInput, string>> = {};
    for (const problem of checkFloorInput(input)) {
      if (problem === 'name_required') found.name = MESSAGES[problem];
      if (problem === 'level_integer') found.level = MESSAGES[problem];
      if (problem === 'height_range') found.heightM = MESSAGES[problem];
    }
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    onSubmit(input, () => {
      toast.success(floor ? `Lantai ${input.name} disimpan` : `Lantai ${input.name} ditambahkan`);
      if (!floor) formElement.reset();
    });
  }

  return (
    <form className="grid gap-3 rounded-lg border border-line p-4" onSubmit={submit} noValidate>
      <p className="font-bold">{floor ? `Ubah ${floor.name}` : 'Tambah lantai'}</p>
      <div className="grid grid-cols-3 gap-3">
        <Field id="floor-name" label="Nama tampilan" error={problems.name}>
          <Input
            id="floor-name"
            name="name"
            defaultValue={floor?.name}
            className="font-mono"
            placeholder="GF"
          />
        </Field>
        <Field id="floor-level" label="Level" error={problems.level}>
          <Input
            id="floor-level"
            name="level"
            type="number"
            step={1}
            defaultValue={floor?.level ?? suggestedLevel}
            className="font-mono"
          />
        </Field>
        <Field id="floor-height" label="Tinggi (m)" error={problems.heightM}>
          <Input
            id="floor-height"
            name="height"
            inputMode="decimal"
            defaultValue={floor?.heightM ?? 4}
            className="font-mono"
          />
        </Field>
      </div>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={pending || (!floor && floorQuota !== null)}
        >
          {floor ? 'Simpan lantai' : 'Tambah lantai'}
        </Button>
        {floor ? null : <QuotaNotice message={floorQuota} />}
        {onCancel ? (
          <Button type="button" onClick={onCancel}>
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  );
}
