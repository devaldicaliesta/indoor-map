import type { ClosureTarget, Connector, MapFeatureProperties, NavGraph } from '@indoor/domain';
import type { ClosureImpact } from '@indoor/routing';
import { CONNECTOR_KIND_LABELS } from '../editor/connectors/connector-form';
import { FEATURE_KIND_LABELS } from '../editor/labels';

function zoneParts(at: number, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(at));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** Isian `datetime-local` (jam dinding venue) untuk waktu ISO. */
export function toVenueInput(iso: string, timezone: string): string {
  const p = zoneParts(Date.parse(iso), timezone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Selisih jam dinding venue terhadap UTC (ms) pada instan `at`. */
function offsetMs(at: number, timezone: string): number {
  const p = zoneParts(at, timezone);
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return wall - Math.floor(at / 60_000) * 60_000;
}

/** Waktu ISO dari isian `datetime-local` yang dibaca sebagai jam dinding venue; `null` bila rusak. */
export function fromVenueInput(local: string, timezone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const wall = Date.UTC(y ?? 0, (mo ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0);
  // Dua kali agar perpindahan zona (bila ada) di antara tebakan dan hasil ikut terhitung.
  let at = wall - offsetMs(wall, timezone);
  at = wall - offsetMs(at, timezone);
  return new Date(at).toISOString();
}

export interface ClosurePlaces {
  floors: readonly { id: string; name: string; buildingId: string | null }[];
  buildings: readonly { id: string; name: string }[];
  connectors: readonly Pick<Connector, 'id' | 'name' | 'kind'>[];
  features: readonly {
    properties: Pick<MapFeatureProperties, 'id' | 'kind' | 'floorId' | 'name' | 'unitCode'>;
  }[];
  graph: Pick<NavGraph, 'edges'>;
}

/** Nama lantai beserta gedungnya, misalnya "L2 · Gedung Utama"; Area Luar cukup namanya. */
export function floorLabel(places: Pick<ClosurePlaces, 'floors' | 'buildings'>, floorId: string) {
  const floor = places.floors.find((f) => f.id === floorId);
  if (!floor) return 'lantai yang dihapus';
  const building = places.buildings.find((b) => b.id === floor.buildingId);
  return building ? `${floor.name} ${building.name}` : floor.name;
}

/** Nama sasaran penutupan untuk daftar dan dialog. */
export function targetLabel(places: ClosurePlaces, target: ClosureTarget): string {
  switch (target.kind) {
    case 'connector': {
      const connector = places.connectors.find((c) => c.id === target.id);
      if (!connector) return 'Konektor yang dihapus';
      const kind = CONNECTOR_KIND_LABELS[connector.kind];
      // Nama sering sudah memuat jenisnya ("Lift Pasien"); jangan menjadi "Lift Lift Pasien".
      return connector.name.toLowerCase().startsWith(kind.toLowerCase())
        ? connector.name
        : `${kind} ${connector.name}`;
    }
    case 'edge': {
      const edge = places.graph.edges[target.id];
      return edge ? `Jalur di ${floorLabel(places, edge.floorId)}` : 'Jalur yang dihapus';
    }
    case 'feature': {
      const feature = places.features.find((f) => f.properties.id === target.id)?.properties;
      if (!feature) return 'Area yang dihapus';
      const name = feature.name || feature.unitCode || FEATURE_KIND_LABELS[feature.kind];
      return `${name} · ${floorLabel(places, feature.floorId)}`;
    }
  }
}

/** Kalimat dampak, misalnya "Rute aksesibel ke L2 Gedung Utama tidak tersedia selama penutupan." */
export function impactText(
  places: Pick<ClosurePlaces, 'floors' | 'buildings'>,
  impact: ClosureImpact,
): string {
  const floor = floorLabel(places, impact.floorId);
  return impact.allRoutes
    ? `Tidak ada rute ke ${floor} selama penutupan.`
    : `Rute aksesibel ke ${floor} tidak tersedia selama penutupan.`;
}
