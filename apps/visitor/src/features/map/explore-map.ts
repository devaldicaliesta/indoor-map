import {
  type ExploreTarget,
  floorsShowing,
  type MapView,
  type Snapshot,
  type SnapshotIndex,
  selectionHighlight,
  targetOfFeature,
  viewShowing,
  visibleFloorIds,
} from '@indoor/domain';
import {
  createTapInteractions,
  featureBounds,
  type MapInstance,
  type MapPick,
  setHighlight,
} from '@indoor/map-core';
import { useEffect, useMemo, useRef } from 'react';
import { snapHeight } from '../../components/sheet-snap';
import { useExplore, useExploreStore } from '../search/explore-context';
import { type ExploreState, selectionOf } from '../search/explore-store';
import { type CameraPadding, focusCamera, MAP_GAP_PX } from './camera';

/** Label lokasi/fasilitas, atau unit/fasilitas di lantai, yang membuka detail saat diketuk. */
export function targetOfPick(index: SnapshotIndex, pick: MapPick): ExploreTarget | null {
  if (pick.layer === 'floor') return targetOfFeature(index, pick.id);
  if (pick.kind === 'location') {
    return index.locations.has(pick.id) ? { kind: 'location', id: pick.id } : null;
  }
  return index.features.has(pick.id) ? { kind: 'facility', id: pick.id } : null;
}

/** Batas fitur sorotan pada lantai yang digambar, untuk membingkai kamera. */
export function highlightBounds(
  index: SnapshotIndex,
  featureIds: readonly string[],
  floorIds: readonly string[],
) {
  const floors = new Set(floorIds);
  return featureBounds({
    type: 'FeatureCollection',
    features: featureIds.flatMap((id) => {
      const feature = index.features.get(id);
      return feature && floors.has(feature.properties.floorId) ? [feature] : [];
    }),
  });
}

interface ExploreMapOptions {
  map: MapInstance | null;
  snapshot: Snapshot;
  view: MapView;
  setView: (view: MapView) => void;
  /** Ruang tepi peta yang tertutup kontrol; di HP bagian bawahnya diganti tinggi sheet. */
  padding: CameraPadding;
  isDesktop: boolean;
}

/**
 * Peta mengikuti pilihan pengunjung: pilihan disorot dan labelnya didahulukan, lantai yang
 * memuatnya diberi penanda, kamera berpindah sekali per pilihan, dan mengetuk unit atau fasilitas
 * membuka detailnya.
 */
export function useExploreMap({
  map,
  snapshot,
  view,
  setView,
  padding,
  isDesktop,
}: ExploreMapOptions) {
  const { index, store } = useExplore();
  const selection = useExploreStore(selectionOf);
  const highlight = useMemo(
    () => selectionHighlight(snapshot, index, selection),
    [snapshot, index, selection],
  );
  const latest = useRef({ view, padding, isDesktop, setView });
  latest.current = { view, padding, isDesktop, setView };

  useEffect(() => {
    if (map) setHighlight(map, highlight.featureIds);
  }, [map, highlight]);

  useEffect(() => {
    if (!map) return;
    function focus(state: ExploreState) {
      const { view: current, padding: base, isDesktop: desktop, setView: apply } = latest.current;
      const target = selectionHighlight(snapshot, index, selectionOf(state));
      const next = viewShowing(
        snapshot,
        index,
        current,
        target.featureIds,
        target.preferredFloorId,
      );
      if (!next?.floorId || !map) return;
      if (next.floorId !== current.floorId || next.buildingId !== current.buildingId) apply(next);
      const bounds = highlightBounds(
        index,
        target.featureIds,
        visibleFloorIds(snapshot, next.floorId),
      );
      if (!bounds) return;
      // Sheet penuh diturunkan ke setengah saat detail dibuka; kamera memakai tinggi akhirnya.
      const sheet = state.sheetSnap === 'full' ? 'half' : state.sheetSnap;
      const bottom = desktop ? base.bottom : snapHeight(sheet, window.innerHeight) + MAP_GAP_PX;
      focusCamera(map, bounds, state.focus.mode, { ...base, bottom });
    }
    return store.subscribe((state, previous) => {
      if (state.focus.seq !== previous.focus.seq) focus(state);
    });
  }, [map, snapshot, index, store]);

  useEffect(() => {
    if (!map) return;
    const taps = createTapInteractions(map, {
      isTarget: (pick) => targetOfPick(index, pick) !== null,
      onTap: (pick) => {
        const target = pick ? targetOfPick(index, pick) : null;
        const state = store.getState();
        if (target) state.openDetail(target, 'pan');
        else if (state.detail) state.closeDetail();
      },
    });
    return () => taps.destroy();
  }, [map, index, store]);

  const markedFloors = useMemo(
    () =>
      view.buildingId ? floorsShowing(snapshot, index, view.buildingId, highlight.featureIds) : [],
    [snapshot, index, view.buildingId, highlight],
  );
  return { labelIds: highlight.labelIds, markedFloors };
}
