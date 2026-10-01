import type { SnapshotConnector, SnapshotGraph } from '@indoor/domain';
import {
  ARC_ACCESSIBLE,
  ARC_CONNECTOR,
  type ArcDraft,
  type ConnectorArcs,
  nodeDistanceM,
} from './arcs';
import { connectorCost } from './costs';

interface NodeArrays {
  readonly nodeIndex: ReadonlyMap<string, number>;
  readonly lng: Float64Array;
  readonly lat: Float64Array;
  readonly level: Float64Array;
}

/**
 * Arah perjalanan yang diizinkan: eskalator `up` hanya dari level rendah ke tinggi, `down`
 * sebaliknya, `both` dua arah; konektor lain selalu dua arah.
 */
export function connectorAllows(
  connector: Pick<SnapshotConnector, 'kind' | 'direction'>,
  fromLevel: number,
  toLevel: number,
): boolean {
  if (connector.kind !== 'escalator' || connector.direction === 'both') return true;
  if (connector.direction === 'up') return toLevel > fromLevel;
  if (connector.direction === 'down') return toLevel < fromLevel;
  return true;
}

/**
 * Arc konektor antar setiap pasang pemberhentian yang boleh dilalui: lift hanya menghubungkan
 * lantai yang dilayaninya, eskalator mengikuti arahnya, tangga dan pintu gedung dua arah. Bobot =
 * bobot tetap (`costs.ts`) + jarak horizontal antar-node pemberhentian, agar jarak lurus tetap
 * batas bawah biaya untuk heuristik A*.
 */
export function connectorArcs(graph: SnapshotGraph, nodes: NodeArrays): ConnectorArcs {
  const arcs: ArcDraft[] = [];
  let costPerLevel = Number.POSITIVE_INFINITY;
  graph.connectors.forEach((connector, source) => {
    const stops = connector.stops.flatMap((stop) => {
      const node = nodes.nodeIndex.get(stop.nodeId);
      return node === undefined ? [] : [node];
    });
    const flags = ARC_CONNECTOR | (connector.accessible ? ARC_ACCESSIBLE : 0);
    for (const from of stops) {
      for (const to of stops) {
        if (from === to) continue;
        const fromLevel = nodes.level[from] ?? 0;
        const toLevel = nodes.level[to] ?? 0;
        if (!connectorAllows(connector, fromLevel, toLevel)) continue;
        const floors = Math.abs(toLevel - fromLevel);
        const fixed = connectorCost(connector.kind, floors);
        if (floors > 0) costPerLevel = Math.min(costPerLevel, fixed / floors);
        arcs.push({
          from,
          to,
          cost: fixed + nodeDistanceM(nodes, from, to),
          length: 0,
          flags,
          source,
        });
      }
    }
  });
  return { arcs, costPerLevel: Number.isFinite(costPerLevel) ? costPerLevel : 0 };
}
