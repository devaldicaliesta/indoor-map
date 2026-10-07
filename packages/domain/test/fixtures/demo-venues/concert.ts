import type { SnapshotSource } from '../../../src';
import { dailyHours, type Pt, VenueBuilder } from './builder';
import {
  angleGap,
  angleOf,
  corridorRun,
  deg,
  ellipse,
  onEllipse,
  r2,
  rect,
  sector,
} from './freeform';

/**
 * Konser di stadion oval (±216 × 164 m): panggung T dengan runway di barat, zona berdiri
 * berpagar di lapangan, tribun bawah dan atas per sektor dengan vomitory, concourse melingkar
 * berisi booth, empat gerbang, dan parkir di Area Luar. Tata letak meniru denah konser stadion.
 */

const FOOTPRINT: Pt = [108, 82];
/** Garis tengah jalur keliling lapangan, concourse luar (L1), dan concourse atas (L2). */
const WALKWAY: Pt = [72, 46];
const CONCOURSE: Pt = [94, 68];
const UPPER: Pt = [80, 54];

const GATES = [
  { key: 'gate-1', name: 'Gerbang 1 (Utama)', angle: 0 },
  { key: 'gate-2', name: 'Gerbang 2 Utara', angle: 90 },
  { key: 'gate-4', name: 'Gerbang 4 Artis & VIP', angle: 180 },
  { key: 'gate-3', name: 'Gerbang 3 Selatan', angle: 270 },
] as const;

const FOOD = [
  'Sate Taichan Gemilang',
  'Bakso Mercon',
  'Martabak Manis Panggung',
  'Nasi Kulit Encore',
  'Dimsum Backstage',
  'Corndog Festival',
  'Mie Ayam Tribun',
  'Kebab Riuh',
  'Seblak Bassline',
  'Ayam Geprek Sorak',
] as const;
const DRINK = [
  'Kopi Kenangan Pagi',
  'Es Teh Jumbo',
  'Jus Segar Encore',
  'Kopi Susu Soundcheck',
  'Air Mineral Point',
] as const;
const MERCH = [
  'Merch Resmi Gemilang',
  'Kaos Tur 2026',
  'Lightstick Center',
  'Poster & Vinyl',
] as const;
const SPONSOR = [
  'Booth Sponsor Telko',
  'Booth Sponsor Bank',
  'Photobooth Sponsor',
  'Booth Minuman Isotonik',
] as const;
const SERVICE = [
  'Penukaran Gelang',
  'Loket Tiket',
  'Penitipan Barang',
  'Loker Penonton',
  'Charging Station',
  'Lost & Found',
] as const;

export function concertVenue(): SnapshotSource {
  const v = new VenueBuilder('demo-concert', 'Konser Demo Gemilang', [106.8019, -6.2183]);
  const audience = v.locationType('audience', 'Area Penonton', '#e11d48');
  const production = v.locationType('production', 'Panggung & Produksi', '#1d2433');
  const seating = v.locationType('seating', 'Tribun', '#0f4a91');
  const food = v.locationType('food', 'Kuliner', '#d9822b');
  const shop = v.locationType('shop', 'Merchandise & Sponsor', '#7b61c9');
  const service = v.locationType('service', 'Layanan Penonton', '#2f8f6b');
  const cat = {
    stage: v.category(production, 'panggung', 'Panggung', '#1d2433'),
    festival: v.category(audience, 'festival', 'Festival', '#e11d48'),
    accessible: v.category(audience, 'aksesibel', 'Area Aksesibel', '#2563eb'),
    vip: v.category(audience, 'vip', 'VIP', '#b8962e'),
    lower: v.category(seating, 'tribun-bawah', 'Tribun Bawah', '#0f4a91'),
    upper: v.category(seating, 'tribun-atas', 'Tribun Atas', '#3b6fb6'),
    skybox: v.category(seating, 'skybox', 'Skybox', '#8a6d1f'),
    food: v.category(food, 'makanan', 'Makanan', '#d9822b'),
    drink: v.category(food, 'minuman', 'Minuman & Kopi', '#8c5a3c'),
    merch: v.category(shop, 'merchandise', 'Merchandise', '#7b61c9'),
    sponsor: v.category(shop, 'sponsor', 'Sponsor', '#0b7a75'),
    service: v.category(service, 'layanan', 'Layanan Penonton', '#2f8f6b'),
  };
  const fac = {
    toiletM: v.facilityType('toilet-male', 'Toilet Pria', 'toilet-male'),
    toiletF: v.facilityType('toilet-female', 'Toilet Wanita', 'toilet-female'),
    toiletA: v.facilityType('toilet-accessible', 'Toilet Difabel', 'toilet-accessible'),
    medic: v.facilityType('medic', 'Pos Medis', 'first-aid'),
    info: v.facilityType('info', 'Informasi', 'information'),
    prayer: v.facilityType('prayer', 'Musala', 'prayer-room'),
    atm: v.facilityType('atm', 'ATM', 'atm'),
    apar: v.facilityType('apar', 'APAR', 'fire-extinguisher', true),
    exit: v.facilityType('exit', 'Pintu Darurat', 'emergency-exit', true),
    assembly: v.facilityType('assembly', 'Titik Kumpul', 'assembly-point', true),
    parking: v.facilityType('parking', 'Parkir', 'parking'),
  };

  const stadium = v.freeBuilding({
    key: 'stadium',
    name: 'Stadion Demo Gemilang',
    code: 'SG',
    footprint: ellipse(FOOTPRINT[0], FOOTPRINT[1], 72),
    floors: [
      { name: 'L1', level: 0 },
      { name: 'L2', level: 1 },
    ],
  });
  const [l1, l2] = stadium.floors as [(typeof stadium.floors)[0], (typeof stadium.floors)[0]];
  const event = dailyHours('15:00', '23:30');
  let n = 0;
  const locate = (
    unit: ReturnType<typeof v.unit>,
    type: string,
    category: string,
    name: string,
    extra: Parameters<typeof v.location>[4] = {},
  ) => {
    n += 1;
    v.location(unit, type, category, name, {
      hours: event,
      customFields: { telepon: `0812-7000-${String(1000 + n)}` },
      ...extra,
    });
  };

  // --- L1: lapangan ---------------------------------------------------------------------------
  // Jalur keliling lapangan; tribun bawah di sisi luarnya, celah antar-sektor jadi vomitory.
  const backstageAngle = (p: Pt) => angleGap(angleOf(p, WALKWAY[0], WALKWAY[1]), 180) < 40;
  const walkway = corridorRun(v, {
    key: 'l1:walkway',
    floorId: l1.id,
    buildingId: stadium.id,
    code: 'SG-L1-T',
    points: ellipse(WALKWAY[0], WALKWAY[1], 72),
    closed: true,
    width: 4,
    unitWidth: 20,
    spacing: 4,
    left: false,
    right: 16,
    skip: (mid) => backstageAngle(mid),
    unitExtra: { height: 6 },
  });
  walkway.right.forEach((unit, i) => {
    locate(unit, seating, cat.lower, `Tribun ${i + 1}`);
  });

  const stage = v.unit(
    'l1:stage',
    l1.id,
    stadium.id,
    'SG-L1-STAGE',
    [
      [-62, -16],
      [-48, -16],
      [-48, -3.5],
      [-31, -3.5],
      [-31, 3.5],
      [-48, 3.5],
      [-48, 16],
      [-62, 16],
    ],
    [-62, 0],
    walkway.nearest([-72, 0]),
    { height: 2 },
  );
  locate(stage, production, cat.stage, 'Panggung Utama', { hours: dailyHours('18:30', '23:00') });
  const backstage = v.unit(
    'l1:backstage',
    l1.id,
    stadium.id,
    'SG-L1-BACK',
    sector([74.4, 48.4], [89.6, 63.6], deg(156), deg(204), 10),
    onEllipse(74.4, 48.4, Math.PI),
    walkway.nearest([-72, 0]),
    { height: 5 },
  );
  locate(backstage, production, cat.stage, 'Backstage & Ruang Artis', {
    description: 'Khusus kru dan artis.',
  });

  // Dua lorong barikade utara–selatan di lapangan; pintu zona menempel ke lorong terdekat.
  const aisle = (key: string, x: number) => {
    v.area(`l1:aisle:${key}`, l1.id, 'corridor', rect(x - 1, -41.5, x + 1, 41.5));
    const nodes = [-41, -20, 0, 20, 41].map((y) => v.at(`l1:aisle:${key}:${y}`, l1.id, [x, y]));
    for (let i = 1; i < nodes.length; i += 1)
      v.link(nodes[i - 1] as string, nodes[i] as string, l1.id);
    v.link(nodes[0] as string, walkway.nearest([x, -46]), l1.id);
    v.link(nodes[nodes.length - 1] as string, walkway.nearest([x, 46]), l1.id);
    return (p: Pt) =>
      nodes.reduce((best, id) =>
        Math.hypot(v.meterOf(id)[1] - p[1], v.meterOf(id)[0] - p[0]) <
        Math.hypot(v.meterOf(best)[1] - p[1], v.meterOf(best)[0] - p[0])
          ? id
          : best,
      );
  };
  const west = aisle('barat', -20);
  const east = aisle('timur', 12);
  const zone = (
    key: string,
    ring: Pt[],
    door: Pt,
    via: (p: Pt) => string,
    category: string,
    name: string,
  ) => {
    const unit = v.unit(
      `l1:zone:${key}`,
      l1.id,
      stadium.id,
      `SG-L1-${key.toUpperCase()}`,
      ring,
      door,
      via(door),
      {
        height: 0.3,
      },
    );
    locate(unit, audience, category, name, { hours: dailyHours('16:00', '23:30') });
  };
  zone('fa-n', rect(-46, 5, -22, 26), [-22, 15.5], west, cat.festival, 'Festival A Utara');
  zone('fa-s', rect(-46, -26, -22, -5), [-22, -15.5], west, cat.festival, 'Festival A Selatan');
  zone('pit', rect(-30, -4.2, -22, 4.2), [-22, 0], west, cat.festival, 'Moshpit');
  zone('fb', rect(-18, -34, 10, 34), [-18, 0], west, cat.festival, 'Festival B');
  zone('dis', rect(14, 24, 26, 32), [14, 28], east, cat.accessible, 'Area Disabilitas');
  zone('vip', rect(14, -33, 26, -25), [14, -29], east, cat.vip, 'VIP Seating');
  zone('fc', rect(26, -24, 50, 22), [26, -10], east, cat.festival, 'Festival C');
  v.area('l1:foh', l1.id, 'non_walkable', rect(16, -3, 22, 3), { height: 7, color: '#3a3f4b' });
  v.landmarkAt('l1:foh:landmark', l1.id, [19, 0], 'Menara FOH');
  v.facilityAt(
    'l1:medic-field',
    l1.id,
    fac.medic,
    [-20, -38],
    west([-20, -38]),
    'Pos Medis Lapangan',
  );

  // --- L1: concourse luar, booth, gerbang -----------------------------------------------------
  const nearGate = (p: Pt, spread = 5) =>
    GATES.some((g) => angleGap(angleOf(p, CONCOURSE[0], CONCOURSE[1]), g.angle) < spread);
  const concourse = corridorRun(v, {
    key: 'l1:concourse',
    floorId: l1.id,
    buildingId: stadium.id,
    code: 'SG-L1-K',
    points: ellipse(CONCOURSE[0], CONCOURSE[1], 80),
    closed: true,
    width: 5,
    unitWidth: 7.5,
    spacing: 0.4,
    left: false,
    right: 7,
    skip: (mid) => nearGate(mid),
    unitExtra: { height: 3.5 },
  });
  const pools: [string, string, readonly string[]][] = [
    [food, cat.food, FOOD],
    [food, cat.drink, DRINK],
    [food, cat.food, FOOD],
    [shop, cat.merch, MERCH],
    [food, cat.drink, DRINK],
    [shop, cat.sponsor, SPONSOR],
    [service, cat.service, SERVICE],
  ];
  const used = new Map<string, number>();
  concourse.right.forEach((unit, i) => {
    if (i % 17 === 9) {
      v.vacant(unit);
      return;
    }
    const [type, category, names] = pools[i % pools.length] as (typeof pools)[number];
    const base = names[Math.floor(i / pools.length) % names.length] as string;
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    locate(unit, type, category, count > 1 ? `${base} ${count}` : base);
  });

  // Vomitory: celah antar-sektor tribun menembus ke concourse.
  for (const [i, g] of walkway.gaps.entries()) {
    if (backstageAngle(g.mid)) continue;
    const out: Pt = [-g.normal[0], -g.normal[1]];
    const tangent: Pt = [g.normal[1], -g.normal[0]];
    const at = (d: number, t: number): Pt =>
      r2([g.mid[0] + out[0] * d + tangent[0] * t, g.mid[1] + out[1] * d + tangent[1] * t]);
    v.area(`l1:vom:${i}`, l1.id, 'corridor', [
      at(2, -1.6),
      at(2, 1.6),
      at(19.5, 1.6),
      at(19.5, -1.6),
    ]);
    const end = v.at(`l1:vom:${i}:end`, l1.id, at(19.5, 0));
    v.link(g.path, end, l1.id);
    v.link(end, concourse.nearest(at(21, 0)), l1.id);
  }

  // Gerbang menembus deretan booth ke Area Luar.
  const outdoorRing = ellipse(118, 92, 32).map((p, i) =>
    v.at(`outdoor:ring:${i}`, v.outdoorFloorId, r2(p)),
  );
  for (const [i, id] of outdoorRing.entries()) {
    v.link(id, outdoorRing[(i + 1) % outdoorRing.length] as string, v.outdoorFloorId);
  }
  const nearestOutdoor = (p: Pt) =>
    outdoorRing.reduce((best, id) =>
      Math.hypot(v.meterOf(id)[0] - p[0], v.meterOf(id)[1] - p[1]) <
      Math.hypot(v.meterOf(best)[0] - p[0], v.meterOf(best)[1] - p[1])
        ? id
        : best,
    );
  const gateNodes = new Map<string, string>();
  for (const gate of GATES) {
    const a = deg(gate.angle);
    const t = deg(gate.angle + 90);
    const tangent: Pt = [Math.cos(t), Math.sin(t)];
    const edge = (r: Pt, side: number): Pt => {
      const p = onEllipse(r[0], r[1], a);
      return r2([p[0] + tangent[0] * side, p[1] + tangent[1] * side]);
    };
    v.area(`l1:${gate.key}:passage`, l1.id, 'corridor', [
      edge([96, 70], -3),
      edge([96, 70], 3),
      edge([106, 80], 3),
      edge([106, 80], -3),
    ]);
    const inside = r2(onEllipse(101, 75, a));
    const outside = r2(onEllipse(112, 86, a));
    const path = concourse.nearest(onEllipse(CONCOURSE[0], CONCOURSE[1], a));
    gateNodes.set(gate.key, path);
    const out = v.doorAt(gate.key, gate.name, l1.id, inside, path, outside);
    v.link(out, nearestOutdoor(outside), v.outdoorFloorId);
  }

  // Fasilitas di tepi dalam concourse.
  const onConcourse = (angle: number): Pt => r2(onEllipse(92.6, 66.6, deg(angle)));
  const facility = (key: string, type: string, angle: number, name: string | null = null) =>
    v.facilityAt(
      `l1:${key}`,
      l1.id,
      type,
      onConcourse(angle),
      concourse.nearest(onConcourse(angle)),
      name,
    );
  for (const a of [40, 140, 220, 320]) {
    facility(`toilet-m-${a}`, fac.toiletM, a - 3);
    facility(`toilet-f-${a}`, fac.toiletF, a + 3);
  }
  facility('toilet-a-100', fac.toiletA, 103);
  facility('toilet-a-260', fac.toiletA, 257);
  facility('medic', fac.medic, 12, 'Tenda Medis Utama');
  facility('info', fac.info, -8, 'Pusat Informasi');
  facility('prayer', fac.prayer, 200, 'Musala Stadion');
  facility('atm-80', fac.atm, 80);
  facility('atm-280', fac.atm, 280);
  for (const a of [25, 115, 165, 245, 335]) facility(`apar-${a}`, fac.apar, a);
  for (const a of [60, 120, 240, 300]) facility(`exit-${a}`, fac.exit, a, 'Pintu Darurat');

  // --- L2: tribun atas dan skybox ---------------------------------------------------------------
  const skyboxSide = (p: Pt) => {
    const a = angleOf(p, UPPER[0], UPPER[1]);
    return (a > 62 && a < 118) || (a > 242 && a < 298);
  };
  const upper = corridorRun(v, {
    key: 'l2:concourse',
    floorId: l2.id,
    buildingId: stadium.id,
    code: 'SG-L2-T',
    points: ellipse(UPPER[0], UPPER[1], 72),
    closed: true,
    width: 4,
    unitWidth: 22,
    spacing: 3.5,
    left: 6,
    right: 20,
    skip: (mid, side) => side === 'left' && !skyboxSide(mid),
    unitExtra: { height: 8 },
  });
  upper.right.forEach((unit, i) => {
    locate(unit, seating, cat.upper, `Tribun Atas ${i + 1}`);
  });
  upper.left.forEach((unit, i) => {
    locate(unit, seating, cat.skybox, `Skybox ${String.fromCharCode(65 + i)}`, {
      description: 'Ruang VIP tertutup dengan pemandangan panggung.',
    });
  });
  for (const a of [70, 110, 250, 290]) {
    const p = r2(onEllipse(UPPER[0] - 1.5, UPPER[1] - 1.5, deg(a)));
    v.facilityAt(`l2:toilet-${a}`, l2.id, a < 180 ? fac.toiletM : fac.toiletF, p, upper.nearest(p));
  }

  // Tangga dan lift antara concourse L1 dan concourse atas.
  const stairsAt = [30, 150, 210, 330];
  for (const a of stairsAt) {
    const lower = r2(onEllipse(92.6, 66.6, deg(a)));
    const top = r2(onEllipse(UPPER[0], UPPER[1], deg(a + 4)));
    v.connectorAt(`stairs-${a}`, 'stairs', `Tangga Tribun ${a}`, [
      { floorId: l1.id, at: lower, path: concourse.nearest(lower) },
      { floorId: l2.id, at: top, path: upper.nearest(top) },
    ]);
  }
  for (const [a, name] of [
    [97, 'Lift Utara'],
    [263, 'Lift Selatan'],
  ] as const) {
    const lower = r2(onEllipse(92.6, 66.6, deg(a)));
    const top = r2(onEllipse(UPPER[0], UPPER[1], deg(a)));
    v.connectorAt(`lift-${a}`, 'elevator', name, [
      { floorId: l1.id, at: lower, path: concourse.nearest(lower) },
      { floorId: l2.id, at: top, path: upper.nearest(top) },
    ]);
  }

  // --- Area Luar ----------------------------------------------------------------------------------
  v.outdoorPoly('parkir-timur', 'parking', rect(124, -48, 190, 48));
  v.outdoorPoly('parkir-barat', 'parking', rect(-190, -48, -124, 48));
  v.outdoorPoly('taman-utara', 'garden', rect(-90, 98, 90, 118));
  v.outdoorPoly('jalan-selatan', 'road', rect(-130, -114, 130, -100));
  v.facilityAt(
    'outdoor:assembly',
    v.outdoorFloorId,
    fac.assembly,
    [150, 62],
    nearestOutdoor([150, 62]),
    'Titik Kumpul Timur',
  );
  v.facilityAt(
    'outdoor:parking-e',
    v.outdoorFloorId,
    fac.parking,
    [157, 0],
    nearestOutdoor([157, 0]),
    'Parkir Timur',
  );
  v.facilityAt(
    'outdoor:parking-w',
    v.outdoorFloorId,
    fac.parking,
    [-157, 0],
    nearestOutdoor([-157, 0]),
    'Parkir Barat',
  );

  const gate1 = gateNodes.get('gate-1') as string;
  v.originAt('gate-1', l1.id, gate1, 'Gerbang 1 (Utama)', 'k1b2c3d4e5f6', 270);
  v.originAt(
    'gate-2',
    l1.id,
    gateNodes.get('gate-2') as string,
    'Gerbang 2 Utara',
    'k1b2c3d4e5f7',
    180,
  );
  v.infoAt(l1.id, gate1, 'Info Gerbang 1', 'KONSER-G1', 270);
  v.alias('category', cat.festival, 'festival');
  v.alias('category', cat.food, 'makan');
  v.alias('category', cat.merch, 'merch');
  v.alias('facility_type', fac.toiletM, 'WC');
  v.alias('facility_type', fac.medic, 'P3K');
  return v.source;
}
