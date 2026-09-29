import { distanceM, type Placement, rotatePlacement, scalePlacement } from '@indoor/map-core';
import { Button, Input, Label } from '@indoor/ui';
import { LockIcon, RulerIcon, UnlockIcon } from 'lucide-react';
import { useState } from 'react';
import type { Measure } from './use-georeference';

const meters = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const parseDecimal = (value: string) => Number(value.trim().replace(',', '.'));

function NumberField({
  id,
  label,
  value,
  suffix,
  disabled,
  onCommit,
}: {
  id: string;
  label: string;
  value: number;
  suffix: string;
  disabled: boolean;
  onCommit: (value: number) => void;
}) {
  const shown = meters.format(value);
  const [draft, setDraft] = useState<string | null>(null);
  function commit() {
    const parsed = draft === null ? Number.NaN : parseDecimal(draft);
    if (Number.isFinite(parsed)) onCommit(parsed);
    setDraft(null);
  }
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="decimal"
          className="font-mono tabular-nums"
          disabled={disabled}
          value={draft ?? shown}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
        <span className="w-6 text-ink-muted">{suffix}</span>
      </div>
    </div>
  );
}

function Calibration({
  measure,
  disabled,
  onStart,
  onCancel,
  onApply,
}: {
  measure: Measure;
  disabled: boolean;
  onStart: () => void;
  onCancel: () => void;
  onApply: (realM: number) => void;
}) {
  const [real, setReal] = useState('');
  const realM = parseDecimal(real);
  const measured = measure.step === 'measured' ? distanceM(measure.a, measure.b) : null;
  return (
    <section aria-label="Kalibrasi skala" className="grid gap-2 border-line border-t pt-4">
      <h2 className="font-bold">Kalibrasi skala</h2>
      {measure.step === 'idle' ? (
        <>
          <p className="text-ink-muted text-sm">
            Klik dua titik di denah yang jaraknya Anda ketahui, misalnya dua ujung dinding.
          </p>
          <Button onClick={onStart} disabled={disabled}>
            <RulerIcon /> Ukur jarak
          </Button>
        </>
      ) : measure.step === 'picking' ? (
        <>
          <p className="text-sm">Klik titik pertama, lalu titik kedua di denah.</p>
          <Button variant="ghost" onClick={onCancel}>
            Batal
          </Button>
        </>
      ) : (
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (realM > 0) onApply(realM);
          }}
        >
          <p className="text-sm">
            Terukur di peta:{' '}
            <output className="font-bold font-mono tabular-nums">
              {meters.format(measured ?? 0)} m
            </output>
          </p>
          <Label htmlFor="georef-real">Jarak nyata (m)</Label>
          <Input
            id="georef-real"
            inputMode="decimal"
            className="font-mono tabular-nums"
            value={real}
            onChange={(e) => setReal(e.target.value)}
            disabled={disabled}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={disabled || !(realM > 0)}>
              Terapkan skala
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Selesai
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

export function GeoreferencePanel({
  placement,
  opacity,
  lockAspect,
  measure,
  canEdit,
  onChange,
  onOpacity,
  onLockAspect,
  onMeasureStart,
  onMeasureCancel,
  onCalibrate,
}: {
  placement: Placement;
  opacity: number;
  lockAspect: boolean;
  measure: Measure;
  canEdit: boolean;
  onChange: (placement: Placement) => void;
  onOpacity: (opacity: number) => void;
  onLockAspect: (lock: boolean) => void;
  onMeasureStart: () => void;
  onMeasureCancel: () => void;
  onCalibrate: (realM: number) => void;
}) {
  const percent = Math.round(opacity * 100);
  function resize(side: 'widthM' | 'heightM', value: number) {
    if (!(value > 0)) return;
    if (lockAspect) {
      onChange(scalePlacement(placement, value / placement[side]));
    } else {
      onChange({ ...placement, [side]: value });
    }
  }
  return (
    <div className="grid content-start gap-4">
      <div className="grid gap-1">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="georef-opacity">Opasitas denah</Label>
          <output htmlFor="georef-opacity" className="font-mono tabular-nums">
            {percent}%
          </output>
        </div>
        <input
          id="georef-opacity"
          type="range"
          min={0}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => onOpacity(Number(e.target.value) / 100)}
          className="w-full accent-ink"
        />
      </div>
      <NumberField
        id="georef-rotation"
        label="Rotasi (searah jarum jam dari utara)"
        value={placement.rotationDeg}
        suffix="°"
        disabled={!canEdit}
        onCommit={(deg) => onChange(rotatePlacement(placement, deg))}
      />
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <div className="grid gap-2">
          <NumberField
            id="georef-width"
            label="Lebar"
            value={placement.widthM}
            suffix="m"
            disabled={!canEdit}
            onCommit={(v) => resize('widthM', v)}
          />
          <NumberField
            id="georef-height"
            label="Tinggi"
            value={placement.heightM}
            suffix="m"
            disabled={!canEdit}
            onCommit={(v) => resize('heightM', v)}
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={lockAspect}
          aria-label="Kunci proporsi"
          title="Kunci proporsi"
          className="mb-1 aria-pressed:bg-signal-soft"
          onClick={() => onLockAspect(!lockAspect)}
        >
          {lockAspect ? <LockIcon /> : <UnlockIcon />}
        </Button>
      </div>
      <Calibration
        measure={measure}
        disabled={!canEdit}
        onStart={onMeasureStart}
        onCancel={onMeasureCancel}
        onApply={onCalibrate}
      />
    </div>
  );
}
