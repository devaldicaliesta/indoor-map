import type { TourDefinition } from '@indoor/ui';
import type { TFunction } from 'i18next';
import type { SheetSnap } from '../../components/sheet-snap';

/** Membuka bottom sheet ke tinggi tertentu dan menunggu animasinya sebelum langkah tampil. */
export type ShowSheet = (snap: SheetSnap) => () => Promise<void>;

/** Tur peta venue: tampil sendiri pada kunjungan pertama di perangkat ini. */
export function venueTour(t: TFunction, venueName: string, showSheet: ShowSheet): TourDefinition {
  return {
    id: 'venue',
    version: 1,
    steps: [
      {
        title: t('tour.venue.introTitle'),
        description: t('tour.venue.introBody', { name: venueName }),
        before: showSheet('peek'),
      },
      {
        target: 'visitor-search',
        title: t('tour.venue.searchTitle'),
        description: t('tour.venue.searchBody'),
        side: 'bottom',
        before: showSheet('peek'),
      },
      {
        target: 'visitor-chips',
        title: t('tour.venue.chipsTitle'),
        description: t('tour.venue.chipsBody'),
        side: 'top',
        before: showSheet('half'),
      },
      {
        target: 'visitor-floors',
        title: t('tour.venue.floorsTitle'),
        description: t('tour.venue.floorsBody'),
        side: 'left',
        before: showSheet('peek'),
      },
      {
        target: 'visitor-map-controls',
        title: t('tour.venue.controlsTitle'),
        description: t('tour.venue.controlsBody'),
        side: 'left',
        before: showSheet('peek'),
      },
      {
        title: t('tour.venue.placeTitle'),
        description: t('tour.venue.placeBody'),
      },
      {
        target: 'visitor-language',
        title: t('tour.venue.languageTitle'),
        description: t('tour.venue.languageBody'),
        side: 'bottom',
      },
      {
        target: 'visitor-info',
        title: t('tour.venue.infoTitle'),
        description: t('tour.venue.infoBody'),
        side: 'bottom',
      },
    ],
  };
}

/** Tur "Cara pakai" Info Point: hanya lewat tombol, tidak pernah mulai sendiri. */
export function infoPointTour(t: TFunction): TourDefinition {
  return {
    id: 'info-point',
    version: 1,
    steps: [
      { title: t('tour.infoPoint.introTitle'), description: t('tour.infoPoint.introBody') },
      {
        target: 'visitor-search',
        title: t('tour.infoPoint.searchTitle'),
        description: t('tour.infoPoint.searchBody'),
        side: 'top',
      },
      {
        target: 'visitor-chips',
        title: t('tour.venue.chipsTitle'),
        description: t('tour.venue.chipsBody'),
        side: 'top',
      },
      {
        target: 'visitor-floors',
        title: t('tour.venue.floorsTitle'),
        description: t('tour.venue.floorsBody'),
        side: 'left',
      },
      { title: t('tour.infoPoint.routeTitle'), description: t('tour.infoPoint.routeBody') },
      {
        target: 'visitor-language',
        title: t('tour.venue.languageTitle'),
        description: t('tour.venue.languageBody'),
        side: 'bottom',
      },
    ],
  };
}
