import { type TourDefinition, useTour } from '@indoor/ui';
import { useTranslation } from 'react-i18next';
import { deviceTourStore } from './tour-store';

/** Tur Visitor/Info Point: teks dari i18next, status per perangkat. */
export function useVisitorTour(tour: TourDefinition, { autoStart }: { autoStart: boolean }) {
  const { t } = useTranslation();
  return useTour({
    tour,
    labels: {
      next: t('tour.next'),
      previous: t('tour.previous'),
      done: t('tour.done'),
      skip: t('tour.skip'),
      // Penanda diteruskan apa adanya ke driver.js, yang mengisi nomor langkah.
      progress: t('tour.progress', { current: '{{current}}', total: '{{total}}' }),
    },
    store: deviceTourStore,
    autoStart,
    autoStartByDefault: import.meta.env.VITE_TOUR_AUTOSTART !== 'off',
  });
}
