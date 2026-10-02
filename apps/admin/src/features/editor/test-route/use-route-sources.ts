import type { FloorFeature } from '@indoor/data';
import type {
  Building,
  Closure,
  Connector,
  Floor,
  InfoPoint,
  InstructionAction,
  InstructionText,
  Location,
  NavGraph,
  OriginPoint,
  VenueId,
} from '@indoor/domain';
import type { RouteDraft } from '@indoor/routing';
import { useDeferredValue, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLocations } from '../../locations/queries';
import { useConnectors, useVenueFloors } from '../connectors/queries';
import { useCurrentClosures, useVenueGraph } from '../graph/graph-queries';
import { otherFloors } from '../graph/graph-status';
import { featureList, useEditorStore } from '../store/editor-store';
import {
  useInfoPoints,
  useInstructionTemplates,
  useOriginPoints,
  useVenueFeatures,
} from './queries';

/** Data draft untuk uji rute, beserta nama dan teks yang dipakai panel. */
export interface RouteSources extends RouteDraft {
  floors: Floor[];
  buildings: Building[];
  graph: NavGraph;
  connectors: Connector[];
  features: FloorFeature[];
  locations: Location[];
  originPoints: OriginPoint[];
  infoPoints: InfoPoint[];
  closures: Closure[];
  templates: Record<InstructionAction, InstructionText>;
}

/**
 * Draft seluruh venue: lantai lain dari server (dimuat ulang setiap lantai berganti) dan lantai
 * yang sedang disunting dari store, sehingga perubahan yang belum tersimpan ikut diuji. `null`
 * selama ada yang belum dimuat.
 */
export function useRouteSources(venueId: VenueId): RouteSources | null {
  // Lantai, graf, dan fiturnya ditunda bersama: lantai yang lebih baru dari grafnya akan
  // membuang graf lantai baru dari data server tanpa menggantinya dengan isi store.
  const editing = useDeferredValue(
    useEditorStore(
      useShallow((s) => ({ floorId: s.floorId, graph: s.graph, features: s.features })),
    ),
  );
  const { floorId, graph: storeGraph, features: storeFeatures } = editing;
  const places = useVenueFloors(venueId).data;
  const venueGraph = useVenueGraph(venueId, floorId).data;
  const venueFeatures = useVenueFeatures(venueId, floorId).data;
  const connectors = useConnectors(venueId).data;
  const locations = useLocations(venueId).data;
  const originPoints = useOriginPoints(venueId).data;
  const infoPoints = useInfoPoints(venueId).data;
  const templates = useInstructionTemplates(venueId).data;
  const closures = useCurrentClosures(venueId).data;

  return useMemo(() => {
    if (
      !floorId ||
      !places ||
      !venueGraph ||
      !venueFeatures ||
      !connectors ||
      !locations ||
      !originPoints ||
      !infoPoints ||
      !templates ||
      !closures
    ) {
      return null;
    }
    const others = otherFloors(venueGraph, floorId);
    return {
      floors: places.floors,
      buildings: places.buildings,
      graph: {
        nodes: { ...others.nodes, ...storeGraph.nodes },
        edges: { ...others.edges, ...storeGraph.edges },
      },
      connectors,
      features: [
        ...venueFeatures.features.filter((f) => f.properties.floorId !== floorId),
        ...featureList(storeFeatures),
      ],
      locations,
      originPoints,
      infoPoints,
      closures,
      templates,
    };
  }, [
    floorId,
    places,
    venueGraph,
    venueFeatures,
    connectors,
    locations,
    originPoints,
    infoPoints,
    templates,
    closures,
    storeGraph,
    storeFeatures,
  ]);
}
