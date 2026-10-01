import {
  addEntrance,
  firstPosition,
  inside,
  linkTargets,
  nearestOnGraph,
  nearestOnOutline,
  nearestOutlineToGraph,
  type Outline,
  outlineOf,
} from './entrance-links';
import type { MapFeatureProperties } from './feature';
import type { Geometry, Position } from './geometry';
import { Draft, distance, EMPTY_PATCH, type GraphPatch, planeAt, type XY } from './graph-draft';
import { edgeLengthM, type NavGraph } from './nav-graph';

/** Titik masuk yang jalur terdekatnya lebih jauh dari ini tidak disarankan; gambar jalurnya dulu. */
export const MAX_ENTRANCE_LINK_M = 15;
/** Pintu yang berjarak sampai segini dari tepi unit dianggap pintu unit itu. */
export const DOOR_ON_UNIT_M = 1;

export interface EntranceFeature {
  geometry: Geometry;
  properties: Pick<MapFeatureProperties, 'id' | 'kind' | 'floorId'>;
}

/** Asal posisi titik masuk: pintu, tepi unit yang terdekat ke jalur, atau titik fasilitas. */
export type EntranceSource = 'door' | 'edge' | 'point';

export interface EntranceSuggestion {
  featureId: string;
  /** Posisi node titik masuk. */
  position: Position;
  /** Titik di jalur yang disambung (node yang ada atau titik di edge). */
  attach: Position;
  lengthM: number;
  source: EntranceSource;
  doorId: string | null;
}

export type UnreachableReason = 'no_path' | 'too_far';

export interface EntrancePlan {
  suggestions: EntranceSuggestion[];
  /** Unit dan fasilitas tanpa titik masuk yang belum bisa disarankan. */
  unreachable: { featureId: string; reason: UnreachableReason }[];
}

const isTarget = (feature: EntranceFeature) =>
  feature.properties.kind === 'unit' || feature.properties.kind === 'facility';

/** Unit dan fasilitas yang belum punya titik masuk (node yang melayani fitur itu). */
export function unlinkedFeatures<T extends EntranceFeature>(
  features: readonly T[],
  graph: NavGraph,
): T[] {
  const served = new Set(
    Object.values(graph.nodes).flatMap((node) => (node.featureId ? [node.featureId] : [])),
  );
  return features.filter((f) => isTarget(f) && !served.has(f.properties.id));
}

interface Candidate {
  position: Position;
  from: XY;
  source: EntranceSource;
  doorId: string | null;
  attach?: XY;
}

/**
 * Saran titik masuk untuk unit dan fasilitas yang belum punya: dari setiap pintu unit (pintu yang
 * berjarak ≤ 1 m dari tepinya), atau dari tepi unit yang terdekat ke jalur bila unit tanpa pintu.
 * Fasilitas di dalam unit berpintu memakai pintu unit yang terdekat; fasilitas lain memakai
 * titiknya sendiri. Setiap saran menyambung ke titik jalur terdekat, maksimal 15 m.
 */
export function suggestEntrances(
  features: readonly EntranceFeature[],
  graph: NavGraph,
  floorId: string,
): EntrancePlan {
  const onFloor = features.filter((f) => f.properties.floorId === floorId);
  const pending = unlinkedFeatures(onFloor, graph);
  const origin = pending.map((f) => firstPosition(f.geometry)).find(Boolean);
  if (!origin) return { suggestions: [], unreachable: [] };
  const plane = planeAt(origin);
  const targets = linkTargets(new Draft(graph), plane, floorId);
  if (targets.nodes.length === 0) {
    return {
      suggestions: [],
      unreachable: pending.map((f) => ({ featureId: f.properties.id, reason: 'no_path' })),
    };
  }
  const doors = onFloor.flatMap((f) =>
    f.properties.kind === 'door' && f.geometry.type === 'Point'
      ? [
          {
            id: f.properties.id,
            position: f.geometry.coordinates,
            p: plane.toXY(f.geometry.coordinates),
          },
        ]
      : [],
  );
  const units = onFloor
    .filter((f) => f.properties.kind === 'unit')
    .map((f) => ({ id: f.properties.id, outline: outlineOf(f.geometry, plane) }));
  const doorsOf = (outline: Outline) =>
    doors.filter((door) => (nearestOnOutline(outline, door.p)?.d ?? Infinity) <= DOOR_ON_UNIT_M);
  const fromDoor = (door: (typeof doors)[number]): Candidate => ({
    position: door.position,
    from: door.p,
    source: 'door',
    doorId: door.id,
  });

  function candidatesFor(feature: EntranceFeature): Candidate[] {
    const { geometry } = feature;
    if (geometry.type === 'Point') {
      const p = plane.toXY(geometry.coordinates);
      const host = units.find((u) => inside(u.outline.rings, p));
      const hostDoors = host ? doorsOf(host.outline) : [];
      const nearest = [...hostDoors].sort((a, b) => distance(a.p, p) - distance(b.p, p))[0];
      if (nearest) return [fromDoor(nearest)];
      return [{ position: geometry.coordinates, from: p, source: 'point', doorId: null }];
    }
    const outline = outlineOf(geometry, plane);
    const own = doorsOf(outline);
    if (own.length) return own.map(fromDoor);
    const closest = nearestOutlineToGraph(outline, targets);
    if (!closest) return [];
    return [
      {
        position: plane.toPosition(closest.onUnit),
        from: closest.onUnit,
        source: 'edge',
        doorId: null,
        attach: closest.onGraph,
      },
    ];
  }

  const plan: EntrancePlan = { suggestions: [], unreachable: [] };
  for (const feature of pending) {
    const found = candidatesFor(feature).flatMap((candidate) => {
      const attach = candidate.attach ?? nearestOnGraph(targets, candidate.from)?.point;
      if (!attach || distance(attach, candidate.from) > MAX_ENTRANCE_LINK_M) return [];
      const position = candidate.position;
      const attachPosition = plane.toPosition(attach);
      return [
        {
          featureId: feature.properties.id,
          position,
          attach: attachPosition,
          lengthM: edgeLengthM(position, attachPosition),
          source: candidate.source,
          doorId: candidate.doorId,
        },
      ];
    });
    if (found.length) plan.suggestions.push(...found);
    else plan.unreachable.push({ featureId: feature.properties.id, reason: 'too_far' });
  }
  return plan;
}

/**
 * Menyetujui saran: setiap saran menjadi node titik masuk dengan satu edge ke jalur (edge jalur
 * dipecah di titik sambung). Saran yang titik sambungnya tidak lagi ada di graf dilewati.
 */
export function applyEntrances(
  graph: NavGraph,
  floorId: string,
  suggestions: readonly EntranceSuggestion[],
  newId: () => string,
): GraphPatch {
  const first = suggestions[0];
  if (!first) return EMPTY_PATCH;
  const draft = new Draft(graph);
  const plane = planeAt(first.attach);
  for (const s of suggestions) {
    addEntrance(draft, plane, floorId, s.featureId, s.position, plane.toXY(s.attach), newId);
  }
  return draft.patch();
}

/**
 * Titik masuk manual: unit disambung dari titik tepinya yang terdekat ke titik jalur di dekat
 * `at` (yang diklik), fasilitas dari titiknya sendiri. `null` bila lantai belum punya jalur.
 */
export function linkEntrance(
  graph: NavGraph,
  floorId: string,
  feature: EntranceFeature,
  at: Position,
  newId: () => string,
): GraphPatch | null {
  const draft = new Draft(graph);
  const plane = planeAt(at);
  const target = nearestOnGraph(linkTargets(draft, plane, floorId), plane.toXY(at));
  if (!target) return null;
  const { geometry } = feature;
  let position: Position | null = null;
  if (geometry.type === 'Point') position = geometry.coordinates;
  else {
    const edge = nearestOnOutline(outlineOf(geometry, plane), target.point);
    if (edge) position = plane.toPosition(edge.point);
  }
  if (!position) return null;
  const added = addEntrance(
    draft,
    plane,
    floorId,
    feature.properties.id,
    position,
    target.point,
    newId,
  );
  return added ? draft.patch() : null;
}

/**
 * Titik masuk milik fitur yang dihapus ikut dihapus (beserta edge sambungnya), agar tidak ada node
 * yang merujuk fitur yang sudah tidak ada.
 */
export function removeEntrancesOf(graph: NavGraph, featureIds: readonly string[]): GraphPatch {
  const removed = new Set(featureIds);
  const draft = new Draft(graph);
  for (const node of Object.values(graph.nodes)) {
    if (node.role !== 'entrance' || !node.featureId || !removed.has(node.featureId)) continue;
    const neighbours = draft.edgesAt(node.id).map((e) => (e.from === node.id ? e.to : e.from));
    for (const edge of draft.edgesAt(node.id)) draft.dropEdge(edge.id);
    draft.dropNode(node.id);
    for (const id of neighbours) draft.dropIfStray(id);
  }
  return draft.patch();
}
