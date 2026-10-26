import {
  type CameraView,
  COLOR_KINDS,
  type ColorKind,
  type DisplaySettings,
  HEIGHT_KINDS,
  type HeightKind,
  lockedFeatureMessage,
  toCameraView,
  type VenueId,
} from '@indoor/domain';
import { DEFAULT_HEIGHTS, defaultKindColor, type MapDisplay } from '@indoor/map-core';
import { Button, cn, Input, Label, Skeleton, toast } from '@indoor/ui';
import { type FormEvent, useMemo, useState } from 'react';
import { useCan } from '../../../app/auth/can';
import { FormNotice } from '../../auth/auth-layout';
import { FEATURE_KIND_LABELS } from '../../editor/labels';
import { useFeature } from '../../license/queries';
import {
  type DisplayFormErrors,
  type DisplayFormValues,
  toFormValues,
  toPatch,
  validate,
} from './display-form-model';
import { DisplayPreview } from './display-preview';
import { useDisplaySettings, useSaveDisplaySettings } from './queries';

const KIND_LABELS: Partial<Record<HeightKind | ColorKind, string>> = {
  outdoor_area: 'Area luar (jalan/trotoar)',
  facility: 'Fasilitas (latar ikon)',
};
const labelOf = (kind: HeightKind | ColorKind) => KIND_LABELS[kind] ?? FEATURE_KIND_LABELS[kind];

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

function cameraSummary(camera: CameraView | null): string {
  if (!camera) return 'Belum diatur: Visitor membingkai seluruh lantai awal.';
  return `Tersimpan: zoom ${number.format(camera.zoom)} · kemiringan ${Math.round(camera.pitch)}° · rotasi ${Math.round(camera.bearing)}°`;
}

function HeightRow({
  kind,
  value,
  error,
  disabled,
  onChange,
}: {
  kind: HeightKind;
  value: string;
  error: string | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const id = `height-${kind}`;
  return (
    <div className="grid grid-cols-[1fr_7rem] items-center gap-x-3 gap-y-1">
      <Label htmlFor={id}>{labelOf(kind)}</Label>
      <Input
        id={id}
        inputMode="decimal"
        className="font-mono tabular-nums"
        placeholder={`${DEFAULT_HEIGHTS[kind] ?? 0} m`}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className="col-span-2 text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ColorRow({
  kind,
  value,
  error,
  disabled,
  onChange,
}: {
  kind: ColorKind;
  value: string;
  error: string | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const id = `color-${kind}`;
  const fallback = defaultKindColor(kind);
  const swatch = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return (
    <div className="grid grid-cols-[1fr_auto_7rem_4.5rem] items-center gap-x-2 gap-y-1">
      <Label htmlFor={id}>{labelOf(kind)}</Label>
      <input
        type="color"
        aria-label={`Pilih warna ${labelOf(kind)}`}
        value={swatch}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="size-8 cursor-pointer rounded-sm border border-ink-muted bg-surface p-0.5 disabled:cursor-not-allowed"
      />
      <Input
        id={id}
        className="font-mono"
        placeholder={fallback}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && !disabled ? (
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
          Bawaan
        </Button>
      ) : (
        <span />
      )}
      {error ? <p className="col-span-4 text-danger text-sm">{error}</p> : null}
    </div>
  );
}

function DisplayForm({ venueId, settings }: { venueId: VenueId; settings: DisplaySettings }) {
  const canEdit = useCan('settings.edit');
  const [values, setValues] = useState<DisplayFormValues>(() => toFormValues(settings));
  const allow3d = useFeature('3d');
  const [errors, setErrors] = useState<DisplayFormErrors>({});
  const save = useSaveDisplaySettings(venueId);
  const saveCamera = useSaveDisplaySettings(venueId);

  // Pratinjau langsung memakai isian yang sah, sebelum disimpan.
  const live = useMemo<MapDisplay>(() => {
    const patch = toPatch(values);
    return { heights: patch.heights, colors: patch.colors };
  }, [values]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    save.mutate(toPatch(values), { onSuccess: () => toast.success('Tampilan disimpan') });
  }

  const setHeight = (kind: HeightKind, value: string) =>
    setValues((v) => ({ ...v, heights: { ...v.heights, [kind]: value } }));
  const setColor = (kind: ColorKind, value: string) =>
    setValues((v) => ({ ...v, colors: { ...v.colors, [kind]: value } }));

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <form className="grid gap-6" onSubmit={submit} noValidate>
        <fieldset className="grid gap-2" disabled={!canEdit}>
          <legend className="mb-1 font-bold">Mode awal Visitor</legend>
          <div className="flex gap-4">
            {(['2d', '3d'] as const).map((mode) => (
              <label key={mode} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="default-mode"
                  value={mode}
                  checked={values.defaultMode === mode}
                  disabled={mode === '3d' && !allow3d}
                  onChange={() => setValues((v) => ({ ...v, defaultMode: mode }))}
                  className="size-4 accent-ink"
                />
                {mode.toUpperCase()}
              </label>
            ))}
          </div>
          {allow3d ? null : <p className="text-ink-muted text-sm">{lockedFeatureMessage('3d')}</p>}
        </fieldset>
        <section className="grid gap-2" aria-labelledby="heights-title">
          <h3 id="heights-title" className="font-bold">
            Tinggi 3D per jenis (m)
          </h3>
          <p className="text-ink-muted text-sm">
            Berlaku untuk fitur tanpa tinggi sendiri. Tinggi yang diubah di panel properti fitur
            tetap dipakai. Kosong = bawaan.
          </p>
          {HEIGHT_KINDS.map((kind) => (
            <HeightRow
              key={kind}
              kind={kind}
              value={values.heights[kind]}
              error={errors[kind]}
              disabled={!canEdit}
              onChange={(value) => setHeight(kind, value)}
            />
          ))}
        </section>
        <section className="grid gap-2" aria-labelledby="colors-title">
          <h3 id="colors-title" className="font-bold">
            Warna per jenis
          </h3>
          {COLOR_KINDS.map((kind) => (
            <ColorRow
              key={kind}
              kind={kind}
              value={values.colors[kind]}
              error={errors[kind]}
              disabled={!canEdit}
              onChange={(value) => setColor(kind, value)}
            />
          ))}
        </section>
        {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
        {canEdit ? (
          <Button
            type="submit"
            variant="primary"
            className="justify-self-start"
            disabled={save.isPending}
          >
            {save.isPending ? 'Menyimpan…' : 'Simpan tampilan'}
          </Button>
        ) : null}
      </form>
      <DisplayPreview
        venueId={venueId}
        display={live}
        camera={settings.camera}
        cameraActions={(getCurrent) => (
          <div className="grid gap-2">
            <p className={cn('text-sm', settings.camera ? 'text-ink' : 'text-ink-muted')}>
              {cameraSummary(settings.camera)}
            </p>
            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={saveCamera.isPending}
                  onClick={() => {
                    const current = getCurrent();
                    if (!current) return;
                    saveCamera.mutate(
                      { camera: toCameraView(current) },
                      { onSuccess: () => toast.success('Tampilan awal disimpan') },
                    );
                  }}
                >
                  Simpan sebagai tampilan awal
                </Button>
                {settings.camera ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={saveCamera.isPending}
                    onClick={() =>
                      saveCamera.mutate(
                        { camera: null },
                        { onSuccess: () => toast.success('Tampilan awal dihapus') },
                      )
                    }
                  >
                    Hapus tampilan awal
                  </Button>
                ) : null}
              </div>
            ) : null}
            {saveCamera.error ? (
              <FormNotice tone="error">{saveCamera.error.message}</FormNotice>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}

export function DisplaySettingsPanel({ venueId }: { venueId: VenueId }) {
  const settings = useDisplaySettings(venueId);
  if (settings.isPending) return <Skeleton className="h-96 w-full" />;
  if (settings.error) return <p className="text-danger">{settings.error.message}</p>;
  return <DisplayForm key={venueId} venueId={venueId} settings={settings.data} />;
}
