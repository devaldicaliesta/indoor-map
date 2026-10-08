import { parseFacilityIcon, type Snapshot, unitColors } from '@indoor/domain';
import {
  type CrowdArea,
  categoryIconTypeId,
  categoryUnitColors,
  type FacilityIconSpec,
  type FloorFeatureCollection,
} from '@indoor/map-core';
import { pictogramSvg } from '@indoor/ui';

/** Fitur lantai dengan pelat lantai dari footprint dan warna kategori, seperti Visitor. */
export function floorCollection(
  snapshot: Snapshot,
  floorIds: readonly string[],
): FloorFeatureCollection {
  const visible = new Set(floorIds);
  const colors = new Map(
    [...unitColors(snapshot)].map(([id, color]) => [id, categoryUnitColors(color)]),
  );
  const footprints = new Map(snapshot.buildings.map((b) => [b.id, b.footprint]));
  const slabs: FloorFeatureCollection['features'] = snapshot.floors.flatMap((floor) => {
    const footprint = floor.buildingId ? footprints.get(floor.buildingId) : null;
    if (!footprint || !visible.has(floor.id)) return [];
    return [
      {
        type: 'Feature',
        geometry: footprint,
        properties: { id: `slab-${floor.id}`, kind: 'corridor', floorId: floor.id },
      },
    ] as FloorFeatureCollection['features'];
  });
  return {
    type: 'FeatureCollection',
    features: [...slabs, ...snapshot.features.features]
      .filter((f) => visible.has(f.properties.floorId))
      .map((f) => {
        const paint = colors.get(f.properties.id);
        return paint
          ? { ...f, properties: { ...f.properties, color: paint.fill, outline: paint.outline } }
          : f;
      }),
  };
}

export function iconSpecs(snapshot: Snapshot): FacilityIconSpec[] {
  const svg = (icon: string | null) => {
    const parsed = parseFacilityIcon(icon);
    return parsed?.kind === 'builtin' ? { svg: pictogramSvg(parsed.key) } : null;
  };
  const typeColor = new Map(snapshot.locationTypes.map((t) => [t.id, t.color]));
  return [
    ...snapshot.facilityTypes.map((type) => ({
      typeId: type.id,
      isSafety: type.isSafety,
      source: svg(type.icon),
    })),
    ...snapshot.categories.map((category) => ({
      typeId: categoryIconTypeId(category.id),
      isSafety: false,
      background: category.color ?? typeColor.get(category.locationTypeId) ?? undefined,
      ring: '#ffffff',
      source: svg(category.icon),
    })),
  ];
}

export function crowdAreas(snapshot: Snapshot, floorIds: readonly string[]): CrowdArea[] {
  const visible = new Set(floorIds);
  return snapshot.features.features.flatMap((f) => {
    if (f.properties.kind !== 'unit' || !visible.has(f.properties.floorId)) return [];
    if (f.geometry.type !== 'Polygon') return [];
    const ring = f.geometry.coordinates[0];
    return ring ? [{ floorId: f.properties.floorId, ring: ring as CrowdArea['ring'] }] : [];
  });
}
