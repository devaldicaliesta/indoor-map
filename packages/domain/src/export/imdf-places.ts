import type { SnapshotFeature } from '../snapshot.ts';
import type { ImdfOccupantCategory } from './imdf-categories.ts';
import { AMENITY_CATEGORY_BY_ICON } from './imdf-mapping.ts';
import type { ImdfWriter, WrittenUnit } from './imdf-writer.ts';
import { pointOf } from './imdf-writer.ts';
import { toOsmHours } from './osm-hours.ts';
import { containsPoint, doorSegment } from './shapes.ts';

const builtinIcon = (icon: string | null | undefined) =>
  icon?.startsWith('builtin:') ? icon.slice('builtin:'.length) : '';

/** Pintu dan pintu darurat (titik) menjadi bukaan; fasilitas dan landmark menjadi amenity. */
export async function writePoints(
  w: ImdfWriter,
  levelIds: ReadonlyMap<string, string>,
  units: ReadonlyMap<string, WrittenUnit>,
): Promise<void> {
  const facilityTypes = new Map(w.snapshot.facilityTypes.map((t) => [t.id, t]));
  const unitsOn = (levelId: string) => [...units.values()].filter((u) => u.levelId === levelId);
  for (const f of w.snapshot.features.features) {
    const { kind } = f.properties;
    if (kind === 'wall') w.skipped.walls++;
    if (kind === 'model3d') w.skipped.models++;
    const levelId = levelIds.get(f.properties.floorId);
    if (!levelId || f.geometry.type !== 'Point') continue;
    if (kind === 'door' || kind === 'exit') {
      await writeOpening(w, f, levelId, unitsOn(levelId));
    } else if (kind === 'facility' || kind === 'landmark') {
      const point = f.geometry.coordinates;
      const inside = unitsOn(levelId).filter((u) => containsPoint(u.shape, point));
      if (!inside.length) {
        w.skipped.pointsOutsideUnits++;
        continue;
      }
      const type = facilityTypes.get(f.properties.facilityTypeId ?? '');
      const category =
        kind === 'landmark'
          ? 'landmark'
          : (AMENITY_CATEGORY_BY_ICON[builtinIcon(type?.icon)] ?? 'unspecified');
      w.add('amenity', await w.idOf(f.id), f.geometry, {
        category,
        accessibility: null,
        name: w.label(f.properties.name ?? type?.name),
        alt_name: null,
        hours: null,
        phone: null,
        website: null,
        unit_ids: inside.map((u) => u.id),
        address_id: null,
        correlation_id: null,
      });
    }
  }
}

async function writeOpening(
  w: ImdfWriter,
  feature: SnapshotFeature,
  levelId: string,
  units: readonly WrittenUnit[],
): Promise<void> {
  if (feature.geometry.type !== 'Point') return;
  const coordinates = doorSegment(
    feature.geometry.coordinates,
    units.map((u) => u.shape),
  );
  w.add(
    'opening',
    await w.idOf(feature.id),
    { type: 'LineString', coordinates },
    {
      category: feature.properties.kind === 'exit' ? 'emergencyexit' : 'pedestrian',
      accessibility: null,
      access_control: null,
      door: null,
      name: w.label(feature.properties.name),
      alt_name: null,
      display_point: null,
      level_id: levelId,
    },
  );
}

/**
 * Lokasi: satu anchor dan satu occupant per unit yang ditempati. Lokasi di beberapa unit
 * berbagi `correlation_id` agar penerima tahu itu satu lokasi.
 */
export async function writeOccupants(
  w: ImdfWriter,
  units: ReadonlyMap<string, WrittenUnit>,
  category: ImdfOccupantCategory,
): Promise<void> {
  for (const location of w.snapshot.locations) {
    const placed = location.unitIds.flatMap((id) => {
      const unit = units.get(id);
      return unit ? [{ sourceId: id, ...unit }] : [];
    });
    if (!placed.length) {
      w.skipped.locationsWithoutUnit++;
      continue;
    }
    const correlation = placed.length > 1 ? await w.idOf(location.id) : null;
    for (const unit of placed) {
      const key = `${location.id}:${unit.sourceId}`;
      const anchorId = await w.derived('anchor', key);
      w.add('anchor', anchorId, pointOf(unit.shape), { address_id: null, unit_id: unit.id });
      w.add(
        'occupant',
        correlation ? await w.derived('occupant', key) : await w.idOf(location.id),
        null,
        {
          name: w.label(location.name),
          category,
          anchor_id: anchorId,
          hours: toOsmHours(location.hours),
          phone: null,
          website: null,
          validity: null,
          correlation_id: correlation,
        },
      );
    }
  }
}
