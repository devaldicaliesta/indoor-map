import { cn } from '@indoor/ui';
import { MapIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../app/use-media-query';
import { DESKTOP_QUERY, MOBILE_HEADER_PX } from '../../app/visitor-shell';
import { useInfoPointMode } from '../../infopoint/info-point-mode';

/**
 * Pengganti peta di perangkat tanpa WebGL: pengunjung tahu peta tidak bisa tampil dan bahwa
 * pencarian serta langkah rute di panel tetap bisa dipakai.
 */
export function MapUnavailable() {
  const { t } = useTranslation();
  const infoPoint = useInfoPointMode() !== null;
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  // Di HP pesan diletakkan tepat di bawah kolom cari agar tetap terlihat saat sheet setengah.
  const mobile = !infoPoint && !isDesktop;
  return (
    <div
      className={cn(
        'flex h-full w-full justify-center bg-canvas p-6',
        mobile ? 'items-start' : 'items-center',
      )}
      style={mobile ? { paddingTop: MOBILE_HEADER_PX + 24 } : undefined}
      data-testid="map-unavailable"
    >
      <section
        role="status"
        className={cn(
          'grid max-w-md justify-items-center gap-2 text-center',
          infoPoint && 'max-w-2xl gap-4',
        )}
      >
        <MapIcon
          aria-hidden="true"
          strokeWidth={1.75}
          className={cn('size-8 text-ink-muted', infoPoint && 'size-16')}
        />
        <h2 className={cn('font-bold text-lg', infoPoint && 'text-2xl')}>
          {t('map.unsupportedTitle')}
        </h2>
        <p className={cn('text-ink-muted', infoPoint && 'text-xl')}>
          {t('map.unsupportedDescription')}
        </p>
      </section>
    </div>
  );
}
