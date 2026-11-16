import { type LineString, LineStringSchema, type Polygon, PolygonSchema } from './geometry.ts';
import {
  openRing,
  type Pt,
  projector,
  ringSelfIntersects,
  signedArea,
} from './validation/planar.ts';

export const SCAN_SENSITIVITIES = ['low', 'medium', 'high'] as const;
export type ScanSensitivity = (typeof SCAN_SENSITIVITIES)[number];

export const SCAN_SENSITIVITY_LABELS: Record<ScanSensitivity, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
};

export const SCAN_MIN_ROOM_M2 = 1;
export const SCAN_MIN_WALL_M = 0.3;

export interface ScanObject {
  points: [number, number][];
  confidence: number;
}

export interface ScanResult {
  widthPx: number;
  heightPx: number;
  rooms: ScanObject[];
  walls: ScanObject[];
}

const isPositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

function readObject(value: unknown, minPoints: number): ScanObject | null {
  if (typeof value !== 'object' || value === null) return null;
  const { points, confidence } = value as Record<string, unknown>;
  if (!Array.isArray(points) || points.length < minPoints) return null;
  const valid = points.every(
    (p) =>
      Array.isArray(p) &&
      p.length === 2 &&
      p.every((n) => typeof n === 'number' && Number.isFinite(n)),
  );
  if (!valid || typeof confidence !== 'number' || !(confidence >= 0 && confidence <= 1)) {
    return null;
  }
  return { points: points as [number, number][], confidence };
}

export function readScanResult(value: unknown): ScanResult | null {
  if (typeof value !== 'object' || value === null) return null;
  const input = value as Record<string, unknown>;
  if (!isPositive(input.widthPx) || !isPositive(input.heightPx)) return null;
  if (!Array.isArray(input.rooms) || !Array.isArray(input.walls)) return null;
  const rooms = input.rooms.map((room) => readObject(room, 3));
  const walls = input.walls.map((wall) => readObject(wall, 2));
  if (rooms.includes(null) || walls.includes(null)) return null;
  return {
    widthPx: input.widthPx,
    heightPx: input.heightPx,
    rooms: rooms as ScanObject[],
    walls: walls as ScanObject[],
  };
}

export type ScanConfidenceLevel = 'high' | 'medium' | 'low';

export const SCAN_CONFIDENCE_LABELS: Record<ScanConfidenceLevel, string> = {
  high: 'Keyakinan tinggi',
  medium: 'Keyakinan sedang',
  low: 'Keyakinan rendah',
};

export function confidenceLevel(confidence: number): ScanConfidenceLevel {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

export type PlanCorners = readonly (readonly [number, number])[];

const round = (value: number) => Math.round(value * 1e8) / 1e8;

export function pixelToLngLat(
  corners: PlanCorners,
  widthPx: number,
  heightPx: number,
  [x, y]: readonly [number, number],
): [number, number] {
  const [tl, tr, br, bl] = corners as [Pt, Pt, Pt, Pt];
  const u = x / widthPx;
  const v = y / heightPx;
  const top = [tl[0] + u * (tr[0] - tl[0]), tl[1] + u * (tr[1] - tl[1])];
  const bottom = [bl[0] + u * (br[0] - bl[0]), bl[1] + u * (br[1] - bl[1])];
  return [
    round((top[0] ?? 0) + v * ((bottom[0] ?? 0) - (top[0] ?? 0))),
    round((top[1] ?? 0) + v * ((bottom[1] ?? 0) - (top[1] ?? 0))),
  ];
}

export interface ScanCandidate {
  id: string;
  kind: 'unit' | 'wall';
  geometry: Polygon | LineString;
  confidence: number;
  level: ScanConfidenceLevel;
}

export interface ScanCandidates {
  candidates: ScanCandidate[];
  rejected: number;
}

function roomGeometry(ring: [number, number][]): Polygon | null {
  const origin = ring[0];
  if (!origin) return null;
  const project = projector(origin);
  const open = openRing(ring);
  if (open.length < 3) return null;
  const projected = open.map((p) => project(p as [number, number]));
  const area = signedArea(projected);
  if (Math.abs(area) < SCAN_MIN_ROOM_M2 || ringSelfIntersects(projected)) return null;
  const ordered = (area < 0 ? [...open].reverse() : open) as [number, number][];
  const closed = [...ordered, ordered[0] as [number, number]];
  const parsed = PolygonSchema.safeParse({ type: 'Polygon', coordinates: [closed] });
  return parsed.success ? parsed.data : null;
}

function wallGeometry(line: [number, number][]): LineString | null {
  const [start, end] = [line[0], line.at(-1)];
  if (!start || !end) return null;
  const project = projector(start);
  const [dx, dy] = project(end);
  if (Math.hypot(dx, dy) < SCAN_MIN_WALL_M) return null;
  const parsed = LineStringSchema.safeParse({ type: 'LineString', coordinates: line });
  return parsed.success ? parsed.data : null;
}

export function scanCandidates(result: ScanResult, corners: PlanCorners): ScanCandidates {
  if (corners.length !== 4)
    return { candidates: [], rejected: result.rooms.length + result.walls.length };
  const toLngLat = (p: [number, number]) =>
    pixelToLngLat(corners, result.widthPx, result.heightPx, p);
  const candidates: ScanCandidate[] = [];
  let rejected = 0;
  result.rooms.forEach((room, index) => {
    const geometry = roomGeometry(room.points.map(toLngLat));
    if (!geometry) {
      rejected += 1;
      return;
    }
    candidates.push({
      id: `scan-room-${index}`,
      kind: 'unit',
      geometry,
      confidence: room.confidence,
      level: confidenceLevel(room.confidence),
    });
  });
  result.walls.forEach((wall, index) => {
    const geometry = wallGeometry(wall.points.map(toLngLat));
    if (!geometry) {
      rejected += 1;
      return;
    }
    candidates.push({
      id: `scan-wall-${index}`,
      kind: 'wall',
      geometry,
      confidence: wall.confidence,
      level: confidenceLevel(wall.confidence),
    });
  });
  return { candidates, rejected };
}
