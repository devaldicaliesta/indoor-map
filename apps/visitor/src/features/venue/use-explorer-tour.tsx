import { TourButton } from '@indoor/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVisitorTour } from '../../app/tour';
import { useInfoPointMode } from '../../infopoint/info-point-mode';
import { useExploreStore } from '../search/explore-context';
import { infoPointTour, type ShowSheet, venueTour } from './tour';

const SHEET_ANIMATION_MS = 350;

/**
 * Tur peta venue (mulai sendiri sekali per perangkat) atau tur "Cara pakai" Info Point (hanya
 * lewat tombol). Info Point memasang ulang Visitor saat idle, sehingga tur yang terbuka ikut
 * tertutup.
 */
export function useExplorerTour(venueName: string, autoTour: boolean) {
  const { t } = useTranslation();
  const infoPoint = useInfoPointMode() !== null;
  const setSheetSnap = useExploreStore((s) => s.setSheetSnap);
  const tour = useMemo(() => {
    // Transisi tinggi sheet (300 ms) tetap berjalan saat reduced motion; posisi sasaran baru
    // benar setelah transisi selesai.
    const showSheet: ShowSheet = (snap) => async () => {
      setSheetSnap(snap);
      await new Promise((resolve) => setTimeout(resolve, SHEET_ANIMATION_MS));
    };
    return infoPoint ? infoPointTour(t) : venueTour(t, venueName, showSheet);
  }, [infoPoint, t, venueName, setSheetSnap]);
  const { start } = useVisitorTour(tour, { autoStart: autoTour && !infoPoint });
  return {
    start: () => void start(),
    infoPointButton: infoPoint ? (
      <TourButton label={t('tour.infoPointButton')} onClick={() => void start()} />
    ) : null,
  };
}
