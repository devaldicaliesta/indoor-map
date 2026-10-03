import type { Snapshot } from './snapshot';

/**
 * Warna isi unit di Visitor seperti peta indoor komersial: kategori pertama lokasi yang
 * menempati unit, lalu warna tipe lokasinya. Unit kosong, unit tanpa lokasi, dan unit yang
 * sudah punya warna sendiri tidak masuk peta warna ini (gaya bawaan yang berlaku).
 */
export function unitColors(
  snapshot: Pick<Snapshot, 'features' | 'locations' | 'categories' | 'locationTypes'>,
): Map<string, string> {
  const categoryColor = new Map(snapshot.categories.map((c) => [c.id, c.color ?? null]));
  const typeColor = new Map(snapshot.locationTypes.map((t) => [t.id, t.color]));
  const skip = new Set(
    snapshot.features.features
      .filter((f) => f.properties.unitStatus === 'vacant' || f.properties.color)
      .map((f) => f.properties.id),
  );
  const colors = new Map<string, string>();
  for (const location of snapshot.locations) {
    const first = location.categoryIds[0];
    const color =
      (first ? categoryColor.get(first) : null) ?? typeColor.get(location.locationTypeId) ?? null;
    if (!color) continue;
    for (const unitId of location.unitIds) {
      if (!skip.has(unitId) && !colors.has(unitId)) colors.set(unitId, color);
    }
  }
  return colors;
}
