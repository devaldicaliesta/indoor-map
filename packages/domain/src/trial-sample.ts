// Data contoh ruang kerja trial ter-hosting (F2-K T-614b, FR-HT-06). Dimuat Edge Function
// `trial-verify` di Deno, jadi hanya mengimpor dengan ekstensi `.ts` dan tanpa dependensi.
import type { SnapshotSource } from './snapshot-source.ts';
import type { BuildingType } from './trial-request.ts';

/**
 * Batas data trial (`23-trial-hosting.md` §1), sama dengan `app.trial_quota()` migrasi 0052 —
 * trigger kuota menolak provisioning yang melewatinya. Keputusan pemilik 2026-10-12: trial berisi
 * salinan venue demo yang UTUH, jadi batas ini dibuat lebih besar dari demo terbesar (3 gedung,
 * 6 lantai, 195 lokasi, 3 titik asal, 2 Info Point) dengan sisa ruang untuk data pemohon;
 * `trialSample` hanya memangkas bila suatu hari venue demo melewatinya. `featuresPerFloor` adalah
 * pemeriksaan, bukan pemangkasan.
 */
export const TRIAL_SAMPLE_LIMITS = {
  buildings: 4,
  floors: 8,
  featuresPerFloor: 1000,
  locations: 250,
  originPoints: 10,
  infoPoints: 3,
} as const;
export type TrialSampleLimits = { [K in keyof typeof TRIAL_SAMPLE_LIMITS]: number };

/**
 * Venue demo (`db:seed-demo`, slug T-613) yang disalin sesuai jenis gedung di form trial, dan tipe
 * venue ruang kerja barunya (enum `venue_type`).
 */
export const TRIAL_TEMPLATES: Record<BuildingType, { slug: string; venueType: string }> = {
  mall: { slug: 'demo-mal', venueType: 'shopping_center' },
  hospital: { slug: 'demo', venueType: 'hospital' },
  campus: { slug: 'demo-kampus', venueType: 'campus' },
  office: { slug: 'demo-kantor', venueType: 'office' },
  airport: { slug: 'demo-bandara', venueType: 'airport_station' },
  industrial: { slug: 'demo-pabrik', venueType: 'factory_warehouse' },
  event: { slug: 'demo-konser', venueType: 'custom' },
  other: { slug: 'demo-kantor', venueType: 'custom' },
};

/**
 * Venue demo disalin utuh selama muat di batas trial (demo saat ini selalu muat); bila tidak,
 * dipangkas: gedung pertama (gedung bawaan lebih dulu), lantai
 * terbawahnya, Area Luar, lalu semua yang merujuk ke sana — fitur, graf jalur, konektor dengan
 * minimal dua pemberhentian, lokasi, alias, titik asal, Info Point. Berkas milik venue demo
 * (logo, foto, ikon unggahan) tidak dibawa: path-nya ada di folder venue lain.
 * Melempar galat bila satu lantai melebihi batas fitur — venue demo harus diperkecil.
 */
export function trialSample(
  source: SnapshotSource,
  limits: TrialSampleLimits = TRIAL_SAMPLE_LIMITS,
): SnapshotSource {
  const defaultBuilding = source.venue.defaultBuildingId;
  const buildings = [...source.buildings]
    .sort((a, b) => Number(b.id === defaultBuilding) - Number(a.id === defaultBuilding))
    .slice(0, limits.buildings);
  const buildingIds = new Set(buildings.map((b) => b.id));

  const indoor = source.floors
    .filter((f) => !f.isOutdoor && f.buildingId !== null && buildingIds.has(f.buildingId))
    .sort((a, b) => a.level - b.level)
    .slice(0, limits.floors);
  const floors = [...source.floors.filter((f) => f.isOutdoor), ...indoor];
  const floorIds = new Set(floors.map((f) => f.id));

  const features = source.features.filter((f) => floorIds.has(f.floorId));
  for (const floor of floors) {
    const count = features.filter((f) => f.floorId === floor.id).length;
    if (count > limits.featuresPerFloor) {
      throw new Error(`Lantai ${floor.name} berisi ${count} fitur, melebihi batas trial.`);
    }
  }
  const featureIds = new Set(features.map((f) => f.id));

  const nodes = source.graph.nodes.filter((n) => floorIds.has(n.floorId));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = source.graph.edges.filter(
    (e) => floorIds.has(e.floorId) && nodeIds.has(e.from) && nodeIds.has(e.to),
  );
  const connectors = source.graph.connectors
    .map((c) => ({
      ...c,
      stops: c.stops.filter((s) => floorIds.has(s.floorId) && nodeIds.has(s.nodeId)),
    }))
    .filter((c) => c.stops.length >= 2);

  const locations = source.locations
    // Nonaktif permanen tidak berguna sebagai contoh dan butuh langkah simpan tambahan.
    .filter((l) => l.status !== 'inactive_permanent')
    .filter((l) => l.unitIds.length === 0 || l.unitIds.some((id) => featureIds.has(id)))
    .slice(0, limits.locations)
    .map((l) => {
      const unitIds = l.unitIds.filter((id) => featureIds.has(id));
      return {
        ...l,
        unitIds,
        primaryUnitId:
          l.primaryUnitId && featureIds.has(l.primaryUnitId)
            ? l.primaryUnitId
            : (unitIds[0] ?? null),
        logoPath: null,
        photoPaths: [],
      };
    });
  const locationIds = new Set(locations.map((l) => l.id));
  const aliases = source.aliases.filter(
    (a) => a.targetKind !== 'location' || locationIds.has(a.targetId),
  );

  const keepNode = (id: string | null) => (id !== null && nodeIds.has(id) ? id : null);
  const firstFloorOf = (buildingId: string) => indoor.find((f) => f.buildingId === buildingId)?.id;

  return {
    ...source,
    venue: {
      ...source.venue,
      defaultBuildingId: buildings[0]?.id ?? null,
      logoPath: null,
    },
    buildings: buildings.map((b) => ({
      ...b,
      defaultFloorId:
        b.defaultFloorId && floorIds.has(b.defaultFloorId)
          ? b.defaultFloorId
          : (firstFloorOf(b.id) ?? null),
    })),
    floors,
    features,
    facilityTypes: source.facilityTypes.map((t) => ({
      ...t,
      icon: t.icon?.startsWith('builtin:') ? t.icon : null,
    })),
    locations,
    aliases,
    graph: { nodes, edges, connectors },
    originPoints: source.originPoints
      .filter((o) => floorIds.has(o.floorId))
      .slice(0, limits.originPoints)
      .map((o) => ({ ...o, nodeId: keepNode(o.nodeId) })),
    infoPoints: source.infoPoints
      .filter((i) => floorIds.has(i.floorId))
      .slice(0, limits.infoPoints)
      .map((i) => ({ ...i, nodeId: keepNode(i.nodeId) })),
  };
}

/**
 * Bakal slug ruang kerja dari nama instansi: huruf kecil tanpa diakritik, tanda hubung tunggal,
 * paling panjang 50 (sisa ruang untuk akhiran keunikan `-2`, `-3`, … di SQL). Awalan `demo`
 * milik venue demo resmi, jadi diberi awalan `trial-`.
 */
export function slugFromName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/, '');
  const slug = base.length >= 3 ? base : 'trial';
  return slug === 'demo' || slug.startsWith('demo-') ? `trial-${slug}`.slice(0, 50) : slug;
}
