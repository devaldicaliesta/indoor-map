import type { Snapshot } from '@indoor/domain';
import { type CrowdArea, type MapInstance, setCrowd } from '@indoor/map-core';
import { useEffect, useMemo } from 'react';

/** Ruang di lantai yang tampil sebagai tempat orang berdiri (toko, zona, ruang tunggu). */
function crowdAreas(snapshot: Snapshot, floorIds: readonly string[]): CrowdArea[] {
  const visible = new Set(floorIds);
  return snapshot.features.features.flatMap((feature) => {
    const { kind, floorId } = feature.properties;
    if (kind !== 'unit' || !visible.has(floorId) || feature.geometry.type !== 'Polygon') return [];
    const ring = feature.geometry.coordinates[0];
    return ring ? [{ floorId, ring: ring as CrowdArea['ring'] }] : [];
  });
}

/**
 * Orang mini di lantai yang tampil (ilustrasi, bukan data pengunjung): berjalan di graf jalur,
 * berdiri mengobrol, atau berada di dalam ruang. Butuh graf jalur, jadi baru muncul setelah graf
 * termuat; benih id venue membuat lantai yang sama berisi orang yang sama.
 */
export function useCrowdMap(
  map: MapInstance | null,
  snapshot: Snapshot,
  routeSnapshot: Snapshot | null,
  floorIds: readonly string[],
  visible: boolean,
): void {
  const graph = routeSnapshot?.graph;
  const venueId = snapshot.venue.id;
  const areas = useMemo(() => crowdAreas(snapshot, floorIds), [snapshot, floorIds]);
  useEffect(() => {
    if (!map) return;
    setCrowd(
      map,
      visible && graph && graph.edges.length > 0 ? { graph, floorIds, seed: venueId, areas } : null,
    );
  }, [map, graph, venueId, floorIds, areas, visible]);
}
