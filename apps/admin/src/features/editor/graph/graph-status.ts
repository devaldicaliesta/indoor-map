import { isolatedNodeIds, type NavGraph, summarizeComponents, type VenueId } from '@indoor/domain';
import { closedElements } from '@indoor/routing';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useConnectors } from '../connectors/queries';
import { featureList, useEditorStore } from '../store/editor-store';
import { CLOSURE_REFRESH_MS, useCurrentClosures, useVenueGraph } from './graph-queries';

export interface GraphStatus {
  /** Node lantai ini yang tidak terhubung ke komponen terbesar graf venue. */
  isolated: ReadonlySet<string>;
  closedNodes: ReadonlySet<string>;
  closedEdges: ReadonlySet<string>;
}

const NONE: ReadonlySet<string> = new Set();
const NOTHING_CLOSED = { nodeIds: NONE, edgeIds: NONE };

/** Waktu sekarang yang diperbarui tiap `intervalMs`, untuk penutupan yang mulai atau berakhir. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Graf venue tanpa lantai yang sedang disunting; lantai itu dibaca dari store. */
export function otherFloors(venue: NavGraph, floorId: string): NavGraph {
  const keep = <T extends { floorId: string }>(items: Readonly<Record<string, T>>) =>
    Object.fromEntries(Object.entries(items).filter(([, item]) => item.floorId !== floorId));
  return { nodes: keep(venue.nodes), edges: keep(venue.edges) };
}

/** Node terisolasi (dihitung atas seluruh venue) dan elemen tertutup di lantai yang disunting. */
export function useGraphStatus(venueId: VenueId): GraphStatus {
  const floorId = useEditorStore((s) => s.floorId);
  const graph = useDeferredValue(useEditorStore((s) => s.graph));
  const features = useDeferredValue(useEditorStore((s) => s.features));
  const venueGraph = useVenueGraph(venueId, floorId).data;
  const connectors = useConnectors(venueId).data;
  const closures = useCurrentClosures(venueId).data;
  const now = useNow(CLOSURE_REFRESH_MS);

  // Lantai lain diringkas sekali per muat; setiap edit hanya menghitung lantai ini.
  const others = useMemo(
    () => (venueGraph && floorId ? summarizeComponents(otherFloors(venueGraph, floorId)) : null),
    [venueGraph, floorId],
  );
  const isolated = useMemo(
    () => (others && connectors ? isolatedNodeIds(graph, connectors, others) : NONE),
    [others, connectors, graph],
  );

  const closed = useMemo(() => {
    if (!closures?.length) return NOTHING_CLOSED;
    const areas = featureList(features).map((f) => ({
      id: f.properties.id,
      floorId: f.properties.floorId,
      geometry: f.geometry,
    }));
    return closedElements(graph, closures, { now, features: areas, connectors: connectors ?? [] });
  }, [closures, features, graph, connectors, now]);

  // Objek yang sama selama isinya sama, agar data graf di peta tidak dikirim ulang tiap render.
  return useMemo(
    () => ({ isolated, closedNodes: closed.nodeIds, closedEdges: closed.edgeIds }),
    [isolated, closed],
  );
}
