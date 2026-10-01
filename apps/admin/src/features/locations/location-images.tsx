import type { LocationImages } from '@indoor/data';
import { checkImageFile, LOCATION_PHOTOS_MAX } from '@indoor/domain';
import { Button, Input } from '@indoor/ui';
import { XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Field } from '../../app/components/field';
import { IMAGE_MESSAGES } from './labels';
import { locationImageUrl } from './queries';

type ImageItem = { kind: 'saved'; path: string } | { kind: 'new'; file: File; url: string };

export interface ImagesDraft {
  logo: ImageItem | null;
  photos: ImageItem[];
}

export function initialImages(logoPath: string | null, photoPaths: readonly string[]): ImagesDraft {
  return {
    logo: logoPath ? { kind: 'saved', path: logoPath } : null,
    photos: photoPaths.map((path) => ({ kind: 'saved', path })),
  };
}

/** Perubahan untuk repository: logo tetap/hapus/ganti, foto lama yang dipertahankan dan foto baru. */
export function toLocationImages(draft: ImagesDraft, savedLogo: string | null): LocationImages {
  const images: LocationImages = {
    keepPhotoPaths: draft.photos.flatMap((p) => (p.kind === 'saved' ? [p.path] : [])),
    newPhotos: draft.photos.flatMap((p) => (p.kind === 'new' ? [p.file] : [])),
  };
  if (draft.logo?.kind === 'new') images.logo = draft.logo.file;
  else if (!draft.logo && savedLogo) images.logo = null;
  return images;
}

const srcOf = (item: ImageItem) => (item.kind === 'saved' ? locationImageUrl(item.path) : item.url);

function Thumbnail({
  item,
  label,
  disabled,
  onRemove,
}: {
  item: ImageItem;
  label: string;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="relative size-20 overflow-hidden rounded-sm border border-line bg-canvas">
      <img src={srcOf(item)} alt={label} className="size-full object-cover" />
      {disabled ? null : (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={`Hapus ${label.toLowerCase()}`}
          onClick={onRemove}
          className="absolute top-1 right-1 size-6"
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

/** Logo dan foto lokasi: PNG, JPG, atau WebP maksimal 5 MB, diunggah saat formulir disimpan. */
export function LocationImagesField({
  value,
  disabled,
  onChange,
}: {
  value: ImagesDraft;
  disabled: boolean;
  onChange: (value: ImagesDraft) => void;
}) {
  const [error, setError] = useState<string>();
  const created = useRef<string[]>([]);
  useEffect(
    () => () => {
      for (const url of created.current) URL.revokeObjectURL(url);
    },
    [],
  );

  function accept(files: readonly File[]): ImageItem[] {
    setError(undefined);
    return files.flatMap((file) => {
      const check = checkImageFile(file);
      if (!check.ok) {
        setError(`${file.name}: ${IMAGE_MESSAGES[check.problem]}`);
        return [];
      }
      const url = URL.createObjectURL(file);
      created.current.push(url);
      return [{ kind: 'new' as const, file, url }];
    });
  }

  const room = LOCATION_PHOTOS_MAX - value.photos.length;
  return (
    <div className="grid gap-4">
      <Field id="location-logo" label="Logo" hint="PNG, JPG, atau WebP, maksimal 5 MB.">
        <div className="flex items-center gap-3">
          {value.logo ? (
            <Thumbnail
              item={value.logo}
              label="Logo"
              disabled={disabled}
              onRemove={() => onChange({ ...value, logo: null })}
            />
          ) : null}
          {disabled ? null : (
            <Input
              id="location-logo"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const [item] = accept([...(e.target.files ?? [])].slice(0, 1));
                if (item) onChange({ ...value, logo: item });
                e.target.value = '';
              }}
            />
          )}
        </div>
      </Field>
      <Field
        id="location-photos"
        label={`Foto (${value.photos.length}/${LOCATION_PHOTOS_MAX})`}
        error={error}
      >
        <div className="grid gap-2">
          {value.photos.length ? (
            <div className="flex flex-wrap gap-2">
              {value.photos.map((photo, index) => (
                <Thumbnail
                  key={photo.kind === 'saved' ? photo.path : photo.url}
                  item={photo}
                  label={`Foto ${index + 1}`}
                  disabled={disabled}
                  onRemove={() =>
                    onChange({ ...value, photos: value.photos.filter((p) => p !== photo) })
                  }
                />
              ))}
            </div>
          ) : null}
          {disabled || room <= 0 ? null : (
            <Input
              id="location-photos"
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const items = accept([...(e.target.files ?? [])].slice(0, room));
                if (items.length) onChange({ ...value, photos: [...value.photos, ...items] });
                e.target.value = '';
              }}
            />
          )}
        </div>
      </Field>
    </div>
  );
}
