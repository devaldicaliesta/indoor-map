import type { SnapshotSource } from '../../../src';
import { dailyHours, VenueBuilder } from './builder';

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

/** Rumah sakit empat lantai, ±110 ruang, dua lift (pasien dan umum), tangga, IGD 24 jam. */
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

  const toiletM = v.facilityType('toilet-male', 'Toilet Pria', 'toilet-male');
  const toiletF = v.facilityType('toilet-female', 'Toilet Wanita', 'toilet-female');
  const toiletA = v.facilityType('toilet-accessible', 'Toilet Difabel', 'toilet-accessible');
  const prayer = v.facilityType('prayer', 'Musala', 'prayer-room');
  const firstAid = v.facilityType('first-aid', 'P3K', 'first-aid');
  const exit = v.facilityType('exit', 'Pintu Darurat', 'emergency-exit', true);

  const building = v.building({
    key: 'main',
    name: 'Gedung Pelayanan',
    code: 'RS',
    x: -80,
    y: -22,
    width: 160,
    depth: 44,
    unitWidth: 10,
    unitDepth: 16,
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
      { name: 'L2', level: 2 },
      { name: 'L3', level: 3 },
    ],
  });
  const [gf] = building.floors;
  if (!gf) throw new Error('lantai dasar tidak ada');
  v.connector(building, 'elevator', 'Lift Pasien', 'west', building.floors);
  v.connector(building, 'elevator', 'Lift Umum', 'east', building.floors);
  v.connector(building, 'stairs', 'Tangga Darurat', 'east', building.floors, { offset: -6 });
  for (const floor of building.floors) {
    v.facility(building, floor, toiletM, 'west', 0);
    v.facility(building, floor, toiletF, 'west', 1);
    v.facility(building, floor, toiletA, 'west', 2);
    v.facility(building, floor, exit, 'east', 0);
    v.facility(building, floor, floor === gf ? firstAid : prayer, 'east', 1);
  }

  let n = 0;
  for (const floor of building.floors) {
    for (const [i, unit] of floor.units.entries()) {
      n += 1;
      if (floor === gf && i === 0) {
        v.location(unit, emergency, igd, 'IGD', { hours: dailyHours('00:00', '00:00') });
        continue;
      }
      const ward = floor.level >= 2;
      const [, name] = ward
        ? (['ward', 'Kamar Rawat'] as const)
        : (ROOMS[n % (ROOMS.length - 1)] ?? ROOMS[0]);
      const c = category.get(name);
      if (!c) continue;
      v.location(
        unit,
        c.type,
        c.id,
        ward ? `Kamar Rawat ${unit.code.slice(-3)}` : `${name} ${floor.name}-${i + 1}`,
        {
          hours: ward
            ? dailyHours('00:00', '00:00')
            : dailyHours('08:00', '16:00', [0, 1, 2, 3, 4, 5]),
          customFields: { telepon: `ext. ${2000 + n}` },
        },
      );
    }
  }
  v.originPoint(building, gf, 'Lobi Utama', 'b1b2c3d4e5f6');
  v.infoPoint(gf, 'Info Pendaftaran', 'RS-LOBI');
  v.alias('category', category.get('Radiologi')?.id ?? '', 'rontgen');
  v.alias('category', category.get('Farmasi')?.id ?? '', 'apotek');
  v.alias('category', igd, 'UGD');
  return v.source;
}
