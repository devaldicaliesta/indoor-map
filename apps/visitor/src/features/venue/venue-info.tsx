import { brandDisplayName, type Snapshot } from '@indoor/domain';
import {
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@indoor/ui';
import { InfoIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { intlLocale } from '../../i18n';

/** Versi peta yang sedang dibuka dan waktu terbitnya, dalam zona waktu venue. */
export function VenueInfo({ snapshot, className }: { snapshot: Snapshot; className?: string }) {
  const { t, i18n } = useTranslation();
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
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
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
      </DialogContent>
    </Dialog>
  );
}
