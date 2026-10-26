import { brandDisplayName, type Snapshot } from '@indoor/domain';
import {
  BrandSymbol,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  PRODUCT_TAGLINE,
  TourButton,
} from '@indoor/ui';
import { InfoIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { intlLocale } from '../../i18n';

/** Versi peta yang sedang dibuka, waktu terbitnya dalam zona waktu venue, dan tombol tur. */
export function VenueInfo({
  snapshot,
  onTour,
  className,
}: {
  snapshot: Snapshot;
  onTour?: () => void;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const publishedAt = new Intl.DateTimeFormat(intlLocale(i18n.resolvedLanguage), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: snapshot.venue.timezone,
    timeZoneName: 'short',
  }).format(new Date(snapshot.publishedAt));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-tour="visitor-info"
          aria-label={t('info.open')}
          className={cn(
            'inline-flex size-(--control-height) shrink-0 cursor-pointer items-center justify-center rounded-sm border border-line bg-surface text-ink hover:bg-canvas',
            className,
          )}
        >
          <InfoIcon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </button>
      </DialogTrigger>
      <DialogContent closeLabel={t('info.close')}>
        <DialogHeader>
          <DialogTitle>
            {brandDisplayName(snapshot.venue.name, snapshot.venue.branding)}
          </DialogTitle>
          <DialogDescription>{t('info.description')}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-ink-muted">{t('info.version')}</dt>
          <dd className="font-mono">v{snapshot.version}</dd>
          <dt className="text-ink-muted">{t('info.publishedAt')}</dt>
          <dd>{publishedAt}</dd>
        </dl>
        {onTour ? (
          <TourButton
            label={t('tour.button')}
            className="justify-self-start"
            onClick={() => {
              // Dialog ditutup dulu agar tur menunjuk peta, bukan lapisan dialog.
              setOpen(false);
              onTour();
            }}
          />
        ) : null}
        {/* Logo venue tetap yang utama; PanduArah hanya disebut kecil di sini. */}
        <p className="flex items-center gap-2 border-line border-t pt-3 text-ink-muted text-sm">
          <BrandSymbol label="" className="h-5" />
          {t('info.poweredBy', { tagline: PRODUCT_TAGLINE })}
        </p>
        <a
          href="/third-party-notices.txt"
          target="_blank"
          rel="noopener"
          className="text-ink-muted text-sm underline underline-offset-4"
        >
          {t('info.openSource')}
        </a>
      </DialogContent>
    </Dialog>
  );
}
