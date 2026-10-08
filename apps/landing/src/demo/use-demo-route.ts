import {
  type ExploreTarget,
  indexSnapshot,
  type Snapshot,
  selectionHighlight,
  visibleFloorIds,
} from '@indoor/domain';
import { createTapInteractions, type MapInstance, setHighlight, setRoute } from '@indoor/map-core';
import { buildRouteGraph, type RouteGraph } from '@indoor/routing';
import { useEffect, useMemo, useRef, useState } from 'react';
import { demoOrigin, demoRoute, routeFloorIds, routeViewOn, targetOfPick } from './demo-route';

/**
 * Ruang untuk kartu rute dan tombol peta (kanan): di layar lebar kartu ada di kiri bawah, di HP
 * kartu memenuhi bagian atas agar tidak menutup tombol 2D/3D.
 */
function routePadding(container: HTMLElement) {
  const wide = container.clientWidth >= 640;
  return wide
    ? { top: 48, bottom: 48, left: 360, right: 96 }
    : { top: 240, bottom: 40, left: 24, right: 72 };
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface DemoRouteOptions {
  map: MapInstance | null;
  snapshot: Snapshot;
  buildingId: string | null;
  floorIds: readonly string[];
  setFloorId: (floorId: string) => void;
}

/**
 * Klik lokasi di peta demo (atau pilih dari daftar) menyorotnya dan menggambar rute dari titik
 * asal venue, seperti Visitor tetapi tanpa panel detail.
 */
export function useDemoRoute({
  map,
  snapshot,
  buildingId,
  floorIds,
  setFloorId,
}: DemoRouteOptions) {
  const index = useMemo(() => indexSnapshot(snapshot), [snapshot]);
  const origin = useMemo(() => demoOrigin(snapshot), [snapshot]);
  const [target, setTarget] = useState<ExploreTarget | null>(null);
  // Graf baru dibangun saat rute pertama diminta agar peta tampil secepatnya.
  const graph = useRef<RouteGraph | null>(null);
  const plan = useMemo(() => {
    if (!origin || !target) return null;
    graph.current ??= buildRouteGraph(snapshot);
    return demoRoute(graph.current, snapshot, origin.place, target);
  }, [snapshot, origin, target]);

  useEffect(() => {
    if (!map) return;
    const taps = createTapInteractions(map, {
      isTarget: (pick) => targetOfPick(index, pick) !== null,
      onTap: (pick) => setTarget(pick ? targetOfPick(index, pick) : null),
    });
    return () => taps.destroy();
  }, [map, index]);

  useEffect(() => {
    if (!map) return;
    setHighlight(map, target ? selectionHighlight(snapshot, index, target).featureIds : []);
  }, [map, snapshot, index, target]);

  useEffect(() => {
    if (map) setRoute(map, plan?.ok ? routeViewOn(plan.route, floorIds) : null);
  }, [map, plan, floorIds]);

  // Rute baru dibuka di lantai asalnya dan dibingkai utuh di lantai itu.
  useEffect(() => {
    if (!map || !plan?.ok) return;
    const first = routeFloorIds(snapshot, buildingId, plan)[0];
    if (!first) return;
    setFloorId(first);
    const part = routeViewOn(plan.route, visibleFloorIds(snapshot, first));
    const points = [
      ...part.lines.flat(),
      ...(part.origin ? [part.origin] : []),
      ...(part.destination ? [part.destination] : []),
    ];
    if (points.length === 0) return;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    map.fitBounds(
      [
        [Math.min(...xs), Math.min(...ys)],
        [Math.max(...xs), Math.max(...ys)],
      ],
      {
        padding: routePadding(map.getContainer()),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        maxZoom: 19.5,
        duration: reducedMotion() ? 0 : 700,
      },
    );
  }, [map, snapshot, buildingId, plan, setFloorId]);

  return { index, origin, target, setTarget, plan };
}
