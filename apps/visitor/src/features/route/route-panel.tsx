import { type RouteStep, roundStepDistance } from '@indoor/routing';
import { Button } from '@indoor/ui';
import { ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, ListIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { intlLocale } from '../../i18n';
import { ContinueOnPhone } from '../../infopoint/continue-on-phone';
import { useInfoPointMode } from '../../infopoint/info-point-mode';
import { placeOfTarget } from '../origin/origin-model';
import { useOriginName } from '../origin/origin-panels';
import { detailTitle } from '../search/detail-title';
import { useExplore, useExploreStore } from '../search/explore-context';
import { ShareButton } from '../share/share-button';
import {
  type RouteFailure,
  routeFailure,
  routeFloors,
  stepTexts,
  targetOfPlace,
} from './route-model';
import { STEP_ICONS } from './step-icons';
import { useRoutePlan } from './use-route-plan';

function StepRow({
  step,
  text,
  onSelect,
}: {
  step: RouteStep;
  text: string;
  onSelect: () => void;
}) {
  const Icon = STEP_ICONS[step.action];
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full cursor-pointer items-start gap-3 rounded-sm px-2 py-2 text-left hover:bg-canvas"
      >
        <Icon aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-5 shrink-0" />
        <span className="min-w-0">{text}</span>
      </button>
    </li>
  );
}

/** Nama lantai untuk chip; nama gedung ikut disebut bila rute melewati lebih dari satu gedung. */
function useFloorLabel(floorIds: readonly string[]) {
  const { index } = useExplore();
  const buildings = new Set(floorIds.map((id) => index.floors.get(id)?.buildingId ?? null));
  return (floorId: string) => {
    const floor = index.floors.get(floorId);
    if (!floor) return '';
    const building = floor.buildingId ? index.buildings.get(floor.buildingId) : undefined;
    return buildings.size > 1 && building ? `${building.name} ${floor.name}` : floor.name;
  };
}

function FailureMessage({ failure }: { failure: RouteFailure }) {
  const { t } = useTranslation();
  const text = {
    closed: t('route.failClosed'),
    accessible: t('route.failAccessible'),
    origin: t('route.failOrigin'),
    destination: t('route.failDestination'),
    no_path: t('route.failNoPath'),
  }[failure];
  return (
    <p role="alert" className="font-bold text-danger">
      {text}
    </p>
  );
}

/** Alasan penutupan yang mengenai rute, misalnya "Perawatan lift; Lantai basah". */
function ClosureNotice({ ids, detour }: { ids: readonly string[]; detour: boolean }) {
  const { t } = useTranslation();
  const closures = useExploreStore((s) => s.closures);
  const reasons = [
    ...new Set(closures.filter((c) => ids.includes(c.id)).map((c) => c.reason.trim())),
  ].join('; ');
  if (ids.length === 0) return null;
  return (
    <p
      role="status"
      className="rounded-sm border border-line border-l-4 border-l-danger p-2 text-sm"
    >
      {detour ? t('route.detour') : t('route.closedBecause')}
      {reasons ? ` ${reasons}` : null}
    </p>
  );
}

function StepMode({
  steps,
  texts,
  active,
}: {
  steps: readonly RouteStep[];
  texts: readonly string[];
  active: number;
}) {
  const { t } = useTranslation();
  const showStep = useExploreStore((s) => s.showStep);
  const step = steps[active];
  if (!step) return null;
  const Icon = STEP_ICONS[step.action];
  return (
    <section className="grid gap-3" aria-live="polite">
      <p className="text-ink-muted text-sm">
        {t('route.stepOf', { current: active + 1, total: steps.length })}
      </p>
      <p className="flex items-start gap-3 font-bold text-lg">
        <Icon aria-hidden="true" strokeWidth={1.75} className="mt-1 size-6 shrink-0" />
        <span>{texts[active]}</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={active === 0} onClick={() => showStep(active - 1)}>
          <ChevronLeftIcon aria-hidden="true" strokeWidth={1.75} />
          {t('route.previous')}
        </Button>
        <Button
          variant="primary"
          disabled={active === steps.length - 1}
          onClick={() => showStep(active + 1)}
        >
          {t('route.next')}
          <ChevronRightIcon aria-hidden="true" strokeWidth={1.75} />
        </Button>
      </div>
      <Button variant="ghost" className="justify-self-start" onClick={() => showStep(null)}>
        <ListIcon aria-hidden="true" strokeWidth={1.75} />
        {t('route.allSteps')}
      </Button>
    </section>
  );
}

/**
 * Panel rute: dari (bisa diganti) dan ke, tukar, sakelar rute aksesibel, ringkasan jarak dan
 * lantai yang dilewati, lalu daftar langkah atau mode langkah. Rute dihitung di perangkat.
 */
export function RoutePanel() {
  const { t, i18n } = useTranslation();
  const { snapshot, index, store, routeStatus, retryRoute } = useExplore();
  const origin = useExploreStore((s) => s.origin);
  const destination = useExploreStore((s) => s.destination);
  const accessible = useExploreStore((s) => s.accessible);
  const activeStep = useExploreStore((s) => s.activeStep);
  // Fungsi aksi store tidak pernah berganti, jadi cukup dibaca sekali tanpa berlangganan.
  const { chooseOrigin, closeRoute, setAccessible, swap, showStep } = store.getState();
  // Info Point: titik asal tetap, jadi tidak bisa diganti atau ditukar.
  const infoPoint = useInfoPointMode();
  const from = useOriginName();
  const plan = useRoutePlan();
  const to = destination ? detailTitle(index, destination) : '';
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'id';
  const texts = useMemo(
    () =>
      plan?.ok
        ? stepTexts(plan.steps, snapshot, language, { origin: from ?? '', destination: to })
        : [],
    [plan, snapshot, language, from, to],
  );
  const floors = plan?.ok ? routeFloors(plan.steps) : [];
  const floorLabel = useFloorLabel(floors);
  if (!destination || !origin) return null;
  const swapTarget = targetOfPlace(index, origin);
  const distance = plan?.ok
    ? new Intl.NumberFormat(intlLocale(i18n.resolvedLanguage)).format(
        roundStepDistance(plan.route.distanceM),
      )
    : null;

  return (
    <section className="grid gap-4" aria-label={t('route.title')}>
      <div className="flex items-center gap-2">
        <dl className="grid min-w-0 flex-1 grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2">
          <dt className="text-ink-muted">{t('route.from')}</dt>
          <dd className="min-w-0 truncate font-bold">{from}</dd>
          {/* Kolom ketiga tetap terisi (juga di Info Point) agar "Ke" tidak bergeser ke kanan. */}
          <dd>
            {infoPoint ? null : (
              <Button size="sm" variant="ghost" onClick={chooseOrigin}>
                {t('origin.change')}
              </Button>
            )}
          </dd>
          <dt className="text-ink-muted">{t('route.to')}</dt>
          <dd className="col-span-2 min-w-0 truncate font-bold">{to}</dd>
        </dl>
        {infoPoint ? null : (
          <Button
            size="icon"
            variant="ghost"
            aria-label={t('route.swap')}
            disabled={!swapTarget}
            onClick={() => swapTarget && swap(placeOfTarget(destination), swapTarget)}
          >
            <ArrowUpDownIcon aria-hidden="true" strokeWidth={1.75} />
          </Button>
        )}
      </div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="size-4 accent-ink"
          checked={accessible}
          onChange={(e) => setAccessible(e.target.checked)}
        />
        {t('route.accessible')}
      </label>
      {!plan && routeStatus === 'loading' ? (
        <p role="status" className="text-ink-muted">
          {t('route.preparing')}
        </p>
      ) : null}
      {!plan && routeStatus === 'failed' ? (
        <div role="alert" className="grid justify-items-start gap-2">
          <p>{t('route.graphFailed')}</p>
          <Button size="sm" variant="secondary" onClick={retryRoute}>
            {t('venue.retry')}
          </Button>
        </div>
      ) : null}
      {plan && !plan.ok ? (
        <>
          <FailureMessage failure={routeFailure(plan)} />
          <ClosureNotice ids={plan.blockingClosureIds} detour={false} />
        </>
      ) : null}
      {plan?.ok ? <ClosureNotice ids={plan.route.avoidedClosureIds} detour /> : null}
      {plan?.ok ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{t('route.distance', { distance })}</span>
            <ul className="flex flex-wrap gap-1" aria-label={t('route.floors')}>
              {floors.map((floorId, i) => (
                <li
                  // Rute bisa kembali ke lantai yang sama; urutan membedakannya.
                  key={`${floorId}-${i}`}
                  className="rounded-sm border border-line px-2 py-0.5 font-mono text-sm"
                >
                  {floorLabel(floorId)}
                </li>
              ))}
            </ul>
          </div>
          {activeStep === null ? (
            <ol className="-mx-2 grid gap-0.5" aria-label={t('route.steps')}>
              {plan.steps.map((step, i) => (
                <StepRow
                  // Langkah tidak punya id; urutannya tetap selama rute yang sama.
                  key={`${step.action}-${i}`}
                  step={step}
                  text={texts[i] ?? ''}
                  onSelect={() => showStep(i)}
                />
              ))}
            </ol>
          ) : (
            <StepMode steps={plan.steps} texts={texts} active={activeStep} />
          )}
        </>
      ) : null}
      {plan?.ok ? (
        infoPoint ? (
          <ContinueOnPhone />
        ) : (
          <ShareButton title={`${from ?? ''} → ${to}`} />
        )
      ) : null}
      <Button variant="ghost" className="justify-self-start" onClick={closeRoute}>
        {t('route.close')}
      </Button>
    </section>
  );
}
