import type { FloorId, NavGraph, OriginPoint, Position } from '@indoor/domain';
import {
  createMap,
  featureBounds,
  type LngLat,
  type MapInstance,
  type OriginMarker,
  setFloorData,
  setGraphData,
  setOriginMarkers,
} from '@indoor/map-core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { data } from '../../app/data-client';

function floorGraph(graph: NavGraph | undefined, floorId: string) {
  const nodes = Object.values(graph?.nodes ?? {}).filter((n) => n.floorId === floorId);
  const at = new Map(nodes.map((n) => [n.id, n.coordinates as LngLat]));
  const edges = Object.values(graph?.edges ?? {}).flatMap((edge) => {
    const from = at.get(edge.from);
    const to = at.get(edge.to);
    return edge.floorId === floorId && from && to
      ? [{ id: edge.id, from, to, accessible: edge.accessible }]
      : [];
  });
  return {
    nodes: nodes.map((n) => ({ id: n.id, coordinates: n.coordinates as LngLat, role: n.role })),
    edges,
  };
}

/**
 * Peta lantai untuk meletakkan titik asal: fitur dan jalur tersimpan lantai itu, titik asal lain
 * di lantai yang sama, dan titik yang sedang diatur beserta arah hadapnya. Klik = pindah posisi.
 */
export function OriginMap({
  floorId,
  graph,
  others,
  position,
  headingDeg,
  onPick,
}: {
  floorId: string;
  graph: NavGraph | undefined;
  others: readonly OriginPoint[];
  position: Position | null;
  headingDeg: number;
  onPick: (position: Position) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const features = useQuery({
    queryKey: ['origin-points', 'floor-features', floorId],
    queryFn: () => data.features.listByFloor(floorId as FloorId),
  }).data;

  useEffect(() => {
    if (!container.current) return;
    const instance = createMap(container.current, { center: [106.8272, -6.1754], zoom: 18 });
    instance.on('click', (e) => onPickRef.current([e.lngLat.lng, e.lngLat.lat]));
    instance.once('load', () => setMap(instance));
    return () => instance.remove();
  }, []);

  const framed = useRef<string | null>(null);
  useEffect(() => {
    if (!map || !features) return;
    setFloorData(map, features);
    if (framed.current === floorId) return;
    framed.current = floorId;
    const bounds = featureBounds(features);
    if (position) map.jumpTo({ center: position as LngLat, zoom: 20 });
    else if (bounds) map.fitBounds(bounds, { padding: 32, duration: 0, maxZoom: 21 });
  }, [map, features, floorId, position]);

  const view = useMemo(() => floorGraph(graph, floorId), [graph, floorId]);
  useEffect(() => {
    if (map) setGraphData(map, view.nodes, view.edges);
  }, [map, view]);

  useEffect(() => {
    if (!map) return;
    const markers: OriginMarker[] = others
      .filter((o) => o.floorId === floorId)
      .map((o) => ({
        id: o.id,
        position: o.coordinates as LngLat,
        headingDeg: o.headingDeg,
        selected: false,
      }));
    if (position) {
      markers.push({ id: 'baru', position: position as LngLat, headingDeg, selected: true });
    }
    setOriginMarkers(map, markers);
  }, [map, others, floorId, position, headingDeg]);

  return (
    <div
      ref={container}
      className="h-80 w-full cursor-crosshair rounded-sm border border-line"
      data-testid="origin-map"
    />
  );
}
