import { useTranslation } from 'react-i18next';
import { MapPreview } from './map-preview';

export function MapPreviewPage() {
  const { t } = useTranslation();
  return (
    <MapPreview
      labels={{
        zoomIn: t('map.zoomIn'),
        zoomOut: t('map.zoomOut'),
        resetNorth: t('map.resetNorth'),
        viewMode: t('map.viewMode'),
        mode2d: t('map.mode2d'),
        mode3d: t('map.mode3d'),
        floor: 'floor switch',
        synthetic: '1000',
        floorSwitcher: t('map.floors'),
      }}
    />
  );
}
