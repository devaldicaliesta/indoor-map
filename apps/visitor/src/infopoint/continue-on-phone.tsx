import { useTranslation } from 'react-i18next';
import { useShareUrl } from '../features/share/share-button';
import { QrCode } from './qr-code';

/**
 * QR "Lanjutkan di HP": tautan rute yang sama (asal Info Point, tujuan, mode aksesibel, bahasa)
 * untuk dipindai pengunjung. Digambar sebagai SVG dari matriks QR domain, minimal 200 px.
 */
export function ContinueOnPhone() {
  const { t } = useTranslation();
  const url = useShareUrl();
  return (
    <section className="flex items-center gap-4 rounded-md border border-line p-3">
      <QrCode
        url={url}
        label={t('infoPoint.continueQr')}
        className="size-[220px] shrink-0 bg-white"
      />
      <div className="grid gap-1">
        <h3 className="font-bold">{t('infoPoint.continueTitle')}</h3>
        <p className="text-ink-muted">{t('infoPoint.continueDescription')}</p>
      </div>
    </section>
  );
}
