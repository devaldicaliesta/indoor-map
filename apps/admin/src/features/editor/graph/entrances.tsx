import type { FloorFeature } from '@indoor/data';
import {
  type EntranceSource,
  type EntranceSuggestion,
  type FacilityType,
  suggestEntrances,
  type UnreachableReason,
  unlinkedFeatures,
} from '@indoor/domain';
import { Button, cn } from '@indoor/ui';
import { useMemo } from 'react';
import { toListItem } from '../feature-list-model';
import { FEATURE_KIND_LABELS } from '../labels';
import { featureList, useEditorStore } from '../store/editor-store';
import type { EditorSession } from '../use-editor-session';
import { useEntranceStore } from './entrance-store';

const SOURCE_LABELS: Record<EntranceSource, string> = {
  door: 'dari pintu',
  edge: 'tepi terdekat',
  point: 'titik fasilitas',
};

const REASON_LABELS: Record<UnreachableReason, string> = {
  no_path: 'Lantai ini belum punya jalur.',
  too_far: 'Jalur terdekat lebih dari 15 m; gambar jalur di dekatnya.',
};

const meters = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

/** Unit dan fasilitas di lantai ini yang belum punya titik masuk. */
export function useUnlinked() {
  const features = useEditorStore((s) => s.features);
  const graph = useEditorStore((s) => s.graph);
  return useMemo(() => unlinkedFeatures(featureList(features), graph), [features, graph]);
}

function useLabel(facilityTypes: readonly FacilityType[]) {
  return useMemo(() => {
    const names = new Map<string, string>(facilityTypes.map((t) => [t.id, t.name]));
    return (feature: FloorFeature) =>
      toListItem(
        feature,
        (id) => names.get(id),
        (kind) => `${FEATURE_KIND_LABELS[kind]} tanpa nama`,
      ).label;
  }, [facilityTypes]);
}

function FeatureButton({
  feature,
  label,
  detail,
}: {
  feature: FloorFeature;
  label: string;
  detail: string;
}) {
  const focus = useEditorStore((s) => s.focus);
  return (
    <button
      type="button"
      onClick={() => focus(feature.properties.id)}
      className="grid min-w-0 flex-1 cursor-pointer rounded-sm px-1 py-0.5 text-left hover:bg-canvas"
    >
      <span className={cn('truncate', feature.properties.unitCode && 'font-mono')}>{label}</span>
      <span className="truncate text-ink-muted text-xs">{detail}</span>
    </button>
  );
}

function SuggestionList({
  suggestions,
  session,
  label,
}: {
  suggestions: EntranceSuggestion[];
  session: EditorSession;
  label: (feature: FloorFeature) => string;
}) {
  const features = useEditorStore((s) => s.features);
  const review = useEntranceStore((s) => s.review);
  const setReview = useEntranceStore((s) => s.setReview);
  const setHovered = useEntranceStore((s) => s.setHovered);
  const hovered = useEntranceStore((s) => s.hovered);

  function approve(indexes: readonly number[]) {
    if (!review) return;
    session.graph.approveEntrances(indexes.flatMap((i) => suggestions[i] ?? []));
    const rest = suggestions.filter((_, i) => !indexes.includes(i));
    setReview(
      rest.length || review.plan.unreachable.length
        ? { ...review, plan: { ...review.plan, suggestions: rest } }
        : null,
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold">Saran ({suggestions.length})</h3>
        {suggestions.length ? (
          <Button size="sm" variant="primary" onClick={() => approve(suggestions.map((_, i) => i))}>
            Setujui semua
          </Button>
        ) : null}
      </div>
      <ul className="grid gap-1" onMouseLeave={() => setHovered(null)}>
        {suggestions.map((s, i) => {
          const feature = features[s.featureId];
          if (!feature) return null;
          return (
            <li
              key={`${s.featureId}-${s.doorId ?? i}`}
              onMouseEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              className={cn(
                'flex items-center gap-2 rounded-sm',
                hovered === i && 'bg-signal-soft',
              )}
            >
              <FeatureButton
                feature={feature}
                label={label(feature)}
                detail={`${SOURCE_LABELS[s.source]} · ${meters.format(s.lengthM)} m`}
              />
              <Button size="sm" onClick={() => approve([i])}>
                Setujui
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Panel titik masuk: unit dan fasilitas yang belum terhubung ke jalur, dan saran titik masuk
 * otomatis yang bisa disetujui satu per satu atau sekaligus.
 */
export function EntrancesPanel({ session, canEdit }: { session: EditorSession; canEdit: boolean }) {
  const floorId = useEditorStore((s) => s.floorId);
  const features = useEditorStore((s) => s.features);
  const unlinked = useUnlinked();
  const label = useLabel(session.facilityTypes);
  const review = useEntranceStore((s) => s.review);
  const setReview = useEntranceStore((s) => s.setReview);
  const plan = review && review.floorId === floorId ? review.plan : null;
  const total = useMemo(
    () =>
      featureList(features).filter(
        (f) => f.properties.kind === 'unit' || f.properties.kind === 'facility',
      ).length,
    [features],
  );

  function suggest() {
    const state = useEditorStore.getState();
    if (!state.floorId) return;
    setReview({
      floorId: state.floorId,
      plan: suggestEntrances(featureList(state.features), state.graph, state.floorId),
    });
  }

  return (
    <section aria-label="Titik masuk" className="grid h-full min-h-0 grid-rows-[auto_1fr]">
      <div className="grid gap-2 p-3 pb-2">
        <p className="px-1 text-sm">
          {total === 0
            ? 'Belum ada unit atau fasilitas di lantai ini.'
            : unlinked.length === 0
              ? 'Semua unit dan fasilitas sudah terhubung ke jalur.'
              : `${unlinked.length} dari ${total} unit dan fasilitas belum terhubung ke jalur.`}
        </p>
        {canEdit && unlinked.length > 0 && !plan ? (
          <Button className="justify-self-start" onClick={suggest}>
            Hubungkan titik masuk
          </Button>
        ) : null}
        {plan ? (
          <Button variant="ghost" className="justify-self-start" onClick={() => setReview(null)}>
            Tutup saran
          </Button>
        ) : null}
      </div>
      <div className="grid min-h-0 content-start gap-4 overflow-y-auto px-3 pb-3">
        {plan?.suggestions.length ? (
          <SuggestionList suggestions={plan.suggestions} session={session} label={label} />
        ) : null}
        {plan?.unreachable.length ? (
          <div className="grid gap-1">
            <h3 className="font-bold">Belum bisa disarankan ({plan.unreachable.length})</h3>
            <ul className="grid gap-1">
              {plan.unreachable.map(({ featureId, reason }) => {
                const feature = features[featureId];
                return feature ? (
                  <li key={featureId} className="flex">
                    <FeatureButton
                      feature={feature}
                      label={label(feature)}
                      detail={REASON_LABELS[reason]}
                    />
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        ) : null}
        {!plan && unlinked.length ? (
          <div className="grid gap-1">
            <h3 className="font-bold">Belum terhubung ({unlinked.length})</h3>
            <ul className="grid gap-1">
              {unlinked.map((feature) => (
                <li key={feature.properties.id} className="flex">
                  <FeatureButton
                    feature={feature}
                    label={label(feature)}
                    detail={FEATURE_KIND_LABELS[feature.properties.kind]}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
