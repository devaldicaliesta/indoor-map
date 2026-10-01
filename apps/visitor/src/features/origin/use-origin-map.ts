import { type MapView, type Snapshot, visibleFloorIds } from '@indoor/domain';
import {
  type LngLat,
  type MapInstance,
  prefersReducedMotion,
  setOriginMarkers,
} from '@indoor/map-core';
import { useEffect, useMemo, useRef } from 'react';
import { snapHeight } from '../../components/sheet-snap';
import { type CameraPadding, MAP_GAP_PX } from '../map/camera';
import { useExplore, useExploreStore } from '../search/explore-context';
import { originView } from './origin-model';

/** Zoom saat berpusat di titik asal: cukup dekat untuk mengenali ruang di sekitarnya. */
const ORIGIN_ZOOM = 19.5;

interface OriginMapOptions {
  map: MapInstance | null;
  snapshot: Snapshot;
  view: MapView;
  setView: (view: MapView) => void;
  padding: CameraPadding;
  isDesktop: boolean;
}

/**
 * Penanda "Anda di sini" (dengan arah hadap bila dari QR) di lantai titik asal, dan kamera yang
 * berpindah ke lantai dan posisinya sekali setiap titik asal ditentukan, termasuk saat Visitor
 * dibuka dari QR.
 */
export function useOriginMap({
  map,
  snapshot,
  view,
  setView,
  padding,
  isDesktop,
}: OriginMapOptions) {
  const { index, store } = useExplore();
  const origin = useExploreStore((s) => s.origin);
  const originSeq = useExploreStore((s) => s.originSeq);
  const current = useMemo(
    () => (origin ? originView(snapshot, index, origin) : null),
    [snapshot, index, origin],
  );
  const latest = useRef({ view, setView, padding, isDesktop });
  latest.current = { view, setView, padding, isDesktop };

  useEffect(() => {
    if (!map) return;
    const shown = view.floorId ? visibleFloorIds(snapshot, view.floorId) : [];
    setOriginMarkers(
      map,
      current && shown.includes(current.floorId)
        ? [
            {
              id: 'origin',
              position: current.position as LngLat,
              headingDeg: current.headingDeg,
              selected: true,
            },
          ]
        : [],
    );
  }, [map, snapshot, view.floorId, current]);

  // `originSeq` 0 = titik asal dari QR saat dibuka; selebihnya pilihan pengunjung.
  const centered = useRef(-1);
  useEffect(() => {
    if (!map || !current || centered.current === originSeq) return;
    centered.current = originSeq;
    const { view: shown, setView: apply, padding: edges, isDesktop: desktop } = latest.current;
    // Di HP tepi bawah = tinggi sheet setelah titik asal dipilih, agar penanda tidak tertutup.
    const sheet = store.getState().sheetSnap;
    const bottom = desktop ? edges.bottom : snapHeight(sheet, window.innerHeight) + MAP_GAP_PX;
    const buildingId = index.floors.get(current.floorId)?.buildingId ?? null;
    if (shown.floorId !== current.floorId) apply({ buildingId, floorId: current.floorId });
    map.easeTo({
      center: current.position as LngLat,
      zoom: Math.max(map.getZoom(), ORIGIN_ZOOM),
      // Arah hadap QR diputar ke atas layar, agar "depan" pemindai sama dengan depan di peta.
      ...(current.headingDeg === null ? {} : { bearing: current.headingDeg }),
      padding: { ...edges, bottom },
      duration: prefersReducedMotion() ? 0 : 300,
    });
  }, [map, current, originSeq, index, store]);
}
