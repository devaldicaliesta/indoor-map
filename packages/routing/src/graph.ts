import type {
  SnapshotConnectorKind,
  SnapshotFeature,
  SnapshotFloor,
  SnapshotGraph,
  SnapshotPosition,
} from '@indoor/domain';
import { ARC_ACCESSIBLE, type ArcDraft, nodeDistanceM } from './arcs';
import { connectorArcs } from './connectors';

/**
 * Graf rute dalam array bertipe. Adjacency berbentuk CSR: arc keluar node `i` ada di indeks
 * `offsets[i]` … `offsets[i + 1] - 1`. Setiap edge jalur menjadi dua arc (dua arah); konektor
 * menjadi arc antar-pemberhentian.
 */
export interface RouteGraph {
  readonly nodeIds: readonly string[];
  readonly nodeIndex: ReadonlyMap<string, number>;
  readonly lng: Float64Array;
  readonly lat: Float64Array;
  /** Level lantai node (dari `floors`), untuk konektor dan heuristik. */
  readonly level: Float64Array;
  /** Indeks lantai node di `floorIds`. */
  readonly floor: Int32Array;
  readonly floorIds: readonly string[];
  /** Id fitur yang dilayani node (titik masuk unit/fasilitas), `null` untuk node jalur biasa. */
  readonly featureIds: readonly (string | null)[];

  readonly offsets: Int32Array;
  readonly arcFrom: Int32Array;
  readonly arcTo: Int32Array;
  /** Bobot dalam meter ekuivalen yang diminimalkan. */
  readonly arcCost: Float64Array;
  /** Jarak berjalan (m); 0 untuk konektor. */
  readonly arcLength: Float64Array;
  readonly arcFlags: Uint8Array;
  /** Indeks edge jalur (`edge*`) atau konektor (`connector*`, bila `ARC_CONNECTOR`) asal arc. */
  readonly arcSource: Int32Array;

  /** Edge jalur yang sah (kedua node ada dan di lantai yang sama), sekali per edge. */
  readonly edgeIds: readonly string[];
  readonly edgeFrom: Int32Array;
  readonly edgeTo: Int32Array;
  readonly edgeCost: Float64Array;
  readonly edgeAccessible: Uint8Array;

  readonly connectorIds: readonly string[];
  readonly connectorKinds: readonly SnapshotConnectorKind[];
  /** Poligon fitur per id untuk penutupan area (node di dalamnya ikut tertutup). */
  readonly areas: ReadonlyMap<string, RouteArea>;
  /**
   * Bobot tetap terkecil per satu level lantai di antara konektor graf. Heuristik A* memakai
   * `costPerLevel × selisih level` agar tetap tidak melebihi biaya sebenarnya.
   */
  readonly costPerLevel: number;
}

export interface RouteArea {
  floor: number;
  /** Poligon (cincin luar lalu lubang) fitur; MultiPolygon menjadi beberapa poligon. */
  polygons: readonly (readonly SnapshotPosition[])[][];
}

export interface BuildGraphOptions {
  /** Level tiap lantai; lantai yang tidak disebut dianggap level 0. */
  floors: readonly Pick<SnapshotFloor, 'id' | 'level'>[];
  /** Fitur peta; poligonnya dipakai penutupan area (misalnya koridor yang ditutup). */
  features?: readonly Pick<SnapshotFeature, 'id' | 'geometry' | 'properties'>[];
}

/**
 * Graf rute dari graf snapshot. Bobot edge jalur = panjang tercatat, tetapi tidak kurang dari
 * jarak lurus antar-node, sehingga heuristik jarak lurus A* tidak pernah melebihi biaya dan
 * hasilnya selalu terpendek walau panjang tercatat dibulatkan.
 */
export function buildGraph(source: SnapshotGraph, options: BuildGraphOptions): RouteGraph {
  const levels = new Map(options.floors.map((f) => [f.id, f.level]));
  const floorIds = options.floors.map((f) => f.id);
  const floorIndex = new Map(floorIds.map((id, i) => [id, i]));
  const n = source.nodes.length;
  const nodeIndex = new Map<string, number>();
  const lng = new Float64Array(n);
  const lat = new Float64Array(n);
  const level = new Float64Array(n);
  const floor = new Int32Array(n);
  source.nodes.forEach((node, i) => {
    nodeIndex.set(node.id, i);
    lng[i] = node.coordinates[0];
    lat[i] = node.coordinates[1];
    level[i] = levels.get(node.floorId) ?? 0;
    let f = floorIndex.get(node.floorId);
    if (f === undefined) {
      f = floorIds.length;
      floorIds.push(node.floorId);
      floorIndex.set(node.floorId, f);
    }
    floor[i] = f;
  });
  const nodes = { nodeIndex, lng, lat, level };

  const edgeIds: string[] = [];
  const edgeFrom: number[] = [];
  const edgeTo: number[] = [];
  const edgeCost: number[] = [];
  const edgeAccessible: number[] = [];
  const arcs: ArcDraft[] = [];
  for (const edge of source.edges) {
    const u = nodeIndex.get(edge.from);
    const v = nodeIndex.get(edge.to);
    if (u === undefined || v === undefined || u === v || floor[u] !== floor[v]) continue;
    const cost = Math.max(edge.lengthM, nodeDistanceM(nodes, u, v));
    const flags = edge.accessible ? ARC_ACCESSIBLE : 0;
    const k = edgeIds.length;
    edgeIds.push(edge.id);
    edgeFrom.push(u);
    edgeTo.push(v);
    edgeCost.push(cost);
    edgeAccessible.push(edge.accessible ? 1 : 0);
    arcs.push({ from: u, to: v, cost, length: cost, flags, source: k });
    arcs.push({ from: v, to: u, cost, length: cost, flags, source: k });
  }
  const connectors = connectorArcs(source, nodes);
  const areas = new Map<string, RouteArea>();
  for (const feature of options.features ?? []) {
    const floor = floorIndex.get(feature.properties.floorId);
    const { geometry } = feature;
    if (floor === undefined) continue;
    if (geometry.type === 'Polygon')
      areas.set(feature.id, { floor, polygons: [geometry.coordinates] });
    else if (geometry.type === 'MultiPolygon') {
      areas.set(feature.id, { floor, polygons: geometry.coordinates });
    }
  }
  arcs.push(...connectors.arcs);

  const m = arcs.length;
  const offsets = new Int32Array(n + 1);
  for (const arc of arcs) offsets[arc.from + 1] = (offsets[arc.from + 1] ?? 0) + 1;
  for (let i = 0; i < n; i++) offsets[i + 1] = (offsets[i + 1] ?? 0) + (offsets[i] ?? 0);
  const next = offsets.slice(0, n);
  const arcFrom = new Int32Array(m);
  const arcTo = new Int32Array(m);
  const arcCost = new Float64Array(m);
  const arcLength = new Float64Array(m);
  const arcFlags = new Uint8Array(m);
  const arcSource = new Int32Array(m);
  for (const arc of arcs) {
    const slot = next[arc.from] ?? 0;
    next[arc.from] = slot + 1;
    arcFrom[slot] = arc.from;
    arcTo[slot] = arc.to;
    arcCost[slot] = arc.cost;
    arcLength[slot] = arc.length;
    arcFlags[slot] = arc.flags;
    arcSource[slot] = arc.source;
  }

  return {
    nodeIds: source.nodes.map((node) => node.id),
    nodeIndex,
    lng,
    lat,
    level,
    floor,
    floorIds,
    featureIds: source.nodes.map((node) => node.featureId),
    offsets,
    arcFrom,
    arcTo,
    arcCost,
    arcLength,
    arcFlags,
    arcSource,
    edgeIds,
    edgeFrom: Int32Array.from(edgeFrom),
    edgeTo: Int32Array.from(edgeTo),
    edgeCost: Float64Array.from(edgeCost),
    edgeAccessible: Uint8Array.from(edgeAccessible),
    connectorIds: source.connectors.map((c) => c.id),
    connectorKinds: source.connectors.map((c) => c.kind),
    areas,
    costPerLevel: connectors.costPerLevel,
  };
}
