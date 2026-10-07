import type { SnapshotSource } from '../../../src';
import { dailyHours, type FloorUnit, type FreeFloor, type Pt, VenueBuilder } from './builder';
import { corridorRun, type Run, rect } from './freeform';

const ROOMS = [
  ['poli', 'Poli Umum'],
  ['poli', 'Poli Gigi'],
  ['poli', 'Poli Anak'],
  ['poli', 'Poli Mata'],
  ['poli', 'Poli Jantung'],
  ['poli', 'Poli Kandungan'],
  ['poli', 'Poli Saraf'],
  ['poli', 'Poli THT'],
  ['support', 'Laboratorium'],
  ['support', 'Radiologi'],
  ['support', 'Farmasi'],
  ['support', 'Fisioterapi'],
  ['admin', 'Pendaftaran'],
  ['admin', 'Kasir'],
  ['ward', 'Kamar Rawat'],
] as const;

const CATEGORY_COLORS = {
  poli: '#2e7dbb',
  support: '#7a5cc4',
  admin: '#6b7280',
  ward: '#2f8f6b',
} as const;

/** Ruang sayap selatan per lantai: IGD di lantai dasar, kamar operasi di L1. */
const WING_ROOMS: Record<string, readonly string[]> = {
  GF: [
    'IGD',
    'Triase IGD',
    'Resusitasi',
    'Ruang Tindakan IGD',
    'Observasi IGD',
    'Radiologi IGD',
    'Farmasi IGD',
    'Isolasi IGD',
  ],
  L1: [
    'Kamar Operasi 1',
    'Kamar Operasi 2',
    'Kamar Operasi 3',
    'Ruang Pemulihan',
    'ICU',
    'HCU',
    'Sterilisasi',
    'Ruang Persiapan Operasi',
  ],
};

/** Koridor keliling courtyard: garis tengah persegi panjang ±60 × ±35 m. */
const RING: Pt[] = [
  [-60, -35],
  [60, -35],
  [60, 35],
  [-60, 35],
];

/**
 * Rumah sakit empat lantai bercourtyard: koridor keliling taman tengah dengan ruang di sisi luar
 * dan dalam, sayap selatan (IGD di lantai dasar, kamar operasi di L1) dengan pintu ambulans,
 * lobi utama di utara, lift dan tangga di empat sudut.
 */
export function hospitalVenue(): SnapshotSource {
  const v = new VenueBuilder('demo-hospital', 'RS Demo Harapan', [106.8456, -6.2088]);
  const clinic = v.locationType('clinic', 'Poliklinik', '#2e7dbb');
  const support = v.locationType('support', 'Penunjang Medis', '#7a5cc4');
  const admin = v.locationType('admin', 'Administrasi', '#6b7280');
  const ward = v.locationType('ward', 'Rawat Inap', '#2f8f6b');
  const emergency = v.locationType('emergency', 'Gawat Darurat', '#c8321e');
  const typeOf = { poli: clinic, support, admin, ward } as const;
  const category = new Map(
    [...new Set(ROOMS.map(([k, name]) => `${k}:${name}`))].map((key) => {
      const [k, name] = key.split(':') as [keyof typeof typeOf, string];
      return [
        name,
        {
          type: typeOf[k],
          id: v.category(
            typeOf[k],
            name.toLowerCase().replace(/\s+/g, '-'),
            name,
            CATEGORY_COLORS[k],
          ),
        },
      ];
    }),
  );
  const igd = v.category(emergency, 'igd', 'IGD', '#c8321e');
  const surgery = v.category(support, 'bedah', 'Instalasi Bedah', '#5b3fa8');

  const toiletM = v.facilityType('toilet-male', 'Toilet Pria', 'toilet-male');
  const toiletF = v.facilityType('toilet-female', 'Toilet Wanita', 'toilet-female');
  const toiletA = v.facilityType('toilet-accessible', 'Toilet Difabel', 'toilet-accessible');
  const prayer = v.facilityType('prayer', 'Musala', 'prayer-room');
  const firstAid = v.facilityType('first-aid', 'P3K', 'first-aid');
  const exit = v.facilityType('exit', 'Pintu Darurat', 'emergency-exit', true);

  const hospital = v.freeBuilding({
    key: 'main',
    name: 'Gedung Pelayanan',
    code: 'RS',
    footprint: [
      [-76, -51],
      [-15, -51],
      [-15, -90],
      [15, -90],
      [15, -51],
      [76, -51],
      [76, 51],
      [-76, 51],
    ],
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
      { name: 'L2', level: 2 },
      { name: 'L3', level: 3 },
    ],
  });
  const [gf] = hospital.floors as [FreeFloor];
  const rings = new Map<string, Run>();
  const wings = new Map<string, FloorUnit[]>();

  for (const floor of hospital.floors) {
    const key = floor.name;
    const hasWing = Boolean(WING_ROOMS[key]);
    const ring = corridorRun(v, {
      key: `${key}:ring`,
      floorId: floor.id,
      buildingId: hospital.id,
      code: `RS-${key}-R`,
      points: RING,
      closed: true,
      width: 4,
      unitWidth: 10,
      left: 8,
      right: 14,
      // Mulut lobi di tengah utara dan mulut sayap selatan dibiarkan kosong.
      skip: (mid, side) => side === 'right' && Math.abs(mid[0]) < 16 && (mid[1] > 0 || hasWing),
    });
    rings.set(key, ring);
    v.area(`${key}:courtyard`, floor.id, 'non_walkable', rect(-48, -23, 48, 23), {
      color: floor === gf ? '#9cc58f' : '#dfe7d8',
      height: floor === gf ? 0.3 : 1.1,
    });
    v.area(`${key}:lobby`, floor.id, 'corridor', rect(-10, 37, 10, 51));
    const lobby = v.at(`${key}:lobby`, floor.id, [0, 44]);
    v.link(ring.nearest([0, 35]), lobby, floor.id);
    if (floor === gf) {
      const out = v.doorAt('lobby', 'Pintu Lobi Utama', gf.id, [0, 50.5], lobby, [0, 56]);
      const dropoff = v.at('outdoor:dropoff', v.outdoorFloorId, [0, 70]);
      v.link(out, dropoff, v.outdoorFloorId);
      v.originAt('lobby', gf.id, lobby, 'Lobi Utama', 'b1b2c3d4e5f6', 180);
      v.infoAt(gf.id, lobby, 'Info Pendaftaran', 'RS-LOBI', 180);
    }

    if (hasWing) {
      const wing = corridorRun(v, {
        key: `${key}:wing`,
        floorId: floor.id,
        buildingId: hospital.id,
        code: `RS-${key}-S`,
        points: [
          [0, -37],
          [0, -88],
        ],
        width: 5,
        unitWidth: 9,
        left: 12,
        right: 12,
        skip: (mid) => mid[1] > -54,
      });
      v.link(ring.nearest([0, -35]), wing.first, floor.id);
      wings.set(key, wing.units);
      if (floor === gf) {
        v.area('GF:ambulance', gf.id, 'corridor', rect(-6, -90, 6, -86));
        const out = v.doorAt(
          'ambulance',
          'Pintu Ambulans IGD',
          gf.id,
          [0, -89.5],
          wing.last,
          [0, -95],
        );
        const bay = v.at('outdoor:ambulance', v.outdoorFloorId, [0, -105]);
        v.link(out, bay, v.outdoorFloorId);
      }
    }

    const facility = (k: string, type: string, p: Pt) =>
      v.facilityAt(`${key}:${k}`, floor.id, type, p, ring.nearest(p));
    facility('toilet-m', toiletM, [-55, -30]);
    facility('toilet-f', toiletF, [55, -30]);
    facility('toilet-a', toiletA, [-55, 30]);
    if (floor === gf) facility('first-aid', firstAid, [55, 30]);
    else facility('prayer', prayer, [55, 30]);
    facility('exit-w', exit, [-62, 0]);
    facility('exit-e', exit, [62, 0]);
  }

  // Lift dan tangga di empat sudut luar koridor.
  const corner = (k: string, kind: 'elevator' | 'stairs', name: string, at: Pt, via: Pt) =>
    v.connectorAt(
      k,
      kind,
      name,
      hospital.floors.map((floor) => ({
        floorId: floor.id,
        at,
        path: (rings.get(floor.name) as Run).nearest(via),
      })),
    );
  corner('lift-pasien', 'elevator', 'Lift Pasien', [-66, -41], [-60, -35]);
  corner('lift-umum', 'elevator', 'Lift Umum', [66, 41], [60, 35]);
  corner('tangga-barat', 'stairs', 'Tangga Barat Laut', [-66, 41], [-60, 35]);
  corner('tangga-timur', 'stairs', 'Tangga Darurat Tenggara', [66, -41], [60, -35]);

  v.outdoorPoly('dropoff', 'road', rect(-40, 58, 40, 66));
  v.outdoorPoly('parkir', 'parking', rect(-70, 75, 70, 115));
  v.outdoorPoly('jalur-ambulans', 'road', rect(-12, -112, 12, -92));
  v.outdoorPoly('taman', 'garden', rect(85, -40, 120, 40));

  let n = 0;
  for (const floor of hospital.floors) {
    for (const [i, unit] of (wings.get(floor.name) ?? []).entries()) {
      const name = WING_ROOMS[floor.name]?.[i] ?? `Ruang Sayap ${i + 1}`;
      const hours = dailyHours('00:00', '00:00');
      if (floor === gf) v.location(unit, emergency, igd, name, { hours });
      else v.location(unit, support, surgery, name, { hours });
    }
    for (const [i, unit] of ((rings.get(floor.name) as Run).units ?? []).entries()) {
      n += 1;
      const isWard = floor.level >= 2;
      const [, name] = isWard
        ? (['ward', 'Kamar Rawat'] as const)
        : (ROOMS[n % (ROOMS.length - 1)] ?? ROOMS[0]);
      const c = category.get(name);
      if (!c) continue;
      v.location(
        unit,
        c.type,
        c.id,
        isWard ? `Kamar Rawat ${unit.code.slice(-3)}` : `${name} ${floor.name}-${i + 1}`,
        {
          hours: isWard
            ? dailyHours('00:00', '00:00')
            : dailyHours('08:00', '16:00', [0, 1, 2, 3, 4, 5]),
          customFields: { telepon: `ext. ${2000 + n}` },
        },
      );
    }
  }
  v.alias('category', category.get('Radiologi')?.id ?? '', 'rontgen');
  v.alias('category', category.get('Farmasi')?.id ?? '', 'apotek');
  v.alias('category', igd, 'UGD');
  return v.source;
}
