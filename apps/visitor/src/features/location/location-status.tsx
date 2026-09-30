import type { SnapshotLocation } from '@indoor/domain';
import { StatusDot } from '@indoor/ui';
import { useTranslation } from 'react-i18next';
import { intlLocale } from '../../i18n';

/** Tanggal `YYYY-MM-DD` apa adanya, tanpa geser zona waktu. */
function formatDate(date: string, language: string | undefined): string {
  return new Intl.DateTimeFormat(intlLocale(language), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

/**
 * Status lokasi yang perlu diketahui pengunjung: segera buka (dengan tanggalnya) atau tutup
 * sementara. Lokasi aktif tidak diberi label; buka/tutup menurut jam operasional menyusul di T-304.
 */
export function LocationStatus({
  location,
  className,
}: {
  location: Pick<SnapshotLocation, 'status' | 'openingDate'>;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  if (location.status === 'coming_soon') {
    return (
      <StatusDot tone="warn" className={className}>
        {location.openingDate
          ? t('location.comingSoonFrom', {
              date: formatDate(location.openingDate, i18n.resolvedLanguage),
            })
          : t('location.comingSoon')}
      </StatusDot>
    );
  }
  if (location.status === 'inactive_temporary') {
    return (
      <StatusDot tone="danger" hollow className={className}>
        {t('location.temporarilyClosed')}
      </StatusDot>
    );
  }
  return null;
}
