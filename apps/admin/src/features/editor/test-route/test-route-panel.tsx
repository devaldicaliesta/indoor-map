import { type FacilityType, SNAPSHOT_LANGUAGES, type VenueId } from '@indoor/domain';
import { instructionText, type RoutePlace, type RoutePlan } from '@indoor/routing';
import { Button, cn, Skeleton, StatusDot } from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownUpIcon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { data } from '../../../app/data-client';
import { closureText, type FailureContext, failureText } from './failure-text';
import { type PlaceDisplay, PlaceField } from './place-field';
import { floorText, type PlaceOption, placeKey, placeName, placeOptions } from './place-options';
import { RouteSteps } from './route-steps';
import { type RouteEndName, useTestRouteStore } from './test-route-store';
import { type RouteSources, useRouteSources } from './use-route-sources';
import { stepFocus, useTestRoutePlan } from './use-test-route-plan';

const meters = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const END_LABELS: Record<RouteEndName, string> = { from: 'Dari', to: 'Ke' };

function display(
  place: RoutePlace | null,
  sources: RouteSources | null,
  options: ReadonlyMap<string, PlaceOption>,
): PlaceDisplay | null {
  if (!place) return null;
  if (!sources) return { label: 'Memuat…', detail: '', mono: false };
  if (place.kind === 'point') {
    return {
      label: 'Titik di peta',
      detail: floorText(place.floorId, sources.floors, sources.buildings),
      mono: false,
    };
  }
  const option = options.get(placeKey(place));
  return option
    ? { label: option.label, detail: option.detail, mono: option.mono }
    : { label: 'Tidak ditemukan', detail: 'Sudah dihapus dari draft', mono: false };
}

function LanguageToggle() {
  const language = useTestRouteStore((s) => s.language);
  const setLanguage = useTestRouteStore((s) => s.setLanguage);
  return (
    <div
      role="radiogroup"
      aria-label="Bahasa instruksi"
      className="flex overflow-hidden rounded-sm border border-line text-sm"
    >
      {SNAPSHOT_LANGUAGES.map((value) => (
        // biome-ignore lint/a11y/useSemanticElements: tombol segmen seperti pemilih lantai di bilah atas
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={language === value}
          onClick={() => setLanguage(value)}
          className={cn(
            'cursor-pointer px-2 py-0.5 font-mono uppercase hover:bg-canvas',
            language === value && 'bg-ink font-bold text-on-strong hover:bg-ink',
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

/** Catatan untuk unit/fasilitas/lokasi tanpa titik masuk: rute memakai titik terdekat di jalur. */
function entranceNotes(
  plan: Extract<RoutePlan, { ok: true }>,
  ends: readonly [RoutePlace | null, RoutePlace | null],
  labels: readonly [PlaceDisplay | null, PlaceDisplay | null],
): string[] {
  const used = [plan.origin, plan.destination];
  return ends.flatMap((place, i) =>
    place && place.kind !== 'point' && used[i]?.kind === 'point'
      ? [`${labels[i]?.label} belum punya titik masuk; rute memakai titik terdekat di jalur.`]
      : [],
  );
}

function Result({
  plan,
  sources,
  options,
  context,
}: {
  plan: RoutePlan;
  sources: RouteSources;
  options: ReadonlyMap<string, PlaceOption>;
  context: FailureContext;
}) {
  const from = useTestRouteStore((s) => s.from);
  const to = useTestRouteStore((s) => s.to);
  const language = useTestRouteStore((s) => s.language);
  const activeStep = useTestRouteStore((s) => s.activeStep);
  const showStep = useTestRouteStore((s) => s.showStep);
  const texts = useMemo(() => {
    if (!plan.ok || !from || !to) return [];
    const ctx = {
      templates: sources.templates,
      language,
      floors: sources.floors,
      buildings: sources.buildings,
      origin: placeName(from, options, language),
      destination: placeName(to, options, language),
    };
    return plan.steps.map((step) => instructionText(step, ctx));
  }, [plan, sources, from, to, language, options]);

  if (!plan.ok) {
    const text = failureText(plan, context);
    return (
      <div role="alert" className="grid gap-1">
        <StatusDot tone="danger" className="items-baseline font-bold">
          {text.title}
        </StatusDot>
        {text.details.map((detail) => (
          <p key={detail} className="text-sm">
            {detail}
          </p>
        ))}
      </div>
    );
  }
  const chip = (floorId: string) => {
    const floor = sources.floors.find((f) => f.id === floorId);
    const building = sources.buildings.find((b) => b.id === floor?.buildingId);
    return building ? `${building.code} ${floor?.name}` : (floor?.name ?? '?');
  };
  const notes = entranceNotes(
    plan,
    [from, to],
    [display(from, sources, options), display(to, sources, options)],
  );
  const avoided = plan.route.avoidedClosureIds;
  return (
    <div className="grid min-w-0 gap-3">
      <p className="font-bold">
        {meters.format(plan.route.distanceM)} m · {plan.steps.length} langkah
        {context.accessible ? ' · kursi roda' : ''}
      </p>
      {[...notes, ...avoided.map((id) => `Memutar: ${closureText(id, context)}`)].map((note) => (
        <p key={note} className="text-ink-muted text-sm">
          {note}
        </p>
      ))}
      <RouteSteps
        steps={plan.steps}
        texts={texts}
        floorChip={chip}
        activeStep={activeStep}
        onSelect={(index) => {
          const focus = stepFocus(plan, sources.floors, index);
          if (focus) showStep(index, focus);
        }}
      />
    </div>
  );
}

/**
 * Panel Uji rute: asal dan tujuan (lokasi, unit, fasilitas, QR titik asal, Info Point, atau klik
 * di peta), mode kursi roda, lalu jarak dan langkah ID/EN dari draft, atau alasan bila gagal.
 */
export function TestRoutePanel({
  venueId,
  facilityTypes,
}: {
  venueId: VenueId;
  facilityTypes: readonly FacilityType[];
}) {
  const { from, to, accessible, picking } = useTestRouteStore(
    useShallow((s) => ({ from: s.from, to: s.to, accessible: s.accessible, picking: s.picking })),
  );
  // Fungsi aksi store tidak pernah berganti; objek state-nya berganti, jadi bukan dependensi efek.
  const actions = useTestRouteStore.getState();
  const sources = useRouteSources(venueId);
  const plan = useTestRoutePlan(sources);
  const timezone =
    useQuery({ queryKey: ['venue', venueId], queryFn: () => data.venues.get(venueId) }).data
      ?.timezone ?? 'Asia/Jakarta';

  useEffect(() => useTestRouteStore.getState().selectVenue(venueId), [venueId]);
  useEffect(() => () => useTestRouteStore.getState().stopPicking(), []);

  const list = useMemo(
    () => (sources ? placeOptions({ ...sources, facilityTypes }) : []),
    [sources, facilityTypes],
  );
  const options = useMemo(() => new Map(list.map((o) => [o.key, o])), [list]);
  const context = useMemo<FailureContext | null>(() => {
    if (!sources) return null;
    const features = new Map(sources.features.map((f) => [f.properties.id, f.properties]));
    return {
      accessible,
      floors: sources.floors,
      buildings: sources.buildings,
      connectors: sources.connectors,
      closures: sources.closures,
      featureLabel: (id) => {
        const p = features.get(id);
        return p ? (p.unitCode ?? p.name ?? null) : null;
      },
      edgeFloorId: (id) => sources.graph.edges[id]?.floorId ?? null,
      timezone,
    };
  }, [sources, accessible, timezone]);

  const ends = { from, to };
  const field = (end: RouteEndName) => (
    <PlaceField
      label={END_LABELS[end]}
      value={display(ends[end], sources, options)}
      options={list}
      picking={picking === end}
      onChange={(option) => actions.setPlace(end, option.place)}
      onPick={() => (picking === end ? actions.stopPicking() : actions.startPicking(end))}
      onClear={() => actions.setPlace(end, null)}
    />
  );

  return (
    <section aria-label="Uji rute" className="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <div className="grid gap-2 border-line border-b p-3">
        {field('from')}
        <Button
          size="sm"
          variant="ghost"
          className="justify-self-start"
          disabled={!from && !to}
          onClick={actions.swap}
        >
          <ArrowDownUpIcon />
          Tukar asal dan tujuan
        </Button>
        {field('to')}
        <div className="flex items-center justify-between gap-2 pt-1">
          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
            <input
              type="checkbox"
              className="size-4 accent-ink"
              checked={accessible}
              onChange={(e) => actions.setAccessible(e.target.checked)}
            />
            Mode kursi roda
          </label>
          <LanguageToggle />
        </div>
      </div>
      <div className="min-h-0 overflow-x-hidden overflow-y-auto p-3">
        {!from || !to ? (
          <p className="text-ink-muted text-sm">
            Pilih asal dan tujuan. Rute dihitung dari draft, termasuk perubahan yang belum
            dipublish.
          </p>
        ) : !sources || !plan || !context ? (
          <div className="grid gap-2" aria-busy="true">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : (
          <Result plan={plan} sources={sources} options={options} context={context} />
        )}
      </div>
    </section>
  );
}
