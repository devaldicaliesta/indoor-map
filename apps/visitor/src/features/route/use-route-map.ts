import {
  type MapView,
  type Snapshot,
  type SnapshotPosition,
  visibleFloorIds,
} from '@indoor/domain';
import { type LngLat, type MapInstance, type RouteView, setRoute } from '@indoor/map-core';
import { type RouteSuccess, routeOnFloor } from '@indoor/routing';
import { useEffect, useRef } from 'react';
import { snapHeight } from '../../components/sheet-snap';
import { type CameraPadding, focusCamera, MAP_GAP_PX } from '../map/camera';
import { useExplore, useExploreStore } from '../search/explore-context';
import { useRoutePlan } from './use-route-plan';

type Bounds = [[number, number], [number, number]];

/** Batas sekumpulan titik; `null` bila kosong. */
export function boundsOf(points: readonly SnapshotPosition[]): Bounds | null {
  if (points.length === 0) return null;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
}

/** Rute di semua lantai yang digambar bersama (lantai gedung dan Area Luar di lantai dasar). */
export function routeOnFloors(route: Pick<RouteSuccess, 'legs'>, floorIds: readonly string[]) {
  const parts = floorIds.map((floorId) => routeOnFloor(route, floorId));
  return {
    lines: parts.flatMap((p) => p.lines),
    origin: parts.find((p) => p.origin)?.origin ?? null,
    destination: parts.find((p) => p.destination)?.destination ?? null,
    transfers: parts.flatMap((p) => p.transfers),
  };
}

interface RouteMapOptions {
  map: MapInstance | null;
  snapshot: Snapshot;
  view: MapView;
  setView: (view: MapView) => void;
  padding: CameraPadding;
  isDesktop: boolean;
}

/**
 * Garis rute di lantai yang tampil beserta sorotan langkah aktif. Rute baru dibingkai di lantai
 * asalnya; di mode langkah peta berpindah ke lantai dan ruas langkah itu, termasuk setelah naik
 * atau turun lift.
 */
export function useRouteMap({ map, snapshot, view, setView, padding, isDesktop }: RouteMapOptions) {
  const { index, store } = useExplore();
  const plan = useRoutePlan();
  const activeStep = useExploreStore((s) => s.activeStep);
  const routeSeq = useExploreStore((s) => s.routeSeq);
  const latest = useRef({ view, setView, padding, isDesktop });
  latest.current = { view, setView, padding, isDesktop };

  useEffect(() => {
    if (!map) return;
    if (!plan?.ok || !view.floorId) {
      setRoute(map, null);
      return;
    }
    const shown = visibleFloorIds(snapshot, view.floorId);
    const step = activeStep === null ? undefined : plan.steps[activeStep];
    const drawn: RouteView = {
      ...routeOnFloors(plan.route, shown),
      active: step && shown.includes(step.floorId) ? step.coordinates : null,
    };
    setRoute(map, drawn);
  }, [map, snapshot, plan, view.floorId, activeStep]);

  /** Pindah ke lantai lalu bingkai titik-titiknya di area yang tidak tertutup panel. */
  function show(floorId: string, points: readonly SnapshotPosition[]) {
    const { view: current, setView: apply, padding: edges, isDesktop: desktop } = latest.current;
    if (!map) return;
    if (current.floorId !== floorId) {
      apply({ buildingId: index.floors.get(floorId)?.buildingId ?? null, floorId });
    }
    const bounds = boundsOf(points);
    if (!bounds) return;
    const sheet = store.getState().sheetSnap;
    const bottom = desktop ? edges.bottom : snapHeight(sheet, window.innerHeight) + MAP_GAP_PX;
    focusCamera(map, bounds, 'fit', { ...edges, bottom });
  }

  const framed = useRef(-1);
  useEffect(() => {
    if (!map || !plan?.ok || framed.current === routeSeq) return;
    framed.current = routeSeq;
    const floorId = plan.steps[0]?.floorId;
    if (!floorId) return;
    const part = routeOnFloors(plan.route, visibleFloorIds(snapshot, floorId));
    show(floorId, [
      ...part.lines.flat(),
      ...(part.origin ? [part.origin] : []),
      ...(part.destination ? [part.destination] : []),
    ]);
  });

  const stepShown = useRef<number | null>(null);
  useEffect(() => {
    if (activeStep === null) {
      stepShown.current = null;
      return;
    }
    if (!map || !plan?.ok || stepShown.current === activeStep) return;
    stepShown.current = activeStep;
    const step = plan.steps[activeStep];
    if (step) show(step.floorId, step.coordinates);
  });
}
