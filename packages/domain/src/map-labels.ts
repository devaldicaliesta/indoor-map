import { areaM2 } from './area';
import type { Polygon, Position } from './geometry';
import { labelPoint } from './label-point';
import type { Snapshot, SnapshotFeature } from './snapshot';

/**
 * Urutan penempatan label yang bertabrakan: angka kecil ditempatkan lebih dulu, yang kalah
 * disembunyikan pada tingkat zoom itu (pilihan pengunjung > fasilitas keselamatan > lokasi >
 * fasilitas lain).
 */
export const LABEL_PRIORITY = { selected: 0, safety: 1, location: 2, facility: 3 } as const;

export type MapLabel =
  | {
      kind: 'location';
      /** Id lokasi; satu label per lokasi per lantai. */
      id: string;
      floorId: string;
      name: string;
      position: Position;
      priority: number;
    }
  | {
      kind: 'facility';
      /** Id fitur fasilitas. */
      id: string;
      floorId: string;
      facilityTypeId: string;
      position: Position;
      priority: number;
    };

/** Poligon terbesar dari unit; label diletakkan di dalamnya. */
function largestPolygon(feature: SnapshotFeature): Polygon | null {
  const { geometry } = feature;
  if (geometry.type === 'Polygon') return geometry;
  if (geometry.type !== 'MultiPolygon') return null;
  let best: Polygon | null = null;
  let bestArea = -1;
  for (const coordinates of geometry.coordinates) {
    const polygon: Polygon = { type: 'Polygon', coordinates };
    const area = areaM2(polygon);
    if (area > bestArea) {
      best = polygon;
      bestArea = area;
    }
  }
  return best;
}

/**
 * Label lokasi dan ikon fasilitas untuk lantai yang digambar. Lokasi yang menempati beberapa
 * unit di satu lantai diberi satu label di unit utamanya, atau unit terbesar di lantai itu.
 * `selectedIds` (id lokasi atau id fitur fasilitas yang sedang dipilih pengunjung) ditempatkan
 * lebih dulu daripada label lain.
 */
export function mapLabels(
  snapshot: Pick<Snapshot, 'features' | 'locations' | 'facilityTypes'>,
  floorIds: readonly string[],
  selectedIds: readonly string[] | ReadonlySet<string> = [],
): MapLabel[] {
  const visible = new Set(floorIds);
  const selected = new Set(selectedIds);
  const units = new Map<string, SnapshotFeature>();
  const labels: MapLabel[] = [];
  const safety = new Set(snapshot.facilityTypes.filter((t) => t.isSafety).map((t) => t.id));

  for (const feature of snapshot.features.features) {
    const { kind, floorId, facilityTypeId } = feature.properties;
    if (!visible.has(floorId)) continue;
    if (kind === 'unit') units.set(feature.id, feature);
    else if (kind === 'facility' && facilityTypeId && feature.geometry.type === 'Point') {
      labels.push({
        kind: 'facility',
        id: feature.id,
        floorId,
        facilityTypeId,
        position: feature.geometry.coordinates,
        priority: selected.has(feature.id)
          ? LABEL_PRIORITY.selected
          : safety.has(facilityTypeId)
            ? LABEL_PRIORITY.safety
            : LABEL_PRIORITY.facility,
      });
    }
  }

  for (const location of snapshot.locations) {
    const byFloor = new Map<string, SnapshotFeature[]>();
    for (const unitId of location.unitIds) {
      const unit = units.get(unitId);
      if (!unit) continue;
      const onFloor = byFloor.get(unit.properties.floorId) ?? [];
      onFloor.push(unit);
      byFloor.set(unit.properties.floorId, onFloor);
    }
    for (const [floorId, floorUnits] of byFloor) {
      const unit =
        floorUnits.find((u) => u.id === location.primaryUnitId) ??
        [...floorUnits].sort((a, b) => areaM2(b.geometry) - areaM2(a.geometry))[0];
      const polygon = unit ? largestPolygon(unit) : null;
      if (!polygon) continue;
      labels.push({
        kind: 'location',
        id: location.id,
        floorId,
        name: location.name,
        position: labelPoint(polygon.coordinates),
        priority: selected.has(location.id) ? LABEL_PRIORITY.selected : LABEL_PRIORITY.location,
      });
    }
  }
  return labels;
}
