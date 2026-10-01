import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

// Mode Info Point dibuat di T-408.
export function InfoPointPage() {
  const { t } = useTranslation();
  const { code } = useParams();
  return (
    <main data-info-point-code={code} className="grid h-dvh place-items-center bg-canvas">
      <h1 className="font-bold text-xl">{t('infoPoint.title', { code })}</h1>
    </main>
  );
}
