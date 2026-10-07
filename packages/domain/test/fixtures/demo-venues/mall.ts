import type { SnapshotSource } from '../../../src';
import { dailyHours, type FloorUnit, type FreeFloor, type Pt, VenueBuilder } from './builder';
import {
  angleGap,
  angleOf,
  corridorRun,
  deg,
  ellipse,
  onEllipse,
  type Run,
  r2,
  rect,
} from './freeform';

const STORES: Record<string, readonly string[]> = {
  fashion: [
    'Busana Nusantara',
    'Gaya Kota',
    'Batik Lestari',
    'Denim Kita',
    'Kemeja Rapi',
    'Modis Muda',
  ],
  shoes: ['Langkah Ringan', 'Sepatu Jaya', 'Tas & Koper Prima'],
  electronics: ['Gawai Pintar', 'Elektro Mega', 'Kamera Kilat', 'Komputer Andal'],
  beauty: ['Cantik Alami', 'Wangi Sari', 'Kosmetik Ayu'],
  books: ['Toko Buku Pena', 'Hobi Rakit', 'Alat Tulis Ceria'],
  sports: ['Sport Arena', 'Sepeda Kencang'],
  jewelry: ['Perhiasan Mulia', 'Jam Presisi'],
  kids: ['Dunia Anak', 'Mainan Pelangi'],
  restaurant: [
    'Rumah Makan Padang Sederhana',
    'Sate Senayan',
    'Mie Kocok Bandung',
    'Dapur Peranakan',
    'Sushi Kecil',
  ],
  cafe: ['Kopi Kenangan Pagi', 'Teh Tarik Corner', 'Roti Hangat'],
  bank: ['Bank Sentosa', 'Bank Daerah'],
  optic: ['Optik Terang'],
  salon: ['Salon Rambut Indah', 'Barbershop Tegas'],
};

/** Toko jangkar di ujung sayap barat dan timur per lantai. */
const ANCHORS: Record<string, readonly [string, string]> = {
  GF: ['Sentosa Department Store', 'Supermarket Segar'],
  L1: ['Sentosa Home Living', 'Elektro Mega Megastore'],
  L2: ['Zona Bermain Keluarga', 'Bioskop Sentosa XXI'],
};

/** Jari-jari garis tengah koridor cincin atrium. */
const RING = 20;

const FOOTPRINT: Pt[] = [
  [-180, -30],
  [-150, -30],
  [-150, -17],
  [-36, -17],
  [-36, -36],
  [36, -36],
  [36, -17],
  [150, -17],
  [150, -30],
  [180, -30],
  [180, 30],
  [150, 30],
  [150, 17],
  [36, 17],
  [36, 36],
  [17, 36],
  [17, 125],
  [-17, 125],
  [-17, 36],
  [-36, 36],
  [-36, 17],
  [-150, 17],
  [-150, 30],
  [-180, 30],
];

/**
 * Mal tiga lantai berbentuk T: atrium bundar dua lantai di tengah (eskalator di cincinnya), sayap
 * barat dan timur menuju toko jangkar, sayap utara ke lobi dan lift, pintu selatan ke drop-off.
 */
export function mallVenue(): SnapshotSource {
  const v = new VenueBuilder('demo-mall', 'Mal Demo Sentosa', [106.8229, -6.1945]);
  const shop = v.locationType('shop', 'Toko', '#3b6fb6');
  const food = v.locationType('food', 'Kuliner', '#d9822b');
  const service = v.locationType('service', 'Layanan', '#2f8f6b');
  const categories = [
    ['fashion', shop, 'Fashion', '#7b61c9'],
    ['shoes', shop, 'Sepatu dan Tas', '#9a6b3f'],
    ['electronics', shop, 'Elektronik', '#2f7fc1'],
    ['beauty', shop, 'Kecantikan', '#d0558a'],
    ['books', shop, 'Buku dan Hobi', '#4f8a3c'],
    ['sports', shop, 'Olahraga', '#e0742a'],
    ['jewelry', shop, 'Perhiasan dan Jam', '#b8962e'],
    ['kids', shop, 'Anak dan Mainan', '#e3a019'],
    ['restaurant', food, 'Restoran', '#d2452f'],
    ['cafe', food, 'Kafe', '#8c5a3c'],
    ['bank', service, 'Bank', '#1f6f8b'],
    ['optic', service, 'Optik', '#3d9a8b'],
    ['salon', service, 'Salon dan Barbershop', '#a54aa8'],
  ].map(([key, type, name, color]) => ({
    key: key as string,
    type: type as string,
    id: v.category(type as string, key as string, name as string, color as string),
  }));
  const anchorCategory = v.category(shop, 'anchor', 'Toko Jangkar', '#0f4a91');

  const toiletM = v.facilityType('toilet-male', 'Toilet Pria', 'toilet-male');
  const toiletF = v.facilityType('toilet-female', 'Toilet Wanita', 'toilet-female');
  const toiletA = v.facilityType('toilet-accessible', 'Toilet Difabel', 'toilet-accessible');
  const prayer = v.facilityType('prayer', 'Musala', 'prayer-room');
  const atm = v.facilityType('atm', 'ATM', 'atm');
  const info = v.facilityType('info', 'Informasi', 'information');
  const apar = v.facilityType('apar', 'APAR', 'fire-extinguisher', true);

  const mall = v.freeBuilding({
    key: 'main',
    name: 'Gedung Utama',
    code: 'MS',
    footprint: FOOTPRINT,
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
      { name: 'L2', level: 2 },
    ],
  });
  const [gf, l1, l2] = mall.floors as [FreeFloor, FreeFloor, FreeFloor];
  const rings = new Map<string, Run>();
  const lobbies = new Map<string, string>();
  const wingEnds = new Map<string, { west: string; east: string }>();
  const unitsByFloor = new Map<string, FloorUnit[]>();

  for (const floor of mall.floors) {
    const key = floor.name;
    // Cincin atrium; unit di sisi luar kecuali di mulut empat sayap.
    const ring = corridorRun(v, {
      key: `${key}:ring`,
      floorId: floor.id,
      buildingId: mall.id,
      code: `MS-${key}-R`,
      points: ellipse(RING, RING, 48),
      closed: true,
      width: 6,
      unitWidth: 6.5,
      left: false,
      right: 12,
      skip: (mid) => [0, 90, 180, 270].some((a) => angleGap(angleOf(mid), a) < 21),
    });
    rings.set(key, ring);
    // Lantai dasar: atrium untuk acara; lantai atas: void atrium berpagar.
    if (floor === gf) v.area(`${key}:atrium`, floor.id, 'corridor', ellipse(16.5, 16.5, 40));
    else v.area(`${key}:void`, floor.id, 'non_walkable', ellipse(15.5, 15.5, 40), { height: 1.1 });

    const wing = (side: 'W' | 'E') => {
      const sign = side === 'W' ? -1 : 1;
      const run = corridorRun(v, {
        key: `${key}:wing:${side}`,
        floorId: floor.id,
        buildingId: mall.id,
        code: `MS-${key}-${side}`,
        points: [
          [sign * 23, 0],
          [sign * 150, 0],
        ],
        width: 6,
        unitWidth: 9,
        left: 14,
        right: 14,
        skip: (mid) => Math.abs(mid[0]) < 41,
      });
      v.link(run.first, ring.nearest([sign * RING, 0]), floor.id);
      const [westName, eastName] = ANCHORS[key] ?? ['Toko Jangkar', 'Toko Jangkar'];
      const anchor = v.unit(
        `${key}:anchor:${side}`,
        floor.id,
        mall.id,
        `MS-${key}-${side}ANCHOR`,
        side === 'W' ? rect(-180, -30, -150, 30) : rect(150, -30, 180, 30),
        [sign * 150, 0],
        run.last,
        { height: 6 },
      );
      v.location(anchor, shop, anchorCategory, side === 'W' ? westName : eastName, {
        hours: dailyHours('10:00', '22:00'),
      });
      return run;
    };
    const west = wing('W');
    const east = wing('E');
    const north = corridorRun(v, {
      key: `${key}:wing:N`,
      floorId: floor.id,
      buildingId: mall.id,
      code: `MS-${key}-N`,
      points: [
        [0, 23],
        [0, 110],
      ],
      width: 6,
      unitWidth: 8,
      left: 14,
      right: 14,
      skip: (mid) => mid[1] < 41,
    });
    v.link(north.first, ring.nearest([0, RING]), floor.id);
    v.area(`${key}:lobby`, floor.id, 'corridor', rect(-17, 110, 17, 125));
    const lobby = v.at(`${key}:lobby`, floor.id, [0, 117]);
    v.link(north.last, lobby, floor.id);
    lobbies.set(key, lobby);
    wingEnds.set(key, { west: west.last, east: east.last });
    unitsByFloor.set(key, [...ring.units, ...west.units, ...east.units, ...north.units]);

    // Toilet di ujung sayap, ATM dan informasi di atrium, musala di lantai atas.
    const near = (p: Pt) =>
      [west, east, north, ring]
        .map((r) => r.nearest(p))
        .reduce((best, id) => {
          const d = (x: string) => Math.hypot(v.meterOf(x)[0] - p[0], v.meterOf(x)[1] - p[1]);
          return d(id) < d(best) ? id : best;
        });
    const facility = (k: string, type: string, p: Pt) =>
      v.facilityAt(`${key}:${k}`, floor.id, type, p, near(p));
    facility('toilet-m-w', toiletM, [-146, 2]);
    facility('toilet-f-w', toiletF, [-146, -2]);
    facility('toilet-m-e', toiletM, [146, 2]);
    facility('toilet-f-e', toiletF, [146, -2]);
    facility('toilet-a', toiletA, [12, 120]);
    facility('apar-w', apar, [-90, 2.5]);
    facility('apar-e', apar, [90, 2.5]);
    facility('atm', atm, r2(onEllipse(RING + 2, RING + 2, deg(60))));
    const desk = r2(onEllipse(RING + 2, RING + 2, deg(240)));
    if (floor === gf) facility('info', info, desk);
    else facility('prayer', prayer, desk);
  }

  // Lift di lobi utara, tangga di ujung sayap, eskalator naik/turun di cincin atrium.
  const ringOf = (floor: FreeFloor) => rings.get(floor.name) as Run;
  const lobbyOf = (floor: FreeFloor) => lobbies.get(floor.name) as string;
  const everyFloor = (at: Pt, via: (floor: FreeFloor) => string, floors = mall.floors) =>
    floors.map((floor) => ({ floorId: floor.id, at, path: via(floor) }));
  v.connectorAt('lift-utama', 'elevator', 'Lift Utama', everyFloor([-10, 117], lobbyOf));
  v.connectorAt('lift-barang', 'elevator', 'Lift Barang', everyFloor([10, 112], lobbyOf));
  const endOf = (floor: FreeFloor) => wingEnds.get(floor.name) as { west: string; east: string };
  v.connectorAt(
    'tangga-barat',
    'stairs',
    'Tangga Darurat Barat',
    everyFloor([-146, 9], (f) => endOf(f).west),
  );
  v.connectorAt(
    'tangga-timur',
    'stairs',
    'Tangga Darurat Timur',
    everyFloor([146, -9], (f) => endOf(f).east),
  );
  const escalator = (
    k: string,
    name: string,
    angle: number,
    pair: [FreeFloor, FreeFloor],
    dir: 'up' | 'down',
  ) => {
    const at = r2(onEllipse(RING, RING, deg(angle)));
    v.connectorAt(
      k,
      'escalator',
      name,
      everyFloor(at, (f) => ringOf(f).nearest(at), pair),
      dir,
    );
  };
  escalator('esk-gf-naik', 'Eskalator GF naik', 45, [gf, l1], 'up');
  escalator('esk-l1-turun', 'Eskalator L1 turun', 225, [l1, gf], 'down');
  escalator('esk-l1-naik', 'Eskalator L1 naik', 135, [l1, l2], 'up');
  escalator('esk-l2-turun', 'Eskalator L2 turun', 315, [l2, l1], 'down');

  // Pintu utara (lobi) dan selatan (drop-off), parkir di Area Luar.
  v.area('GF:entrance-south', gf.id, 'corridor', rect(-5, -36, 5, -23));
  const south = v.at('GF:entrance-south', gf.id, [0, -30]);
  v.link(ringOf(gf).nearest([0, -RING]), south, gf.id);
  const outSouth = v.doorAt('south', 'Pintu Selatan', gf.id, [0, -35.5], south, [0, -40]);
  const outNorth = v.doorAt('north', 'Pintu Lobi Utara', gf.id, [0, 124.5], lobbyOf(gf), [0, 129]);
  const parkSouth = v.at('outdoor:park-south', v.outdoorFloorId, [0, -60]);
  const parkNorth = v.at('outdoor:park-north', v.outdoorFloorId, [0, 150]);
  v.link(outSouth, parkSouth, v.outdoorFloorId);
  v.link(outNorth, parkNorth, v.outdoorFloorId);
  v.outdoorPoly('dropoff-selatan', 'road', rect(-60, -52, 60, -42));
  v.outdoorPoly('parkir-selatan', 'parking', rect(-60, -95, 60, -55));
  v.outdoorPoly('parkir-utara', 'parking', rect(-50, 135, 50, 175));
  v.outdoorPoly('taman', 'garden', rect(40, 40, 120, 90));

  let n = 0;
  for (const floor of mall.floors) {
    for (const unit of unitsByFloor.get(floor.name) ?? []) {
      n += 1;
      // Lantai 2 didominasi kuliner, lantai lain campuran.
      const pool =
        floor === l2 ? categories.filter((c) => c.type === food || n % 5 === 0) : categories;
      const category = pool[n % pool.length] ?? categories[0];
      if (!category) continue;
      if (n % 13 === 0) {
        v.vacant(unit);
        continue;
      }
      const names = STORES[category.key] ?? ['Toko'];
      const name = `${names[n % names.length]}${n > names.length * 3 ? ` ${floor.name}` : ''}`;
      const status = n % 31 === 0 ? 'coming_soon' : n % 37 === 0 ? 'inactive_temporary' : 'active';
      v.location(unit, category.type, category.id, name, {
        status,
        openingDate: status === 'coming_soon' ? '2027-01-15' : null,
        hours: dailyHours('10:00', '22:00'),
        customFields: { telepon: `021-555${String(1000 + n)}` },
      });
    }
  }
  v.originAt('lobi-utara', gf.id, lobbyOf(gf), 'Lobi Utara', 'a1b2c3d4e5f6', 180);
  v.originAt(
    'atrium-l2',
    l2.id,
    ringOf(l2).nearest([0, -RING]),
    'Food Court Atrium',
    'a1b2c3d4e5f7',
    0,
  );
  v.infoAt(gf.id, lobbyOf(gf), 'Info Lobi', 'MAL-LOBI', 180);
  v.alias('category', categories[8]?.id ?? '', 'makan');
  v.alias('category', categories[9]?.id ?? '', 'ngopi');
  v.alias('facility_type', toiletM, 'WC');
  v.alias('facility_type', prayer, 'mushola');
  return v.source;
}
