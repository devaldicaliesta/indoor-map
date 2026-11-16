import {
  checkFacilityIconFile,
  type FacilityIcon,
  type FacilityIconFileProblem,
  type PictogramKey,
} from '@indoor/domain';
import type { IconSource } from '@indoor/map-core';
import { Input, Label, pictogramSvg } from '@indoor/ui';
import { type ReactNode, useEffect, useState } from 'react';
import { Field } from '../../app/components/field';
import { FacilityIconPreview } from './facility-icon-preview';
import { iconSource } from './icons';
import { PictogramPicker } from './pictogram-picker';
import { rasterizeIcon } from './rasterize-icon';

const FILE_MESSAGES: Record<FacilityIconFileProblem, string> = {
  empty: 'Berkas ikon kosong.',
  too_large: 'Ikon terlalu besar. Maksimal 200 kB.',
  unsupported_type: 'Ikon harus berupa SVG atau PNG.',
};

/** Ikon yang dipilih di formulir; unggahan baru baru disimpan saat formulir dikirim. */
export type IconChoice =
  | { kind: 'builtin'; key: PictogramKey }
  | { kind: 'saved'; icon: FacilityIcon }
  | { kind: 'new'; png: Blob; previewUrl: string }
  | null;

export function initialIconChoice(icon: FacilityIcon | null): IconChoice {
  if (!icon) return null;
  return icon.kind === 'builtin' ? { kind: 'builtin', key: icon.key } : { kind: 'saved', icon };
}

/** Ikon yang disimpan; unggahan baru dikirim terpisah sebagai PNG (`iconChoicePng`). */
export function iconChoiceValue(choice: IconChoice): FacilityIcon | null {
  if (choice?.kind === 'builtin') return { kind: 'builtin', key: choice.key };
  if (choice?.kind === 'saved') return choice.icon;
  return null;
}

export function iconChoicePng(choice: IconChoice): Blob | undefined {
  return choice?.kind === 'new' ? choice.png : undefined;
}

function choiceSource(choice: IconChoice): IconSource | null {
  if (!choice) return null;
  if (choice.kind === 'builtin') return { svg: pictogramSvg(choice.key) };
  // Ikon jenis fasilitas dan kategori sama-sama berada di bucket publik `public-assets`.
  if (choice.kind === 'saved') return iconSource(choice.icon);
  return { url: choice.previewUrl };
}

/**
 * Ikon peta: piktogram bawaan atau unggahan SVG/PNG ≤ 200 kB yang dirasterisasi ke PNG,
 * dengan pratinjau persis seperti di peta.
 */
export function IconField({
  id,
  choice,
  onChange,
  onBusyChange,
  disabled,
  isSafety = false,
  beforePreview,
}: {
  id: string;
  choice: IconChoice;
  onChange: (choice: IconChoice) => void;
  /** Membaca/mengonversi berkas sedang berjalan; formulir sebaiknya menunda simpan. */
  onBusyChange?: (busy: boolean) => void;
  disabled: boolean;
  isSafety?: boolean;
  /** Isian yang memengaruhi pratinjau (misalnya tanda keselamatan), tampil di atasnya. */
  beforePreview?: ReactNode;
}) {
  const [error, setError] = useState<string>();
  const [reading, setReading] = useState(false);

  const previewUrl = choice?.kind === 'new' ? choice.previewUrl : null;
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  async function pickFile(file: File | undefined) {
    setError(undefined);
    if (!file) return;
    const check = checkFacilityIconFile(file);
    if (!check.ok) {
      setError(FILE_MESSAGES[check.problem]);
      return;
    }
    setReading(true);
    onBusyChange?.(true);
    try {
      const png = await rasterizeIcon(file);
      onChange({ kind: 'new', png, previewUrl: URL.createObjectURL(png) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ikon tidak dapat dibaca.');
    } finally {
      setReading(false);
      onBusyChange?.(false);
    }
  }

  return (
    <>
      <div className="grid gap-1">
        <Label>Ikon</Label>
        <PictogramPicker
          value={choice?.kind === 'builtin' ? choice.key : null}
          disabled={disabled}
          onChange={(key) => {
            setError(undefined);
            onChange(key ? { kind: 'builtin', key } : null);
          }}
        />
      </div>
      <Field
        id={id}
        label="Atau unggah ikon sendiri"
        hint="SVG atau PNG, maksimal 200 kB. Bentuk berlatar transparan diwarnai seperti ikon bawaan."
        error={error}
      >
        <Input
          id={id}
          type="file"
          accept=".svg,.png,image/svg+xml,image/png"
          disabled={disabled || reading}
          onChange={(e) => void pickFile(e.target.files?.[0])}
        />
      </Field>
      {beforePreview}
      <div className="flex items-center gap-3 rounded-md bg-canvas p-3">
        <FacilityIconPreview
          source={choiceSource(choice)}
          isSafety={isSafety}
          label="Pratinjau ikon di peta"
          scale={1.5}
        />
        <p className="text-ink-muted text-sm">
          {reading
            ? 'Membaca ikon…'
            : choice
              ? 'Pratinjau seperti di peta.'
              : 'Belum ada ikon: tampil sebagai lingkaran bertitik.'}
        </p>
      </div>
    </>
  );
}
