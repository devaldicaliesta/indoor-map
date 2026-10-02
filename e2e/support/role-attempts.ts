import type { DataClient } from '@indoor/data';
import {
  type AdminAction,
  type BuildingId,
  FeatureIdSchema,
  type FloorId,
  type LocationId,
  type Polygon,
} from '@indoor/domain';
import { env } from '../env';
import { type PublishedVenue, TEST_CENTER } from '../fixtures';

/** Data milik fixture yang dicoba diubah/dihapus oleh role terlarang. */
export interface RoleTargets extends PublishedVenue {
  buildingId: BuildingId;
  closureId: string;
  locationId: LocationId;
}

/**
 * `create`: RLS menolak dengan galat (`forbidden`). `change`: ubah/hapus yang ditolak RLS bisa
 * berakhir 0 baris tanpa galat, jadi buktinya data tidak berubah (snapshot), bukan galatnya.
 */
export interface Attempt {
  label: string;
  op: 'create' | 'change';
  run: (data: DataClient, t: RoleTargets) => Promise<unknown>;
}

const SQUARE: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [TEST_CENTER[0] - 0.00005, TEST_CENTER[1] + 0.00025],
      [TEST_CENTER[0] + 0.00005, TEST_CENTER[1] + 0.00025],
      [TEST_CENTER[0] + 0.00005, TEST_CENTER[1] + 0.00015],
      [TEST_CENTER[0] - 0.00005, TEST_CENTER[1] + 0.00015],
      [TEST_CENTER[0] - 0.00005, TEST_CENTER[1] + 0.00025],
    ],
  ],
};

const newFeatureId = () => FeatureIdSchema.parse(crypto.randomUUID());

/**
 * Minimal satu percobaan per tabel/pintu server yang policy-nya berbeda (matriks 9.1).
 * `publish.validate`, `publish.rollback`, `license.manage` belum punya pintu server (T-307/T-308, R4).
 */
export const SERVER_ATTEMPTS: Partial<Record<AdminAction, Attempt[]>> = {
  'venue.edit': [
    {
      label: 'tambah gedung',
      op: 'create',
      run: (d, t) =>
        d.buildings.create(t.venue.id, {
          name: 'Gedung Terlarang',
          code: 'TLR',
          footprint: SQUARE,
        }),
    },
    {
      label: 'tambah lantai',
      op: 'create',
      run: (d, t) => d.floors.create(t.buildingId, { name: 'L9', level: 9, heightM: 4 }),
    },
    {
      label: 'ubah venue',
      op: 'change',
      run: (d, t) =>
        d.venues.update(t.venue.id, {
          name: 'Venue Diubah Role Terlarang',
          address: null,
          center: t.venue.center,
          timezone: t.venue.timezone,
        }),
    },
    {
      label: 'ubah lantai',
      op: 'change',
      run: (d, t) =>
        d.floors.update(t.floor.id as FloorId, { name: 'Diubah', level: 0, heightM: 4 }),
    },
    { label: 'hapus gedung', op: 'change', run: (d, t) => d.buildings.remove(t.buildingId) },
  ],
  'map.edit': [
    {
      label: 'simpan unit baru',
      op: 'create',
      run: (d, t) => {
        const id = newFeatureId();
        return d.features.save(t.venue.id, {
          type: 'Feature',
          id,
          geometry: SQUARE,
          properties: {
            id,
            kind: 'unit',
            floorId: t.floor.id,
            unitCode: 'TLR-01',
            unitStatus: 'vacant',
          },
        });
      },
    },
    { label: 'hapus unit', op: 'change', run: (d, t) => d.features.remove(t.vacantUnitId) },
  ],
  'location.edit': [
    {
      label: 'tambah kategori',
      op: 'create',
      run: async (d, t) => {
        const [type] = await d.categories.listTypes(t.venue.id);
        if (!type) throw new Error('tipe lokasi tidak terbaca');
        return d.categories.create(t.venue.id, type.id, {
          name: 'Terlarang',
          icon: null,
          sortOrder: 9,
        });
      },
    },
    {
      label: 'hapus lokasi',
      op: 'change',
      run: (d, t) => d.locations.remove(t.locationId),
    },
  ],
  'closure.manage': [
    {
      label: 'buat penutupan',
      op: 'create',
      run: (d, t) =>
        d.closures.create(t.venue.id, {
          target: { kind: 'feature', id: t.radiologyUnitId },
          reason: 'Percobaan role terlarang',
          startsAt: new Date().toISOString(),
          endsAt: null,
        }),
    },
    {
      label: 'akhiri penutupan',
      op: 'change',
      run: (d, t) => d.closures.setEndsAt(t.closureId, new Date().toISOString()),
    },
    { label: 'hapus penutupan', op: 'change', run: (d, t) => d.closures.remove(t.closureId) },
  ],
  'origin_point.edit': [
    {
      label: 'buat titik asal',
      op: 'create',
      run: (d, t) =>
        d.originPoints.create(t.venue.id, {
          floorId: t.floor.id,
          name: 'Titik Terlarang',
          coordinates: [...TEST_CENTER],
          headingDeg: 0,
          nodeId: null,
        }),
    },
  ],
  'publish.publish': [
    { label: 'publish', op: 'create', run: (d, t) => d.publications.publish(t.venue.id) },
  ],
  'settings.edit': [
    {
      label: 'tambah jenis fasilitas',
      op: 'create',
      run: (d, t) =>
        d.facilityTypes.create(t.venue.id, { name: 'Terlarang', isSafety: false, icon: null }),
    },
    {
      label: 'ubah tampilan',
      op: 'change',
      run: (d, t) => d.displaySettings.update(t.venue.id, { defaultMode: '3d' }),
    },
    {
      label: 'ubah instruksi',
      op: 'change',
      run: (d, t) =>
        d.instructionTemplates.update(t.venue.id, 'turn_left', { id: 'Diubah', en: 'Changed' }),
    },
  ],
  'settings.system': [
    {
      label: 'ubah pengaturan sistem',
      op: 'change',
      run: (d) => d.systemSettings.update({ defaultTimezone: 'Asia/Jayapura' }),
    },
  ],
  'user.manage': [
    {
      label: 'undang pengguna',
      op: 'create',
      run: (d) =>
        d.users.invite({
          email: `terlarang-${Date.now().toString(36)}@e2e.test`,
          fullName: 'Undangan Terlarang',
          role: 'viewer',
          redirectTo: `${env.adminUrl}/reset-password`,
        }),
    },
  ],
};

/** Keadaan yang disentuh percobaan di atas, dibaca sebagai Super Admin. */
export async function snapshot(superAdmin: DataClient, t: RoleTargets) {
  const venue = await superAdmin.venues.get(t.venue.id);
  const features = await superAdmin.features.listByVenue(t.venue.id);
  return {
    venueName: venue.name,
    buildings: (await superAdmin.buildings.list(t.venue.id)).map((b) => b.name).sort(),
    floors: (await superAdmin.floors.list(t.buildingId)).map((f) => f.name).sort(),
    features: JSON.stringify(features).length,
    categories: (await superAdmin.categories.list(t.venue.id)).map((c) => c.name).sort(),
    locations: (await superAdmin.locations.list(t.venue.id)).map((l) => l.code).sort(),
    closures: (await superAdmin.closures.listCurrent(t.venue.id, new Date())).map(
      (c) => `${c.id}:${c.endsAt}`,
    ),
    originPoints: (await superAdmin.originPoints.list(t.venue.id)).length,
    publication: (await superAdmin.publications.active(t.venue.id))?.version ?? null,
    facilityTypes: (await superAdmin.facilityTypes.list(t.venue.id)).length,
    displayMode: (await superAdmin.displaySettings.get(t.venue.id)).defaultMode,
    instructions: await superAdmin.instructionTemplates.get(t.venue.id),
    timezone: (await superAdmin.systemSettings.get()).defaultTimezone,
  };
}
