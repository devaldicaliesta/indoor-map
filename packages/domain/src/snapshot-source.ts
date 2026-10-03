import type { OpeningHours } from './hours.ts';
/**
 * Data draft venue yang menjadi masukan builder snapshot. Dimuat Edge Function `publish`
 * di Deno, jadi hanya mengimpor tipe dengan ekstensi `.ts` (lihat `snapshot.ts`).
 */
import type {
  InstructionText,
  SearchTargetKind,
  SnapshotBuilding,
  SnapshotCategory,
  SnapshotConnector,
  SnapshotFacilityType,
  SnapshotFeatureKind,
  SnapshotField,
  SnapshotFloor,
  SnapshotGeometry,
  SnapshotInfoPoint,
  SnapshotLanguage,
  SnapshotLocation,
  SnapshotLocationStatus,
  SnapshotLocationType,
  SnapshotNavEdge,
  SnapshotNavNode,
  SnapshotOriginPoint,
  SnapshotOutdoorSubtype,
  SnapshotUnitStatus,
  SnapshotVenue,
} from './snapshot.ts';

/** Urutan tampil dari database; dipakai untuk mengurutkan lalu dibuang. */
interface Ordered {
  sortOrder: number;
}

export interface SourceFeature {
  id: string;
  floorId: string;
  kind: SnapshotFeatureKind;
  geometry: SnapshotGeometry;
  name: string | null;
  unitCode: string | null;
  unitStatus: SnapshotUnitStatus | null;
  height: number | null;
  color: string | null;
  facilityTypeId: string | null;
  subtype: SnapshotOutdoorSubtype | null;
}

export interface SourceField extends SnapshotField, Ordered {
  isVisible: boolean;
  isSearchable: boolean;
  /** Hanya untuk validasi publish (peringatan field wajib kosong); tidak diterbitkan. */
  isRequired: boolean;
}

export interface SourceLocationType extends Omit<SnapshotLocationType, 'fields'>, Ordered {
  fields: readonly SourceField[];
}

export interface SourceLocation extends Omit<SnapshotLocation, 'status' | 'fields' | 'hours'> {
  /** Jadwal dari tabel `opening_hours`; jadwal kosong tidak diterbitkan. */
  hours: OpeningHours;
  status: SnapshotLocationStatus | 'inactive_permanent';
  /** Isi kolom `custom_fields` apa adanya. */
  customFields: Readonly<Record<string, unknown>>;
}

export interface SourceAlias {
  targetKind: Exclude<SearchTargetKind, 'unit'>;
  targetId: string;
  keyword: string;
}

/** Data draft venue yang dibaca Edge Function `publish`. Kolom jsonb dibiarkan `unknown`. */
export interface SnapshotSource {
  version: number;
  publishedAt: string;
  defaultLanguage: SnapshotLanguage;
  enabledFeatures: readonly string[];
  venue: Omit<SnapshotVenue, 'defaultLanguage' | 'camera' | 'display'>;
  display: {
    defaultMode: string;
    heights: unknown;
    colors: unknown;
    camera: unknown;
    branding: unknown;
  } | null;
  buildings: readonly (SnapshotBuilding & Ordered)[];
  floors: readonly (SnapshotFloor & Ordered)[];
  features: readonly SourceFeature[];
  facilityTypes: readonly (SnapshotFacilityType & Ordered)[];
  locationTypes: readonly SourceLocationType[];
  categories: readonly (SnapshotCategory & Ordered)[];
  locations: readonly SourceLocation[];
  aliases: readonly SourceAlias[];
  graph: {
    nodes: readonly SnapshotNavNode[];
    edges: readonly SnapshotNavEdge[];
    connectors: readonly SnapshotConnector[];
  };
  instructionTemplates: readonly ({ action: string } & InstructionText)[];
  originPoints: readonly SnapshotOriginPoint[];
  infoPoints: readonly SnapshotInfoPoint[];
}
