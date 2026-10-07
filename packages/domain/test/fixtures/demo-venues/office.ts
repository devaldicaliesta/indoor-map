import type { SnapshotSource } from '../../../src';
import { dailyHours, type FloorUnit, type FreeFloor, type Pt, VenueBuilder } from './builder';
import { corridorRun, type Run, rect } from './freeform';

/** Penyewa kantor fiktif per bidang; nama sengaja tidak memakai merek nyata. */
const COMPANIES: Record<string, readonly string[]> = {
  tech: [
    'PT Arunika Teknologi',
    'PT Nusantara Data Cerdas',
    'PT Awan Biru Digital',
    'PT Sinyal Kencana',
    'Studio Aplikasi Rimba',
  ],
  finance: [
    'PT Samudra Finansial',
    'PT Pundi Sejahtera',
    'Koperasi Karyawan Sinergi',
    'PT Asuransi Teduh',
  ],
  law: ['Kantor Hukum Wibisana & Rekan', 'Kantor Notaris Anggraini', 'Konsultan Pajak Mitra'],
  consulting: ['PT Cakrawala Konsultan', 'PT Strategi Andalan', 'PT Riset Pasar Kita'],
  creative: ['Studio Kreatif Lentera', 'Agensi Iklan Gemilang', 'Rumah Produksi Layar'],
  energy: ['PT Bumi Energi Lestari', 'PT Surya Terbarukan'],
};

/** Garis tengah koridor keliling inti gedung (±28 × ±18 m). */
const RING: Pt[] = [
  [-28, -18],
  [28, -18],
  [28, 18],
  [-28, 18],
];

/**
 * Suite sudut berbentuk L di sudut timur laut; sudut lain dicerminkan. Batasnya mengikuti ruang
 * yang dikosongkan `corridorRun` di sekitar belokan (lebar koridor/2 + kedalaman unit).
 */
const CORNER_SUITE: Pt[] = [
  [16.5, 19.5],
  [29.5, 19.5],
  [29.5, 6.5],
  [39.5, 6.5],
  [39.5, 29.5],
  [16.5, 29.5],
];

/**
 * Menara perkantoran enam lantai berinti tengah: lift, tangga, dan toilet di inti; koridor
 * keliling; kantor penyewa di sisi luar dengan suite sudut berbentuk L; lobi berpintu di selatan.
 */
export function officeVenue(): SnapshotSource {
  const v = new VenueBuilder('demo-office', 'Menara Demo Sinergi', [106.8133, -6.2215]);
  const office = v.locationType('office', 'Kantor Penyewa', '#3b6fb6');
  const meeting = v.locationType('meeting', 'Ruang Rapat', '#7a5cc4');
  const food = v.locationType('food', 'Kuliner', '#d9822b');
  const service = v.locationType('service', 'Layanan Gedung', '#2f8f6b');
  const sector = {
    tech: v.category(office, 'teknologi', 'Teknologi', '#2f7fc1'),
    finance: v.category(office, 'keuangan', 'Keuangan', '#1f6f8b'),
    law: v.category(office, 'hukum', 'Hukum dan Pajak', '#6b7280'),
    consulting: v.category(office, 'konsultan', 'Konsultan', '#4f8a3c'),
    creative: v.category(office, 'kreatif', 'Kreatif dan Media', '#d0558a'),
    energy: v.category(office, 'energi', 'Energi', '#e0742a'),
  } as const;
  const room = {
    small: v.category(meeting, 'rapat-kecil', 'Rapat Kecil (≤ 8 orang)', '#9a7fd6'),
    large: v.category(meeting, 'rapat-besar', 'Rapat Besar dan Aula', '#5b3fa8'),
  };
  const eat = {
    cafeteria: v.category(food, 'kafetaria', 'Kafetaria', '#d2452f'),
    coffee: v.category(food, 'kopi', 'Kopi dan Roti', '#8c5a3c'),
  };
  const care = {
    management: v.category(service, 'manajemen', 'Manajemen Gedung', '#2f8f6b'),
    clinic: v.category(service, 'klinik', 'Klinik Karyawan', '#c8321e'),
    gym: v.category(service, 'kebugaran', 'Pusat Kebugaran', '#e3a019'),
    daycare: v.category(service, 'penitipan-anak', 'Penitipan Anak', '#3d9a8b'),
  };

  const toiletM = v.facilityType('toilet-male', 'Toilet Pria', 'toilet-male');
  const toiletF = v.facilityType('toilet-female', 'Toilet Wanita', 'toilet-female');
  const toiletA = v.facilityType('toilet-accessible', 'Toilet Difabel', 'toilet-accessible');
  const prayer = v.facilityType('prayer', 'Musala', 'prayer-room');
  const atm = v.facilityType('atm', 'ATM', 'atm');
  const info = v.facilityType('info', 'Resepsionis', 'information');
  const exit = v.facilityType('exit', 'Pintu Darurat', 'emergency-exit', true);

  const tower = v.freeBuilding({
    key: 'tower',
    name: 'Menara Sinergi',
    code: 'MS',
    footprint: rect(-39.5, -29.5, 39.5, 29.5),
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
      { name: 'L2', level: 2 },
      { name: 'L3', level: 3 },
      { name: 'L5', level: 4 },
      { name: 'L6', level: 5 },
    ],
  });
  const [gf, l1] = tower.floors as [FreeFloor, FreeFloor];
  const rings = new Map<string, Run>();
  const unitsByFloor = new Map<string, FloorUnit[]>();

  for (const floor of tower.floors) {
    const key = floor.name;
    const ring = corridorRun(v, {
      key: `${key}:ring`,
      floorId: floor.id,
      buildingId: tower.id,
      code: `MS-${key}-`,
      points: RING,
      closed: true,
      width: 3,
      unitWidth: 5,
      left: false,
      right: 10,
      // Lantai dasar: mulut lobi di tengah selatan.
      skip: (mid) => floor === gf && mid[1] < 0 && Math.abs(mid[0]) < 7,
    });
    rings.set(key, ring);
    v.area(`${key}:core`, floor.id, 'non_walkable', rect(-25.5, -15.5, 25.5, 15.5), {
      color: '#c9ccd3',
      height: 4.5,
    });
    const suites = ([1, -1] as const).flatMap((sx) =>
      ([1, -1] as const).map((sy) => {
        const ring2 = CORNER_SUITE.map(([x, y]) => [x * sx, y * sy] as const);
        const door: Pt = [23 * sx, 19.5 * sy];
        return v.unit(
          `${key}:suite:${sx}:${sy}`,
          floor.id,
          tower.id,
          `MS-${key}-S${sy > 0 ? 'U' : 'S'}${sx > 0 ? 'T' : 'B'}`,
          ring2,
          door,
          ring.nearest(door),
        );
      }),
    );
    unitsByFloor.set(key, [...ring.units, ...suites]);
    const facility = (k: string, type: string, p: Pt) =>
      v.facilityAt(`${key}:${k}`, floor.id, type, p, ring.nearest(p));
    facility('toilet-m', toiletM, [-12, 17]);
    facility('toilet-f', toiletF, [-6, 17]);
    facility('toilet-a', toiletA, [12, 17]);
    facility('exit', exit, [28, 0]);
    if (floor === gf) {
      facility('info', info, [0, -20]);
      facility('atm', atm, [8, -17]);
    } else facility('prayer', prayer, [12, -17]);
  }

  // Lift dan tangga di sisi inti, eskalator lobi ke L1.
  const along = (
    k: string,
    kind: 'elevator' | 'stairs',
    name: string,
    at: Pt,
    floors = tower.floors,
  ) =>
    v.connectorAt(
      k,
      kind,
      name,
      floors.map((floor) => ({
        floorId: floor.id,
        at,
        path: (rings.get(floor.name) as Run).nearest(at),
      })),
    );
  along('lift-a', 'elevator', 'Lift Penumpang A', [-6, -17]);
  along('lift-b', 'elevator', 'Lift Penumpang B', [6, -17]);
  along('lift-barang', 'elevator', 'Lift Barang', [0, 17]);
  along('tangga-barat', 'stairs', 'Tangga Darurat Barat', [-27, 6]);
  along('tangga-timur', 'stairs', 'Tangga Darurat Timur', [27, -6]);
  const escalator = (
    k: string,
    name: string,
    at: Pt,
    pair: [FreeFloor, FreeFloor],
    dir: 'up' | 'down',
  ) =>
    v.connectorAt(
      k,
      'escalator',
      name,
      pair.map((floor) => ({
        floorId: floor.id,
        at,
        path: (rings.get(floor.name) as Run).nearest(at),
      })),
      dir,
    );
  escalator('esk-naik', 'Eskalator Lobi naik', [-18, -18], [gf, l1], 'up');
  escalator('esk-turun', 'Eskalator Lobi turun', [18, -18], [l1, gf], 'down');

  v.area('GF:lobby', gf.id, 'corridor', rect(-6, -29.5, 6, -19.5));
  const lobby = v.at('GF:lobby', gf.id, [0, -24]);
  v.link((rings.get('GF') as Run).nearest([0, -18]), lobby, gf.id);
  const out = v.doorAt('lobby', 'Pintu Lobi Selatan', gf.id, [0, -29], lobby, [0, -34]);
  const dropoff = v.at('outdoor:dropoff', v.outdoorFloorId, [0, -44]);
  v.link(out, dropoff, v.outdoorFloorId);
  v.outdoorPoly('dropoff', 'road', rect(-30, -48, 30, -38));
  v.outdoorPoly('parkir', 'parking', rect(-45, -92, 45, -52));
  v.outdoorPoly('taman', 'garden', rect(46, -25, 74, 25));

  const sectors = Object.keys(COMPANIES) as (keyof typeof COMPANIES & keyof typeof sector)[];
  let n = 0;
  tower.floors.forEach((floor, fi) => {
    (unitsByFloor.get(floor.name) ?? []).forEach((unit, i) => {
      n += 1;
      const hours = dailyHours('08:00', '18:00', [0, 1, 2, 3, 4]);
      if (floor === gf) {
        // Lantai dasar: layanan gedung, kafetaria, dan kedai kopi.
        const plan = [
          [service, care.management, 'Pengelola Gedung'],
          [service, care.management, 'Keamanan dan Kartu Akses'],
          [food, eat.coffee, 'Kopi Pagi Sinergi'],
          [food, eat.coffee, 'Roti dan Teh Halte'],
          [service, care.clinic, 'Klinik Karyawan'],
          [service, care.daycare, 'Penitipan Anak Pelangi'],
        ] as const;
        const pick = plan[i];
        if (pick) {
          v.location(unit, pick[0], pick[1], pick[2], {
            hours: pick[1] === eat.coffee ? dailyHours('07:00', '19:00') : hours,
          });
        } else {
          v.location(unit, food, eat.cafeteria, `Kafetaria Gerai ${i - plan.length + 1}`, {
            hours: dailyHours('10:00', '15:00', [0, 1, 2, 3, 4]),
          });
        }
        return;
      }
      if (i % 9 === 0) {
        v.location(unit, meeting, room.large, `Aula ${floor.name}-${i / 9 + 1}`, { hours });
        return;
      }
      if (i % 4 === 0) {
        v.location(unit, meeting, room.small, `Ruang Rapat ${floor.name}-${i + 1}`, { hours });
        return;
      }
      if (fi === 2 && i === 1) {
        v.location(unit, service, care.gym, 'Pusat Kebugaran Sinergi', {
          hours: dailyHours('06:00', '21:00'),
        });
        return;
      }
      if (n % 11 === 0) {
        v.vacant(unit);
        return;
      }
      const key = sectors[n % sectors.length] ?? 'tech';
      const names = COMPANIES[key] ?? ['PT Penyewa'];
      const name = names[Math.floor(n / sectors.length) % names.length] ?? 'PT Penyewa';
      const status = n % 17 === 0 ? 'coming_soon' : 'active';
      v.location(unit, office, sector[key], `${name} · ${floor.name}`, {
        status,
        openingDate: status === 'coming_soon' ? '2026-12-01' : null,
        hours,
        customFields: { telepon: `021-2950${String(100 + n)}` },
      });
    });
  });
  v.originAt('lobby', gf.id, lobby, 'Lobi Utama Menara', 'f1b2c3d4e5f6', 0);
  v.originAt(
    'l1-lift',
    l1.id,
    (rings.get('L1') as Run).nearest([0, -18]),
    'Lobi Lift L1',
    'f1b2c3d4e5f7',
    0,
  );
  v.infoAt(gf.id, lobby, 'Info Resepsionis', 'MENARA-LOBI', 0);
  v.alias('category', care.management, 'resepsionis');
  v.alias('category', eat.coffee, 'ngopi');
  v.alias('category', room.small, 'meeting');
  v.alias('facility_type', prayer, 'mushola');
  return v.source;
}
