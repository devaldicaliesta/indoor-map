import type { ExploreTarget, Snapshot, SnapshotIndex, SnapshotLanguage } from '@indoor/domain';
import {
  instructionText,
  planRoute,
  type RouteClosure,
  type RouteGraph,
  type RoutePlace,
  type RoutePlan,
  type RouteStep,
} from '@indoor/routing';
import { placeOfTarget } from '../origin/origin-model';

/**
 * Rute dari titik asal ke tujuan di perangkat, dengan fungsi yang sama dengan uji rute Admin
 * sehingga hasilnya sama untuk asal, tujuan, dan mode yang sama.
 */
export function visitorRoute(
  graph: RouteGraph,
  snapshot: Snapshot,
  origin: RoutePlace,
  destination: ExploreTarget,
  options: { accessible: boolean; closures?: readonly RouteClosure[] },
): RoutePlan {
  // Server hanya mengirim penutupan yang sedang berlaku, jadi semuanya dianggap berlaku sekarang.
  return planRoute(graph, snapshot, origin, placeOfTarget(destination), {
    accessible: options.accessible,
    closures: options.closures ?? [],
  });
}

/** Teks setiap langkah dari template venue dalam bahasa tampilan. */
export function stepTexts(
  steps: readonly RouteStep[],
  snapshot: Snapshot,
  language: SnapshotLanguage,
  names: { origin: string; destination: string },
): string[] {
  const context = {
    templates: snapshot.instructionTemplates,
    language,
    floors: snapshot.floors,
    buildings: snapshot.buildings,
    ...names,
  };
  return steps.map((step) => instructionText(step, context));
}

export type RouteFailure = 'closed' | 'accessible' | 'origin' | 'destination' | 'no_path';

/** Jenis pesan gagal; penutupan disebut terpisah karena sifatnya sementara. */
export function routeFailure(plan: Extract<RoutePlan, { ok: false }>): RouteFailure {
  if (plan.reason === 'closed' || plan.blockingClosureIds.length > 0) return 'closed';
  switch (plan.reason) {
    case 'accessible_blocked':
      return 'accessible';
    case 'origin_invalid':
    case 'origin_unknown':
      return 'origin';
    case 'destination_invalid':
    case 'destination_unknown':
      return 'destination';
    default:
      return 'no_path';
  }
}

/** Sasaran detail dari titik asal, untuk menukar asal dan tujuan; `null` untuk QR atau titik. */
export function targetOfPlace(index: SnapshotIndex, place: RoutePlace): ExploreTarget | null {
  if (place.kind === 'location') return { kind: 'location', id: place.locationId };
  if (place.kind !== 'feature') return null;
  const kind = index.features.get(place.featureId)?.properties.kind;
  if (kind === 'unit') return { kind: 'unit', id: place.featureId };
  return kind === 'facility' ? { kind: 'facility', id: place.featureId } : null;
}

/** Lantai yang dilewati rute, berurutan tanpa pengulangan berturut-turut, untuk chip ringkasan. */
export function routeFloors(steps: readonly RouteStep[]): string[] {
  const floors: string[] = [];
  for (const step of steps) if (floors.at(-1) !== step.floorId) floors.push(step.floorId);
  return floors;
}
