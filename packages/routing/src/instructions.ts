import {
  distanceM,
  type InstructionAction,
  type InstructionText,
  type SnapshotBuilding,
  type SnapshotConnectorKind,
  type SnapshotFloor,
  type SnapshotLanguage,
  type SnapshotPosition,
} from '@indoor/domain';
import { bearingDeg, type PlanarPoint, simplify, toPlanar, turnDeg } from './polyline';
import type { ConnectorLeg, RouteSuccess, WalkLeg } from './types';

/** Perubahan arah (derajat) mulai dari mana disebut "agak ke kiri/kanan" … */
const SLIGHT_TURN_DEG = 15;
/** … dan di atas ini disebut "belok kiri/kanan". */
const TURN_DEG = 30;
/**
 * Simpangan (m) yang dianggap ketidakrataan gambar jalur, bukan belokan: node yang sedikit
 * melenceng dari garis koridor tidak memecah langkah lurus menjadi belok-belok kecil.
 */
const PATH_TOLERANCE_M = 1;
/** Titik yang lebih dekat dari ini dianggap sama, misalnya titik bebas yang tepat di jalur. */
const SAME_POINT_M = 0.01;
/** Jarak di teks instruksi dibulatkan ke kelipatan ini, minimal satu kelipatan. */
const STEP_DISTANCE_M = 5;

/** Langkah rute tanpa teks; teksnya dibuat `instructionText` sesuai bahasa. */
export interface RouteStep {
  action: InstructionAction;
  /**
   * Lantai yang ditampilkan peta saat langkah ini aktif. Untuk konektor, keluar, dan masuk
   * gedung: lantai tujuannya, agar "naik lift ke L3" langsung memperlihatkan L3.
   */
  floorId: string;
  /** Gedung untuk `{building}`: yang ditinggalkan saat keluar gedung; `null` di Area Luar. */
  buildingId: string | null;
  /** Titik yang disorot peta: ruas untuk langkah lurus, satu titik untuk langkah lain. */
  coordinates: SnapshotPosition[];
  /** Jarak berjalan (m) langkah lurus; 0 untuk aksi lain. */
  distanceM: number;
}

type StepFloor = Pick<SnapshotFloor, 'id' | 'buildingId' | 'level'>;
type StepPlace = Pick<RouteStep, 'floorId' | 'buildingId'>;

const CONNECTOR_ACTIONS: Record<
  Exclude<SnapshotConnectorKind, 'building_door'>,
  { up: InstructionAction; down: InstructionAction }
> = {
  elevator: { up: 'elevator_up', down: 'elevator_down' },
  escalator: { up: 'escalator_up', down: 'escalator_down' },
  stairs: { up: 'stairs_up', down: 'stairs_down' },
};

const pointStep = (
  action: InstructionAction,
  place: StepPlace,
  position: SnapshotPosition | undefined,
): RouteStep => ({ action, ...place, coordinates: position ? [position] : [], distanceM: 0 });

function turnAction(deg: number): InstructionAction | null {
  const size = Math.abs(deg);
  if (size < SLIGHT_TURN_DEG) return null;
  if (size <= TURN_DEG) return deg > 0 ? 'slight_right' : 'slight_left';
  return deg > 0 ? 'turn_right' : 'turn_left';
}

function straightStep(points: readonly SnapshotPosition[], place: StepPlace): RouteStep {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distanceM(points[i - 1] ?? [0, 0], points[i] ?? [0, 0]);
  }
  return { action: 'straight', ...place, coordinates: [...points], distanceM: length };
}

function withoutRepeats(points: readonly SnapshotPosition[]): SnapshotPosition[] {
  const out: SnapshotPosition[] = [];
  for (const point of points) {
    const previous = out.at(-1);
    if (!previous || distanceM(previous, point) >= SAME_POINT_M) out.push(point);
  }
  return out;
}

/**
 * Langkah lurus dan belok di satu lantai. Arah dibandingkan antar-ruas jalur yang sudah
 * disederhanakan; `incoming` = arah terakhir sebelum bagian ini (setelah pintu gedung), atau
 * `null` bila arah sebelumnya tidak bermakna. Mengembalikan arah terakhir bagian ini.
 */
function walkSteps(
  leg: WalkLeg,
  incoming: number | null,
  place: StepPlace,
  out: RouteStep[],
): number | null {
  const points = withoutRepeats(leg.coordinates);
  if (points.length < 2) return incoming;
  const planar = toPlanar(points);
  const at = (i: number): PlanarPoint => planar[i] ?? [0, 0];
  const corners = simplify(planar, PATH_TOLERANCE_M);
  let heading = incoming;
  let runStart = 0;
  for (let k = 0; k + 1 < corners.length; k++) {
    const corner = corners[k] ?? 0;
    const bearing = bearingDeg(at(corner), at(corners[k + 1] ?? 0));
    const turn = heading === null ? null : turnAction(turnDeg(heading, bearing));
    if (turn) {
      if (corner > runStart) out.push(straightStep(points.slice(runStart, corner + 1), place));
      out.push(pointStep(turn, place, points[corner]));
      runStart = corner;
    }
    heading = bearing;
  }
  out.push(straightStep(points.slice(runStart), place));
  return heading;
}

function connectorSteps(
  leg: ConnectorLeg,
  position: SnapshotPosition | undefined,
  floors: ReadonlyMap<string, StepFloor>,
): RouteStep[] {
  const from = floors.get(leg.fromFloorId);
  const to = floors.get(leg.toFloorId);
  const fromBuilding = from?.buildingId ?? null;
  const toBuilding = to?.buildingId ?? null;
  const step = (action: InstructionAction, buildingId: string | null) =>
    pointStep(action, { floorId: leg.toFloorId, buildingId }, position);
  if (leg.connectorKind === 'building_door') {
    if (fromBuilding === toBuilding) return [];
    return [
      ...(fromBuilding ? [step('exit_building', fromBuilding)] : []),
      ...(toBuilding ? [step('enter_building', toBuilding)] : []),
    ];
  }
  const actions = CONNECTOR_ACTIONS[leg.connectorKind];
  const down = (to?.level ?? 0) < (from?.level ?? 0);
  return [step(down ? actions.down : actions.up, toBuilding)];
}

/**
 * Pecah rute menjadi langkah: mulai, lurus (ruas yang hampir sejajar digabung), belok kiri/kanan
 * (> 30°) atau agak kiri/kanan (15–30°), naik/turun lift, eskalator, atau tangga, keluar/masuk
 * gedung, lalu tiba. Arah berjalan dibawa melewati pintu gedung (keluar lalu belok), tetapi tidak
 * melewati lift, eskalator, dan tangga karena arah hadap setelahnya tidak diketahui.
 */
export function routeSteps(
  route: Pick<RouteSuccess, 'legs'>,
  floors: readonly StepFloor[],
): RouteStep[] {
  const byId = new Map(floors.map((floor) => [floor.id, floor]));
  const placeOf = (floorId: string): StepPlace => ({
    floorId,
    buildingId: byId.get(floorId)?.buildingId ?? null,
  });
  const walks = route.legs.filter((leg): leg is WalkLeg => leg.kind === 'walk');
  const first = walks[0];
  const last = walks.at(-1);
  if (!first || !last) return [];

  const steps = [pointStep('start', placeOf(first.floorId), first.coordinates[0])];
  let heading: number | null = null;
  route.legs.forEach((leg, i) => {
    if (leg.kind === 'walk') {
      heading = walkSteps(leg, heading, placeOf(leg.floorId), steps);
      return;
    }
    const next = route.legs[i + 1];
    steps.push(
      ...connectorSteps(leg, next?.kind === 'walk' ? next.coordinates[0] : undefined, byId),
    );
    if (leg.connectorKind !== 'building_door') heading = null;
  });
  steps.push(pointStep('arrive', placeOf(last.floorId), last.coordinates.at(-1)));
  return steps;
}

export const INSTRUCTION_PLACEHOLDERS = [
  'distance',
  'floor',
  'building',
  'origin',
  'destination',
] as const;
export type InstructionPlaceholder = (typeof INSTRUCTION_PLACEHOLDERS)[number];

/** Placeholder yang bisa dipakai teks sebuah aksi: `{distance}` hanya untuk jalan lurus. */
export function instructionPlaceholders(action: InstructionAction): InstructionPlaceholder[] {
  return INSTRUCTION_PLACEHOLDERS.filter((name) => name !== 'distance' || action === 'straight');
}

export interface InstructionContext {
  templates: Readonly<Record<InstructionAction, InstructionText>>;
  language: SnapshotLanguage;
  floors: readonly Pick<SnapshotFloor, 'id' | 'name'>[];
  buildings: readonly Pick<SnapshotBuilding, 'id' | 'name'>[];
  /** Nama asal dan tujuan dalam bahasa tampilan, misalnya teks "Anda di sini" dari Visitor. */
  origin: string;
  destination: string;
}

/** Jarak untuk teks instruksi: kelipatan 5 m terdekat, minimal 5 m. */
export function roundStepDistance(meters: number): number {
  return Math.max(STEP_DISTANCE_M, Math.round(meters / STEP_DISTANCE_M) * STEP_DISTANCE_M);
}

function placeholderValue(
  name: InstructionPlaceholder,
  step: RouteStep,
  context: InstructionContext,
): string {
  const floor = context.floors.find((f) => f.id === step.floorId)?.name ?? '';
  switch (name) {
    case 'distance':
      return roundStepDistance(step.distanceM).toLocaleString(context.language);
    case 'floor':
      return floor;
    case 'building':
      // Di Area Luar tidak ada gedung; nama lapisannya ("Area Luar") yang disebut.
      return context.buildings.find((b) => b.id === step.buildingId)?.name ?? floor;
    case 'origin':
      return context.origin;
    case 'destination':
      return context.destination;
  }
}

/**
 * Teks langkah dari template venue dalam `language`. Teks yang kosong di bahasa itu memakai
 * bahasa lain, karena terjemahan boleh belum lengkap saat publish. Placeholder yang tidak dikenal
 * atau tidak tersedia untuk aksinya dibiarkan apa adanya agar terlihat di test route Admin.
 */
export function instructionText(step: RouteStep, context: InstructionContext): string {
  const text = context.templates[step.action];
  const other = context.language === 'id' ? 'en' : 'id';
  const template = text[context.language].trim() ? text[context.language] : text[other];
  const values = new Map<string, string>(
    instructionPlaceholders(step.action).map((name) => [
      name,
      placeholderValue(name, step, context),
    ]),
  );
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values.get(name) ?? match);
}
