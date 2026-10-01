import { Button } from '@indoor/ui';
import { MapPinIcon, NavigationIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExplore, useExploreStore } from '../search/explore-context';
import { detailTitle } from '../search/explore-panel';
import { originView } from './origin-model';

/** Nama titik asal untuk panel: nama tempat, atau "Titik di peta". */
export function useOriginName(): string | null {
  const { t } = useTranslation();
  const { snapshot, index } = useExplore();
  const origin = useExploreStore((s) => s.origin);
  if (!origin) return null;
  const view = originView(snapshot, index, origin);
  if (!view) return null;
  return view.name ?? t('origin.mapPoint');
}

/** Petunjuk saat menentukan titik asal: cari tempat lalu "Saya di sini", atau ketuk peta. */
export function OriginChooser() {
  const { t } = useTranslation();
  const tapOrigin = useExploreStore((s) => s.tapOrigin);
  const cancelOrigin = useExploreStore((s) => s.cancelOrigin);
  return (
    <section className="grid gap-2 rounded-sm border border-line p-3" aria-live="polite">
      <h2 className="font-bold">{t('origin.chooseTitle')}</h2>
      <p className="text-ink-muted text-sm">{t('origin.chooseHint')}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={tapOrigin}>
          <MapPinIcon aria-hidden="true" strokeWidth={1.75} />
          {t('origin.tapMap')}
        </Button>
        <Button size="sm" variant="ghost" onClick={cancelOrigin}>
          {t('origin.cancel')}
        </Button>
      </div>
    </section>
  );
}

/** Mode ketuk peta: ketukan berikutnya di peta menjadi titik asal. */
export function OriginTapHint() {
  const { t } = useTranslation();
  const cancelOrigin = useExploreStore((s) => s.cancelOrigin);
  return (
    <div className="flex items-center justify-between gap-3" aria-live="polite">
      <p className="font-bold">{t('origin.tapHint')}</p>
      <Button size="sm" variant="ghost" onClick={cancelOrigin}>
        {t('origin.cancel')}
      </Button>
    </div>
  );
}

/** Baris "Anda di sini" di atas panel jelajah, dengan tombol ganti. */
export function OriginRow() {
  const { t } = useTranslation();
  const name = useOriginName();
  const chooseOrigin = useExploreStore((s) => s.chooseOrigin);
  if (!name) return null;
  return (
    <div className="flex items-center gap-2">
      <NavigationIcon aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
      <p className="min-w-0 flex-1 truncate">
        <span className="text-ink-muted">{t('origin.youAreHere')}: </span>
        <span className="font-bold">{name}</span>
      </p>
      <Button size="sm" variant="ghost" onClick={chooseOrigin}>
        {t('origin.change')}
      </Button>
    </div>
  );
}

/**
 * Panel rute: dari (bisa diganti) dan ke. Garis rute, langkah, dan mode aksesibel ditambahkan di
 * T-215.
 */
export function RoutePanel() {
  const { t } = useTranslation();
  const { index } = useExplore();
  const destination = useExploreStore((s) => s.destination);
  const chooseOrigin = useExploreStore((s) => s.chooseOrigin);
  const closeRoute = useExploreStore((s) => s.closeRoute);
  const from = useOriginName();
  if (!destination) return null;
  return (
    <section className="grid gap-3" aria-label={t('route.title')}>
      <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2">
        <dt className="text-ink-muted">{t('route.from')}</dt>
        <dd className="min-w-0 truncate font-bold">{from}</dd>
        <Button size="sm" variant="ghost" onClick={chooseOrigin}>
          {t('origin.change')}
        </Button>
        <dt className="text-ink-muted">{t('route.to')}</dt>
        <dd className="col-span-2 min-w-0 truncate font-bold">{detailTitle(index, destination)}</dd>
      </dl>
      <p className="text-ink-muted text-sm">{t('location.routeUnavailable')}</p>
      <Button variant="ghost" className="justify-self-start" onClick={closeRoute}>
        {t('route.close')}
      </Button>
    </section>
  );
}
