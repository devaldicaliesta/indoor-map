import type { SnapshotConnectorKind } from '@indoor/domain';
import type { RouteLeg } from './types';

export const WALK_SPEED_MPS = 1.2;
export const ACCESSIBLE_WALK_SPEED_MPS = 0.8;

export const CONNECTOR_SECONDS: Readonly<
  Record<SnapshotConnectorKind, { readonly base: number; readonly perFloor: number }>
> = {
  elevator: { base: 45, perFloor: 5 },
  escalator: { base: 5, perFloor: 25 },
  stairs: { base: 0, perFloor: 20 },
  building_door: { base: 10, perFloor: 0 },
};

export interface DurationOptions {
  accessible: boolean;
  levelOf: (floorId: string) => number;
}

export function connectorSeconds(kind: SnapshotConnectorKind, floors: number): number {
  const time = CONNECTOR_SECONDS[kind];
  return time.base + time.perFloor * Math.abs(floors);
}

export function routeSeconds(legs: readonly RouteLeg[], options: DurationOptions): number {
  const speed = options.accessible ? ACCESSIBLE_WALK_SPEED_MPS : WALK_SPEED_MPS;
  return legs.reduce((total, leg) => {
    if (leg.kind === 'walk') return total + leg.distanceM / speed;
    const floors = options.levelOf(leg.toFloorId) - options.levelOf(leg.fromFloorId);
    return total + connectorSeconds(leg.connectorKind, floors);
  }, 0);
}

export function routeMinutes(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / 60));
}
