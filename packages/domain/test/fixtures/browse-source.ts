import type { SnapshotSource, SourceFeature, SourceLocation } from '../../src';
import { IDS, sampleSnapshotSource } from './snapshot-source';

// Id tetap tambahan untuk test pencarian, direktori, dan sorotan Visitor.
export const BROWSE_IDS = {
  roomType: '1b8c4f7d-2d3e-4f60-9b1c-1d2e3f4a5b01',
  meetingCategory: '1b8c4f7d-2d3e-4f60-9b1c-1d2e3f4a5b02',
  emptyCategory: '1b8c4f7d-2d3e-4f60-9b1c-1d2e3f4a5b03',
  prayerType: '1b8c4f7d-2d3e-4f60-9b1c-1d2e3f4a5b04',
  infoDesk: '1b8c4f7d-2d3e-4f60-9b1c-1d2e3f4a5b05',
  eastMeeting: '1b8c4f7d-2d3e-4f60-9b1c-1d2e3f4a5b06',
  allDay: '1b8c4f7d-2d3e-4f60-9b1c-1d2e3f4a5b07',
  pond: '1b8c4f7d-2d3e-4f60-9b1c-1d2e3f4a5b08',
  outdoorUnit: '1b8c4f7d-2d3e-4f60-9b1c-1d2e3f4a5b09',
} as const;

function location(
  fields: Pick<SourceLocation, 'id' | 'name' | 'locationTypeId' | 'categoryIds' | 'unitIds'> &
    Partial<SourceLocation>,
): SourceLocation {
  return {
    code: null,
    description: null,
    status: 'active',
    openingDate: null,
    primaryUnitId: fields.unitIds[0] ?? null,
    logoPath: null,
    photoPaths: [],
    customFields: {},
    ...fields,
  };
}

/**
 * Sampel snapshot ditambah lokasi di beberapa lantai dan gedung, satu unit di Area Luar,
 * tipe lokasi kedua, kategori tanpa anggota, dan jenis fasilitas Musala.
 */
export function browseSnapshotSource(): SnapshotSource {
  const source = sampleSnapshotSource();
  const unitId = (code: string) => source.features.find((f) => f.unitCode === code)?.id ?? '';
  const outdoorFloor = source.floors.find((f) => f.isOutdoor);
  const template = source.features.find((f) => f.unitCode === 'GT-B03');
  const outdoorUnit: SourceFeature | null =
    template && outdoorFloor
      ? {
          ...template,
          id: BROWSE_IDS.outdoorUnit,
          floorId: outdoorFloor.id,
          unitCode: 'AL-01',
          name: null,
        }
      : null;
  const prayerFacility = source.features.find((f) => f.kind === 'facility' && f.name === 'Musala');

  return {
    ...source,
    features: [
      ...source.features.map((f) =>
        f.id === prayerFacility?.id ? { ...f, facilityTypeId: BROWSE_IDS.prayerType } : f,
      ),
      ...(outdoorUnit ? [outdoorUnit] : []),
    ],
    facilityTypes: [
      ...source.facilityTypes,
      {
        id: BROWSE_IDS.prayerType,
        name: 'Musala',
        icon: 'builtin:prayer-room',
        isSafety: false,
        sortOrder: 2,
      },
    ],
    locationTypes: [
      ...source.locationTypes,
      { id: BROWSE_IDS.roomType, name: 'Ruang', icon: null, color: null, sortOrder: 1, fields: [] },
    ],
    categories: [
      ...source.categories,
      {
        id: BROWSE_IDS.meetingCategory,
        locationTypeId: BROWSE_IDS.roomType,
        name: 'Rapat',
        icon: null,
        sortOrder: 0,
      },
      {
        id: BROWSE_IDS.emptyCategory,
        locationTypeId: IDS.serviceType,
        name: 'Kosong Sementara',
        icon: null,
        sortOrder: 1,
      },
    ],
    locations: [
      ...source.locations,
      location({
        id: BROWSE_IDS.infoDesk,
        name: 'Pusat Informasi',
        locationTypeId: IDS.serviceType,
        categoryIds: [],
        unitIds: [unitId('GF-A02'), unitId('L1-A02')],
        primaryUnitId: unitId('L1-A02'),
      }),
      location({
        id: BROWSE_IDS.eastMeeting,
        name: 'Ruang Rapat Timur',
        locationTypeId: BROWSE_IDS.roomType,
        categoryIds: [BROWSE_IDS.meetingCategory],
        unitIds: [unitId('GT-A01')],
      }),
      location({
        id: BROWSE_IDS.allDay,
        name: '24 Jam Darurat',
        locationTypeId: IDS.serviceType,
        categoryIds: [],
        unitIds: [unitId('GF-A03')],
      }),
      location({
        id: BROWSE_IDS.pond,
        name: 'Émbung Taman',
        locationTypeId: IDS.serviceType,
        categoryIds: [],
        unitIds: outdoorUnit ? [outdoorUnit.id] : [],
      }),
    ],
  };
}
