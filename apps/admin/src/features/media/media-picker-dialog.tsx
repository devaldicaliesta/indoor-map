import { filterMedia, type MediaAsset, reusableForLocation, type VenueId } from '@indoor/domain';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from '@indoor/ui';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { useMediaAssets, useMediaPreviews } from './queries';

/**
 * Memilih gambar yang sudah ada di pustaka media untuk dipakai ulang sebagai logo atau foto
 * lokasi. Hanya gambar di folder lokasi venue yang ditawarkan (aturan path `save_location`).
 */
export function MediaPickerDialog({
  venueId,
  title,
  max,
  exclude,
  onPick,
  onClose,
}: {
  venueId: VenueId;
  title: string;
  /** Jumlah gambar paling banyak yang boleh dipilih. */
  max: number;
  /** Path yang sudah dipakai formulir; tidak ditawarkan lagi. */
  exclude: readonly string[];
  onPick: (paths: string[]) => void;
  onClose: () => void;
}) {
  const assets = useMediaAssets(venueId);
  const [q, setQ] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const options = filterMedia(
    (assets.data ?? []).filter((a) => reusableForLocation(a) && !exclude.includes(a.path)),
    { q, kinds: [], usage: 'all' },
  );
  const previews = useMediaPreviews(venueId, assets.data);

  const toggle = (asset: MediaAsset) =>
    setChosen((current) => {
      if (current.includes(asset.path)) return current.filter((p) => p !== asset.path);
      if (max === 1) return [asset.path];
      return current.length < max ? [...current, asset.path] : current;
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] grid-rows-[auto_auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Gambar yang sama bisa dipakai banyak lokasi. Unggah gambar baru di menu Media.
          </DialogDescription>
        </DialogHeader>
        <Input
          aria-label="Cari gambar"
          placeholder="Cari nama berkas atau pemakainya"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="min-h-0 overflow-y-auto">
          {assets.isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : assets.error ? (
            <p role="alert" className="text-danger">
              {assets.error.message}
            </p>
          ) : options.length === 0 ? (
            <p className="text-ink-muted">Tidak ada gambar yang cocok di pustaka media.</p>
          ) : (
            <ul className="grid grid-cols-4 gap-2" aria-label="Gambar pustaka">
              {options.map((asset) => {
                const selected = chosen.includes(asset.path);
                return (
                  <li key={asset.path}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={asset.fileName}
                      onClick={() => toggle(asset)}
                      className="relative grid w-full gap-1 rounded-sm border border-line p-1 text-left aria-pressed:border-ink aria-pressed:ring-2 aria-pressed:ring-ink"
                    >
                      <img
                        src={previews.data?.get(asset.path)}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full rounded-sm bg-canvas object-contain"
                      />
                      <span className="truncate font-mono text-xs">{asset.fileName}</span>
                      {selected ? (
                        <CheckIcon
                          aria-hidden="true"
                          className="absolute top-2 right-2 size-5 rounded-full bg-ink p-0.5 text-surface"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            disabled={chosen.length === 0}
            onClick={() => {
              onPick(chosen);
              onClose();
            }}
          >
            Pakai {chosen.length > 0 ? `${chosen.length} gambar` : 'gambar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
