import {
  type BrowseHighlight,
  featuresOnFloors,
  hitTarget,
  type MapView,
  markedFloorIds,
  targetHighlight,
  targetView,
  visibleFloorIds,
} from '@indoor/domain';
import {
  FOCUS_MIN_ZOOM,
  featureBounds,
  hitAt,
  type MapInstance,
  setHighlight,
} from '@indoor/map-core';
import { useEffect, useMemo, useRef } from 'react';
import { selectScreen, useBrowseStore } from '../search/browse-store';
import { useVenue } from '../venue/venue-context';
import { type CameraPadding, moveCamera } from './camera';

const NO_HIGHLIGHT: BrowseHighlight = { featureIds: [], labelIds: [] };

type Point = { x: number; y: number };

/**
 * Peta mengikuti panel: yang sedang dibuka disorot (lantainya diberi penanda), mengetuk unit
 * atau fasilitas membuka detailnya, dan membuka dari daftar memindah lantai lalu membingkai
 * targetnya.
 */
export function useMapBrowse({
  map,
  view,
  setView,
  focusPadding,
}: {
  map: MapInstance | null;
  view: MapView;
  setView: (view: MapView) => void;
  /** Ruang tepi peta yang tertutup kontrol, header, atau bottom sheet saat membingkai. */
  focusPadding: () => CameraPadding;
}): BrowseHighlight & { markedFloorIds: string[] } {
  const { snapshot, lookup } = useVenue();
  const screen = useBrowseStore(selectScreen);
  const focus = useBrowseStore((state) => state.focus);
  const openFromMap = useBrowseStore((state) => state.openFromMap);
  // Dibaca saat permintaan kamera datang; mengganti lantai sendiri tidak memicu kamera.
  const latest = useRef({ view, focusPadding });
  latest.current = { view, focusPadding };

  const highlight = useMemo(
    () => (!screen || screen.kind === 'directory' ? NO_HIGHLIGHT : targetHighlight(lookup, screen)),
    [lookup, screen],
  );
  const marked = useMemo(
    () => markedFloorIds(lookup, highlight.featureIds, view.buildingId),
    [lookup, highlight, view.buildingId],
  );

  useEffect(() => {
    if (map) setHighlight(map, highlight.featureIds);
  }, [map, highlight]);

  useEffect(() => {
    if (!map) return;
    const targetAt = (point: Point) => {
      const hit = hitAt(map, point);
      return hit ? hitTarget(lookup, hit) : null;
    };
    const onClick = (event: { point: Point }) => {
      const target = targetAt(event.point);
      if (target) openFromMap(target);
    };
    const onMove = (event: { point: Point }) => {
      map.getCanvas().style.cursor = targetAt(event.point) ? 'pointer' : '';
    };
    map.on('click', onClick);
    map.on('mousemove', onMove);
    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMove);
    };
  }, [map, lookup, openFromMap]);

  useEffect(() => {
    if (!map || !focus) return;
    const current = latest.current.view;
    const next = targetView(lookup, focus.target, current);
    if (next) setView(next);
    const floorId = (next ?? current).floorId;
    const floors = floorId ? visibleFloorIds(snapshot, floorId) : [];
    const features = featuresOnFloors(
      lookup,
      targetHighlight(lookup, focus.target).featureIds,
      floors,
    );
    const bounds = featureBounds({ type: 'FeatureCollection', features });
    if (!bounds) return;
    moveCamera(
      map,
      { kind: 'bounds', bounds },
      {
        animate: true,
        padding: latest.current.focusPadding(),
        maxZoom: Math.max(map.getZoom(), FOCUS_MIN_ZOOM),
      },
    );
  }, [map, focus, lookup, snapshot, setView]);

  return { ...highlight, markedFloorIds: marked };
}
