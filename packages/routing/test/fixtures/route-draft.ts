import type { SnapshotSource } from '@indoor/domain';
import type { RouteDraft } from '../../src';

/**
 * Data draft dalam bentuk yang dipegang editor Admin (graf berkunci id, lokasi dengan daftar unit),
 * dari sumber snapshot yang sama. Urutan sengaja dibalik agar pengurutan ikut teruji.
 */
export function draftOf(source: SnapshotSource): RouteDraft {
  const reversed = <T>(items: readonly T[]) => [...items].reverse();
  return {
    floors: source.floors.map(({ id, buildingId, level }) => ({ id, buildingId, level })),
    graph: {
      nodes: Object.fromEntries(reversed(source.graph.nodes).map((node) => [node.id, node])),
      edges: Object.fromEntries(reversed(source.graph.edges).map((edge) => [edge.id, edge])),
    },
    connectors: reversed(source.graph.connectors).map((connector) => ({
      ...connector,
      stops: [...connector.stops],
    })),
    features: reversed(source.features).map((feature) => ({
      geometry: feature.geometry,
      properties: { id: feature.id, kind: feature.kind, floorId: feature.floorId },
    })),
    locations: source.locations.map((location) => ({
      id: location.id,
      status: location.status,
      units: reversed(location.unitIds).map((featureId) => ({
        featureId,
        isPrimary: featureId === location.primaryUnitId,
      })),
    })),
    originPoints: reversed(source.originPoints),
    infoPoints: reversed(source.infoPoints).map(
      ({ id, code, name, floorId, coordinates, headingDeg, nodeId }) => ({
        id,
        code,
        name,
        floorId,
        coordinates,
        headingDeg,
        nodeId,
      }),
    ),
  };
}
