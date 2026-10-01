import type { ExploreTarget } from '@indoor/domain';
import { Button } from '@indoor/ui';
import { useTranslation } from 'react-i18next';
import { originView, placeOfTarget } from '../origin/origin-model';
import { useExplore, useExploreStore } from '../search/explore-context';

/**
 * Aksi utama detail: "Rute ke sini", atau "Saya di sini" saat pengunjung sedang menentukan titik
 * asalnya dengan mencari tempat tempat ia berada.
 */
export function RouteAction({ target }: { target: ExploreTarget }) {
  const { t } = useTranslation();
  const { snapshot, index } = useExplore();
  // Lokasi yang belum menempati unit tidak punya posisi di peta, jadi tidak bisa jadi asal/tujuan.
  const onMap = originView(snapshot, index, placeOfTarget(target)) !== null;
  const choosing = useExploreStore((s) => s.originMode === 'choose');
  const requestRoute = useExploreStore((s) => s.requestRoute);
  const setOrigin = useExploreStore((s) => s.setOrigin);
  return choosing ? (
    <Button
      variant="primary"
      className="w-full"
      disabled={!onMap}
      onClick={() => setOrigin(placeOfTarget(target))}
    >
      {t('origin.here')}
    </Button>
  ) : (
    <Button
      variant="primary"
      className="w-full"
      disabled={!onMap}
      onClick={() => requestRoute(target)}
    >
      {t('location.route')}
    </Button>
  );
}
