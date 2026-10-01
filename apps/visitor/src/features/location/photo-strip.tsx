import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@indoor/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { data } from '../../data/client';

/** Foto lokasi berderet; mengetuk satu foto membukanya lebih besar. */
export function PhotoStrip({ name, paths }: { name: string; paths: readonly string[] }) {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (paths.length === 0) return null;
  const alt = (index: number) =>
    t('location.photo', { name, index: index + 1, count: paths.length });
  const openPath = openIndex === null ? undefined : paths[openIndex];

  return (
    <section className="grid gap-2">
      <h3 className="font-bold">{t('location.photos')}</h3>
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {paths.map((path, index) => (
          <li key={path} className="shrink-0">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="block cursor-pointer overflow-hidden rounded-sm border border-line"
            >
              <img
                src={data.snapshots.assetUrl(path)}
                alt={alt(index)}
                loading="lazy"
                className="h-24 w-32 bg-canvas object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={openPath !== undefined} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent closeLabel={t('location.closePhoto')} className="sm:max-w-3xl">
          <DialogTitle className="pr-8">{name}</DialogTitle>
          <DialogDescription className="sr-only">
            {openIndex === null ? '' : alt(openIndex)}
          </DialogDescription>
          {openPath && openIndex !== null ? (
            <img
              src={data.snapshots.assetUrl(openPath)}
              alt={alt(openIndex)}
              className="max-h-[70dvh] w-full rounded-sm bg-canvas object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
