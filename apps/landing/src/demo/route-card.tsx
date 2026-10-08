import type { ExploreTarget, Snapshot, SnapshotIndex } from '@indoor/domain';
import { type RoutePlan, roundStepDistance } from '@indoor/routing';
import { Button, cn } from '@indoor/ui';
import { NavigationIcon, XIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useLanguage } from '../language';
import {
  type DemoOrigin,
  destinationGroups,
  routeFloorIds,
  stepTexts,
  targetName,
} from './demo-route';

/** Pilihan tujuan tanpa mengklik peta (juga untuk pengguna keyboard dan pembaca layar). */
export function DestinationPicker({
  snapshot,
  origin,
  target,
  onChange,
}: {
  snapshot: Snapshot;
  origin: DemoOrigin;
  target: ExploreTarget | null;
  onChange: (target: ExploreTarget | null) => void;
}) {
  const { copy } = useLanguage();
  const groups = useMemo(() => destinationGroups(snapshot), [snapshot]);
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      <label className="flex w-full min-w-0 items-center gap-2 font-bold sm:w-auto">
        <NavigationIcon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
        {copy.demo.destination}
        <select
          className="h-(--control-height) min-w-0 flex-1 rounded-sm border border-line bg-surface px-2 font-normal sm:max-w-64 sm:flex-none"
          value={target?.kind === 'location' ? target.id : ''}
          onChange={(event) =>
            onChange(event.target.value ? { kind: 'location', id: event.target.value } : null)
          }
        >
          <option value="">{copy.demo.choose}</option>
          {groups.map((group) => (
            <optgroup key={group.floorId} label={group.label}>
              {group.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <span className="text-ink-muted text-sm">
        {copy.demo.hint.replace('{origin}', origin.name)}
      </span>
    </div>
  );
}

/** Ringkasan rute di atas peta: asal, tujuan, jarak, lantai yang dilewati, dan langkahnya. */
export function RouteCard({
  snapshot,
  index,
  origin,
  target,
  plan,
  buildingId,
  floorId,
  floors,
  onFloor,
  onClose,
}: {
  snapshot: Snapshot;
  index: SnapshotIndex;
  origin: DemoOrigin;
  target: ExploreTarget;
  plan: RoutePlan;
  buildingId: string | null;
  floorId: string | null;
  floors: readonly { id: string; label: string }[];
  onFloor: (floorId: string) => void;
  onClose: () => void;
}) {
  const { language, copy } = useLanguage();
  const name = targetName(index, target);
  const texts = useMemo(
    () =>
      plan.ok
        ? stepTexts(plan, snapshot, language, { origin: origin.name, destination: name })
        : [],
    [plan, snapshot, language, origin.name, name],
  );
  const routeFloors = plan.ok ? routeFloorIds(snapshot, buildingId, plan) : [];
  const label = (id: string) => floors.find((f) => f.id === id)?.label ?? '';
  const distance = plan.ok
    ? new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US').format(
        roundStepDistance(plan.route.distanceM),
      )
    : '';

  return (
    <section
      aria-label={copy.demo.routeTitle}
      className="pointer-events-auto absolute top-3 left-3 grid w-[min(20rem,calc(100%-4.5rem))] sm:top-auto sm:bottom-3 sm:w-[min(20rem,calc(100%-5.5rem))] gap-2 rounded-lg border border-line bg-surface p-3 shadow-lg"
    >
      <div className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-ink-muted text-sm">
            {copy.demo.routeFrom} {origin.name}
          </span>
          <strong className="truncate text-lg leading-tight">{name}</strong>
        </div>
        <Button size="icon" variant="ghost" aria-label={copy.demo.clearRoute} onClick={onClose}>
          <XIcon strokeWidth={1.75} />
        </Button>
      </div>
      <div role="status" className="grid gap-2">
        {plan.ok ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{copy.demo.distance.replace('{m}', distance)}</span>
              {routeFloors.length > 1 ? (
                <fieldset aria-label={copy.demo.floors} className="m-0 flex gap-1 border-0 p-0">
                  {routeFloors.map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={floorId === id}
                      onClick={() => onFloor(id)}
                      className={cn(
                        'h-8 min-w-8 cursor-pointer rounded-sm border border-line px-2 font-bold text-sm',
                        floorId === id ? 'bg-ink text-surface' : 'bg-surface text-ink',
                      )}
                    >
                      {label(id)}
                    </button>
                  ))}
                </fieldset>
              ) : null}
            </div>
            <ol className="m-0 grid max-h-28 list-decimal gap-1 overflow-y-auto pl-5 text-sm">
              {texts.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ol>
          </>
        ) : (
          <p className="m-0 text-sm">{copy.demo.noRoute}</p>
        )}
      </div>
    </section>
  );
}
