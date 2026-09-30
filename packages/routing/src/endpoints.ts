import { EARTH_RADIUS_M, type SnapshotPosition } from '@indoor/domain';
import type { RouteGraph } from './graph';
import type { RoutePoint } from './types';

const RAD = Math.PI / 180;

/** Titik bebas yang ditempelkan ke edge jalur terdekat. */
export interface Snap {
  point: SnapshotPosition;
  projection: SnapshotPosition;
  /** Indeks edge di `graph.edge*`. */
  edge: number;
  /** Posisi proyeksi di sepanjang edge: 0 = `edgeFrom`, 1 = `edgeTo`. */
  t: number;
  /** Jarak titik ke proyeksinya (m). */
  offsetM: number;
}

/** Ujung rute dalam bentuk node graf beserta biaya dari/ke titik aslinya. */
export interface ResolvedEnd {
  entries: { node: number; cost: number }[];
  snap: Snap | null;
}

/**
 * Proyeksi titik ke edge terdekat di lantainya, dalam bidang datar lokal di sekitar titik
 * (galat terabaikan pada skala gedung). Edge yang tidak lolos `allowEdge` dilewati.
 */
export function snapToEdge(
  graph: RouteGraph,
  lng: number,
  lat: number,
  floorId: string,
  allowEdge: (edge: number) => boolean,
): Snap | null {
  const floor = graph.floorIds.indexOf(floorId);
  if (floor < 0) return null;
  const kx = RAD * EARTH_RADIUS_M * Math.cos(lat * RAD);
  const ky = RAD * EARTH_RADIUS_M;
  let best: Snap | null = null;
  for (let e = 0; e < graph.edgeIds.length; e++) {
    const a = graph.edgeFrom[e] ?? 0;
    const b = graph.edgeTo[e] ?? 0;
    if (graph.floor[a] !== floor || !allowEdge(e)) continue;
    const ax = ((graph.lng[a] ?? 0) - lng) * kx;
    const ay = ((graph.lat[a] ?? 0) - lat) * ky;
    const dx = ((graph.lng[b] ?? 0) - lng) * kx - ax;
    const dy = ((graph.lat[b] ?? 0) - lat) * ky - ay;
    const length2 = dx * dx + dy * dy;
    const t = length2 > 0 ? Math.min(1, Math.max(0, -(ax * dx + ay * dy) / length2)) : 0;
    const px = ax + t * dx;
    const py = ay + t * dy;
    const offsetM = Math.hypot(px, py);
    if (!best || offsetM < best.offsetM) {
      best = {
        point: [lng, lat],
        projection: [lng + px / kx, lat + py / ky],
        edge: e,
        t,
        offsetM,
      };
    }
  }
  return best;
}

/** `null` bila ujung tidak bisa dipakai (node tidak ada, lantai tanpa jalur yang boleh dilewati). */
export function resolveEnd(
  graph: RouteGraph,
  point: RoutePoint,
  allowEdge: (edge: number) => boolean,
): ResolvedEnd | null {
  if (point.kind === 'point') {
    const snap = snapToEdge(graph, point.lng, point.lat, point.floorId, allowEdge);
    if (!snap) return null;
    const cost = graph.edgeCost[snap.edge] ?? 0;
    return {
      snap,
      entries: [
        { node: graph.edgeFrom[snap.edge] ?? 0, cost: snap.offsetM + snap.t * cost },
        { node: graph.edgeTo[snap.edge] ?? 0, cost: snap.offsetM + (1 - snap.t) * cost },
      ],
    };
  }
  const ids = point.kind === 'node' ? [point.nodeId] : point.nodeIds;
  const entries = ids.flatMap((id) => {
    const node = graph.nodeIndex.get(id);
    return node === undefined ? [] : [{ node, cost: 0 }];
  });
  return entries.length ? { entries, snap: null } : null;
}

/**
 * Asal dan tujuan yang menempel di edge yang sama bisa langsung berjalan di sepanjang edge itu,
 * tanpa lewat node ujungnya. Mengembalikan biayanya, atau `null` bila tidak berlaku.
 */
export function directCost(graph: RouteGraph, from: ResolvedEnd, to: ResolvedEnd): number | null {
  if (!from.snap || !to.snap || from.snap.edge !== to.snap.edge) return null;
  const along = Math.abs(from.snap.t - to.snap.t) * (graph.edgeCost[from.snap.edge] ?? 0);
  return from.snap.offsetM + along + to.snap.offsetM;
}
