import {
  type Building,
  type Connector,
  type ConnectorDraft,
  type ConnectorKind,
  type ConnectorProblem,
  defaultConnectorAccessible,
  type EscalatorDirection,
  type Floor,
  floorsBetween,
} from '@indoor/domain';

export const CONNECTOR_KIND_LABELS: Record<ConnectorKind, string> = {
  elevator: 'Lift',
  escalator: 'Eskalator',
  stairs: 'Tangga',
  building_door: 'Pintu gedung',
};

export const CONNECTOR_PROBLEM_MESSAGES: Record<ConnectorProblem, string> = {
  name_required: 'Nama konektor wajib diisi.',
  name_too_long: 'Nama maksimal 60 karakter.',
  too_few_floors: 'Pilih minimal dua lantai.',
  unknown_floor: 'Lantai tidak ditemukan; muat ulang halaman.',
  direction_required: 'Pilih arah eskalator.',
  escalator_two_floors: 'Eskalator menghubungkan tepat dua lantai.',
  door_needs_outdoor: 'Pilih lantai gedung yang terhubung ke Area Luar.',
  same_building: 'Konektor ini hanya menghubungkan lantai di satu gedung.',
};

/** Isian formulir konektor; lantai disimpan per jenis agar berganti jenis tidak menghapusnya. */
export interface ConnectorForm {
  kind: ConnectorKind;
  name: string;
  nameTouched: boolean;
  accessible: boolean;
  accessibleTouched: boolean;
  direction: EscalatorDirection | null;
  liftFloors: string[];
  otherFloor: string | null;
  stairsFrom: string;
  stairsTo: string;
  doorFloor: string | null;
}

export interface FormPlace {
  /** Lantai tempat konektor ditaruh atau diubah. */
  floor: Floor;
  floors: readonly Floor[];
  buildings: readonly Building[];
}

const levelOf = (floors: readonly Floor[], id: string | null) =>
  floors.find((f) => f.id === id)?.level ?? 0;

export function defaultName(kind: ConnectorKind, place: FormPlace, doorFloor: string | null) {
  if (kind !== 'building_door') return CONNECTOR_KIND_LABELS[kind];
  const buildingId = place.floor.isOutdoor
    ? place.floors.find((f) => f.id === doorFloor)?.buildingId
    : place.floor.buildingId;
  const building = place.buildings.find((b) => b.id === buildingId);
  return building ? `Pintu ${building.name}` : 'Pintu gedung';
}

/** Isian awal: konektor baru di lantai ini, atau dari konektor yang diubah. */
export function initialForm(connector: Connector | null, place: FormPlace): ConnectorForm {
  const { floor, floors } = place;
  const sameBuilding = floors.filter((f) => !f.isOutdoor && f.buildingId === floor.buildingId);
  const above = [...sameBuilding]
    .sort((a, b) => a.level - b.level)
    .find((f) => f.level > floor.level);
  const below = [...sameBuilding]
    .sort((a, b) => b.level - a.level)
    .find((f) => f.level < floor.level);
  const kind: ConnectorKind = connector?.kind ?? (floor.isOutdoor ? 'building_door' : 'elevator');
  const stops = connector?.stops.map((s) => s.floorId) ?? [];
  const others = stops.filter((id) => id !== floor.id);
  const byLevel = [...stops].sort((a, b) => levelOf(floors, a) - levelOf(floors, b));
  const neighbour = (above ?? below)?.id ?? null;
  const doorFloor = floor.isOutdoor ? (others[0] ?? null) : null;
  return {
    kind,
    name: connector?.name ?? defaultName(kind, place, doorFloor),
    nameTouched: connector !== null,
    accessible: connector?.accessible ?? defaultConnectorAccessible(kind),
    accessibleTouched: connector !== null,
    direction: connector?.direction ?? null,
    liftFloors:
      connector?.kind === 'elevator' ? stops : [floor.id, ...(neighbour ? [neighbour] : [])],
    otherFloor: connector?.kind === 'escalator' ? (others[0] ?? null) : neighbour,
    stairsFrom: connector?.kind === 'stairs' ? (byLevel[0] ?? floor.id) : (below?.id ?? floor.id),
    stairsTo: connector?.kind === 'stairs' ? (byLevel.at(-1) ?? floor.id) : (above?.id ?? floor.id),
    doorFloor,
  };
}

/** Lantai yang dihubungkan menurut jenis dan isian. */
export function formFloorIds(form: ConnectorForm, place: FormPlace): string[] {
  const { floor, floors } = place;
  switch (form.kind) {
    case 'elevator':
      return [...new Set([floor.id, ...form.liftFloors])];
    case 'escalator':
      return form.otherFloor ? [floor.id, form.otherFloor] : [floor.id];
    case 'stairs':
      return floorsBetween(floors, form.stairsFrom, form.stairsTo);
    case 'building_door': {
      if (floor.isOutdoor) return form.doorFloor ? [form.doorFloor, floor.id] : [floor.id];
      const outdoor = floors.find((f) => f.isOutdoor);
      return outdoor ? [floor.id, outdoor.id] : [floor.id];
    }
  }
}

export function formDraft(form: ConnectorForm, place: FormPlace): ConnectorDraft {
  return {
    kind: form.kind,
    name: form.name,
    direction: form.kind === 'escalator' ? form.direction : null,
    accessible: form.accessible,
    floorIds: formFloorIds(form, place),
  };
}

/** Berganti jenis: nama dan tanda aksesibel bawaan mengikuti jenis bila belum diubah pengguna. */
export function changeKind(
  form: ConnectorForm,
  kind: ConnectorKind,
  place: FormPlace,
): ConnectorForm {
  return {
    ...form,
    kind,
    name: form.nameTouched ? form.name : defaultName(kind, place, form.doorFloor),
    accessible: form.accessibleTouched ? form.accessible : defaultConnectorAccessible(kind),
  };
}
