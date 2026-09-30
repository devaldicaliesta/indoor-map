import type { FacilityTypeWithUsage } from '@indoor/data';
import {
  checkFacilityIconFile,
  checkFacilityTypeName,
  type FacilityIcon,
  type FacilityIconFileProblem,
  type FacilityTypeNameProblem,
  PICTOGRAM_KEYS,
  type PictogramKey,
  type VenueId,
} from '@indoor/domain';
import type { IconSource } from '@indoor/map-core';
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Pictogram,
  pictogramSvg,
  toast,
} from '@indoor/ui';
import { type FormEvent, useEffect, useState } from 'react';
import { Field } from '../../app/components/field';
import { FormNotice } from '../auth/auth-layout';
import { FacilityIconPreview } from './facility-icon-preview';
import { iconSource, PICTOGRAM_LABELS } from './icons';
import { useSaveFacilityType } from './queries';
import { rasterizeIcon } from './rasterize-icon';

const NAME_MESSAGES: Record<FacilityTypeNameProblem, string> = {
  required: 'Nama jenis wajib diisi.',
  too_long: 'Nama maksimal 60 karakter.',
  duplicate: 'Nama ini sudah dipakai jenis lain di venue ini.',
};

const FILE_MESSAGES: Record<FacilityIconFileProblem, string> = {
  empty: 'Berkas ikon kosong.',
  too_large: 'Ikon terlalu besar. Maksimal 200 kB.',
  unsupported_type: 'Ikon harus berupa SVG atau PNG.',
};

/** Ikon yang dipilih di formulir; unggahan baru baru disimpan saat formulir dikirim. */
type IconChoice =
  | { kind: 'builtin'; key: PictogramKey }
  | { kind: 'saved'; icon: FacilityIcon }
  | { kind: 'new'; png: Blob; previewUrl: string }
  | null;

function initialChoice(type: FacilityTypeWithUsage | null): IconChoice {
  if (!type?.icon) return null;
  return type.icon.kind === 'builtin'
    ? { kind: 'builtin', key: type.icon.key }
    : { kind: 'saved', icon: type.icon };
}

function choiceSource(choice: IconChoice): IconSource | null {
  if (!choice) return null;
  if (choice.kind === 'builtin') return { svg: pictogramSvg(choice.key) };
  if (choice.kind === 'saved') return iconSource(choice.icon);
  return { url: choice.previewUrl };
}

function PictogramPicker({
  value,
  disabled,
  onChange,
}: {
  value: PictogramKey | null;
  disabled: boolean;
  onChange: (key: PictogramKey) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Ikon bawaan"
      className="grid grid-cols-7 gap-1 rounded-md border border-line p-1"
    >
      {PICTOGRAM_KEYS.map((key) => (
        // biome-ignore lint/a11y/useSemanticElements: tombol ikon, bukan radio bawaan browser
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={PICTOGRAM_LABELS[key]}
          title={PICTOGRAM_LABELS[key]}
          disabled={disabled}
          onClick={() => onChange(key)}
          className={cn(
            'flex h-10 cursor-pointer items-center justify-center rounded-sm text-ink hover:bg-canvas disabled:cursor-not-allowed',
            value === key &&
              'bg-signal-soft shadow-[inset_0_0_0_1px_var(--ink)] hover:bg-signal-soft',
          )}
        >
          <Pictogram name={key} className="size-6" />
        </button>
      ))}
    </div>
  );
}

export function FacilityTypeDialog({
  venueId,
  type,
  others,
  onClose,
}: {
  venueId: VenueId;
  type: FacilityTypeWithUsage | null;
  others: readonly FacilityTypeWithUsage[];
  onClose: () => void;
}) {
  const save = useSaveFacilityType(venueId);
  const [name, setName] = useState(type?.name ?? '');
  const [isSafety, setIsSafety] = useState(type?.isSafety ?? false);
  const [choice, setChoice] = useState<IconChoice>(() => initialChoice(type));
  const [nameError, setNameError] = useState<string>();
  const [iconError, setIconError] = useState<string>();
  const [reading, setReading] = useState(false);

  const previewUrl = choice?.kind === 'new' ? choice.previewUrl : null;
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  async function pickFile(file: File | undefined) {
    setIconError(undefined);
    if (!file) return;
    const check = checkFacilityIconFile(file);
    if (!check.ok) {
      setIconError(FILE_MESSAGES[check.problem]);
      return;
    }
    setReading(true);
    try {
      const png = await rasterizeIcon(file);
      setChoice({ kind: 'new', png, previewUrl: URL.createObjectURL(png) });
    } catch (error) {
      setIconError(error instanceof Error ? error.message : 'Ikon tidak dapat dibaca.');
    } finally {
      setReading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = checkFacilityTypeName(name, others, type?.id ?? null)[0];
    setNameError(problem ? NAME_MESSAGES[problem] : undefined);
    if (problem) return;
    const icon: FacilityIcon | null =
      choice?.kind === 'builtin'
        ? { kind: 'builtin', key: choice.key }
        : choice?.kind === 'saved'
          ? choice.icon
          : null;
    save.mutate(
      {
        id: type?.id ?? null,
        input: { name, isSafety, icon },
        iconPng: choice?.kind === 'new' ? choice.png : undefined,
      },
      {
        onSuccess: (saved) => {
          toast.success(type ? 'Jenis fasilitas disimpan' : 'Jenis fasilitas ditambahkan', {
            description: saved.name,
          });
          onClose();
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{type ? `Ubah ${type.name}` : 'Tambah jenis fasilitas'}</DialogTitle>
          <DialogDescription>
            Jenis dipilih saat menaruh fasilitas di Editor Peta. Ikonnya tampil di peta dan di
            Visitor.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <Field id="facility-type-name" label="Nama" error={nameError}>
            <Input
              id="facility-type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              aria-invalid={nameError ? true : undefined}
            />
          </Field>
          <div className="grid gap-1">
            <Label>Ikon</Label>
            <PictogramPicker
              value={choice?.kind === 'builtin' ? choice.key : null}
              disabled={save.isPending}
              onChange={(key) => {
                setIconError(undefined);
                setChoice({ kind: 'builtin', key });
              }}
            />
          </div>
          <Field
            id="facility-type-icon"
            label="Atau unggah ikon sendiri"
            hint="SVG atau PNG, maksimal 200 kB. Bentuk berlatar transparan diwarnai seperti ikon bawaan."
            error={iconError}
          >
            <Input
              id="facility-type-icon"
              type="file"
              accept=".svg,.png,image/svg+xml,image/png"
              disabled={save.isPending || reading}
              onChange={(e) => void pickFile(e.target.files?.[0])}
            />
          </Field>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={isSafety}
              onChange={(e) => setIsSafety(e.target.checked)}
              className="mt-0.5 size-4 accent-ink"
            />
            <span>
              <span className="font-bold">Fasilitas keselamatan</span>
              <span className="block text-ink-muted text-sm">
                APAR, titik kumpul, pintu darurat, dan sejenisnya. Ikon berlatar merah di peta.
              </span>
            </span>
          </label>
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
                  : 'Belum ada ikon: fasilitas tampil sebagai lingkaran bertitik.'}
            </p>
          </div>
          {save.error ? <FormNotice tone="error">{save.error.message}</FormNotice> : null}
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={save.isPending || reading}>
              {save.isPending ? 'Menyimpan…' : type ? 'Simpan jenis' : 'Tambah jenis'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
