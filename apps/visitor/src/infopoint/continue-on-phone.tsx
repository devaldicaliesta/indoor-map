import { encodeQr } from '@indoor/domain';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShareUrl } from '../features/share/share-button';

/** Zona tenang standar QR (modul) di tiap sisi. */
const QUIET = 4;

/**
 * QR "Lanjutkan di HP": tautan rute yang sama (asal Info Point, tujuan, mode aksesibel, bahasa)
 * untuk dipindai pengunjung. Digambar sebagai SVG dari matriks QR domain, minimal 200 px.
 */
export function ContinueOnPhone() {
  const { t } = useTranslation();
  const url = useShareUrl();
  const matrix = useMemo(() => encodeQr(url), [url]);
  const size = matrix.length + QUIET * 2;
  const path = useMemo(
    () =>
      matrix
        .flatMap((row, y) =>
          row.map((dark, x) => (dark ? `M${x + QUIET} ${y + QUIET}h1v1h-1z` : '')),
        )
        .join(''),
    [matrix],
  );
  return (
    <section className="flex items-center gap-4 rounded-md border border-line p-3">
      <svg
        role="img"
        aria-label={t('infoPoint.continueQr')}
        data-url={url}
        viewBox={`0 0 ${size} ${size}`}
        className="size-[220px] shrink-0 bg-white"
        shapeRendering="crispEdges"
      >
        <path d={path} fill="#000" />
      </svg>
      <div className="grid gap-1">
        <h3 className="font-bold">{t('infoPoint.continueTitle')}</h3>
        <p className="text-ink-muted">{t('infoPoint.continueDescription')}</p>
      </div>
    </section>
  );
}
