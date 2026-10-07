import type { SnapshotSource } from '../../../src';
import { type BuiltFloor, dailyHours, VenueBuilder } from './builder';

const RETAIL = [
  'Oleh-oleh Khas Nusantara',
  'Toko Buku Perjalanan',
  'Gawai dan Aksesori',
  'Batik Bandara',
  'Kosmetik Bebas Bea',
  'Apotek Terminal',
];
const FOOD = [
  'Kopi Landasan',
  'Bakso Pilot',
  'Nasi Goreng Awan',
  'Roti Boarding',
  'Warung Soto Terbang',
  'Teh Tarik Transit',
  'Sushi Gerbang',
];
const AIRLINES = ['Garuda Biru', 'Nusa Air', 'Rajawali Express', 'Angkasa Jaya', 'Pelangi Air'];

/**
 * Bandara dua terminal (keberangkatan tiga lantai, kedatangan dua lantai) yang dihubungkan jalur
 * Area Luar; gerbang, konter check-in, lounge, ritel, kuliner, dan layanan penumpang.
 */
export function airportVenue(): SnapshotSource {
  const v = new VenueBuilder('demo-airport', 'Bandara Demo Nusantara', [106.6559, -6.1256]);
  const gate = v.locationType('gate', 'Gerbang', '#1f6f8b');
  const checkin = v.locationType('checkin', 'Check-in', '#3b6fb6');
  const shop = v.locationType('retail', 'Ritel', '#7b61c9');
  const food = v.locationType('food', 'Kuliner', '#d9822b');
  const service = v.locationType('service', 'Layanan Penumpang', '#2f8f6b');
  const cats = {
    domestic: v.category(gate, 'domestik', 'Gerbang Domestik', '#1f6f8b'),
    international: v.category(gate, 'internasional', 'Gerbang Internasional', '#0f4a91'),
    counter: v.category(checkin, 'konter', 'Konter Maskapai', '#3b6fb6'),
    selfCheckin: v.category(checkin, 'mandiri', 'Check-in Mandiri', '#5b8fd6'),
    souvenir: v.category(shop, 'oleh-oleh', 'Oleh-oleh dan Suvenir', '#9a6b3f'),
    retail: v.category(shop, 'toko', 'Toko dan Gawai', '#7b61c9'),
    restaurant: v.category(food, 'restoran', 'Restoran', '#d2452f'),
    cafe: v.category(food, 'kafe', 'Kafe', '#8c5a3c'),
    lounge: v.category(service, 'lounge', 'Lounge', '#b8962e'),
    baggage: v.category(service, 'bagasi', 'Pengambilan Bagasi', '#4b5563'),
    help: v.category(service, 'bantuan', 'Bantuan dan Informasi', '#2f8f6b'),
    transport: v.category(service, 'transportasi', 'Taksi, Bus, dan Kereta', '#e0742a'),
  };

  const toiletM = v.facilityType('toilet-male', 'Toilet Pria', 'toilet-male');
  const toiletF = v.facilityType('toilet-female', 'Toilet Wanita', 'toilet-female');
  const toiletA = v.facilityType('toilet-accessible', 'Toilet Difabel', 'toilet-accessible');
  const prayer = v.facilityType('prayer', 'Musala', 'prayer-room');
  const nursery = v.facilityType('nursery', 'Ruang Laktasi', 'nursery');
  const atm = v.facilityType('atm', 'ATM', 'atm');
  const exit = v.facilityType('exit', 'Pintu Darurat', 'emergency-exit', true);

  const departures = v.building({
    key: 'departures',
    name: 'Terminal Keberangkatan',
    code: 'T1',
    x: -150,
    y: 20,
    width: 180,
    depth: 40,
    unitWidth: 10,
    unitDepth: 15,
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
      { name: 'L2', level: 2 },
    ],
  });
  const arrivals = v.building({
    key: 'arrivals',
    name: 'Terminal Kedatangan',
    code: 'T2',
    x: 50,
    y: -60,
    width: 130,
    depth: 36,
    unitWidth: 10,
    unitDepth: 13,
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
    ],
  });
  const [dGf, dL1, dL2] = departures.floors as [BuiltFloor, BuiltFloor, BuiltFloor];
  const [aGf, aL1] = arrivals.floors as [BuiltFloor, BuiltFloor];
  v.connector(departures, 'elevator', 'Lift Keberangkatan', 'west', departures.floors);
  v.connector(departures, 'stairs', 'Tangga Keberangkatan', 'west', departures.floors, {
    offset: -6,
  });
  v.connector(departures, 'escalator', 'Eskalator ke Ruang Tunggu', 'east', [dGf, dL1], {
    direction: 'up',
    offset: 5,
  });
  v.connector(departures, 'escalator', 'Eskalator dari Ruang Tunggu', 'east', [dL1, dGf], {
    direction: 'down',
    offset: -5,
  });
  v.connector(departures, 'escalator', 'Eskalator ke Lounge', 'east', [dL1, dL2], {
    direction: 'up',
    offset: 9,
  });
  v.connector(departures, 'escalator', 'Eskalator dari Lounge', 'east', [dL2, dL1], {
    direction: 'down',
    offset: -9,
  });
  v.connector(arrivals, 'elevator', 'Lift Kedatangan', 'east', arrivals.floors);
  v.connector(arrivals, 'escalator', 'Eskalator Kedatangan turun', 'west', [aL1, aGf], {
    direction: 'down',
    offset: 5,
  });
  v.connector(arrivals, 'stairs', 'Tangga Kedatangan', 'east', arrivals.floors, { offset: -6 });
  for (const b of [departures, arrivals]) {
    for (const floor of b.floors) {
      v.facility(b, floor, toiletM, 'west', 0);
      v.facility(b, floor, toiletF, 'west', 1);
      v.facility(b, floor, toiletA, 'west', 2);
      v.facility(b, floor, exit, 'east', 0);
      v.facility(b, floor, floor.level === 0 ? atm : prayer, 'east', 1);
      if (floor.level === 1) v.facility(b, floor, nursery, 'east', 2);
    }
  }

  const always = dailyHours('00:00', '00:00');
  const shopHours = dailyHours('05:00', '23:00');
  // Keberangkatan: GF konter check-in, L1 gerbang dan kuliner, L2 lounge dan ritel.
  dGf.units.forEach((unit, i) => {
    if (i % 5 === 4) {
      v.location(unit, checkin, cats.selfCheckin, `Check-in Mandiri ${Math.floor(i / 5) + 1}`, {
        hours: always,
      });
      return;
    }
    const airline = AIRLINES[i % AIRLINES.length] ?? 'Maskapai';
    v.location(unit, checkin, cats.counter, `Konter ${airline} ${String(i + 1).padStart(2, '0')}`, {
      hours: dailyHours('04:00', '22:00'),
    });
  });
  dL1.units.forEach((unit, i) => {
    if (i % 3 === 2) {
      v.location(unit, food, i % 2 ? cats.cafe : cats.restaurant, FOOD[i % FOOD.length] ?? '', {
        hours: shopHours,
      });
      return;
    }
    const international = i >= dL1.units.length - 6;
    v.location(
      unit,
      gate,
      international ? cats.international : cats.domestic,
      `Gerbang ${international ? 'I' : 'D'}${i + 1}`,
      { hours: always, status: i === 7 ? 'inactive_temporary' : 'active' },
    );
  });
  dL2.units.forEach((unit, i) => {
    if (i < 4) {
      const lounges = ['Lounge Eksekutif', 'Lounge Prioritas', 'Lounge Bisnis', 'Lounge Keluarga'];
      v.location(unit, service, cats.lounge, lounges[i] ?? 'Lounge', { hours: always });
      return;
    }
    if (i % 7 === 0) {
      v.vacant(unit);
      return;
    }
    const souvenir = i % 2 === 0;
    const name = RETAIL[i % RETAIL.length] ?? 'Toko';
    v.location(unit, shop, souvenir ? cats.souvenir : cats.retail, `${name} ${i}`, {
      hours: shopHours,
      status: i === 9 ? 'coming_soon' : 'active',
      openingDate: i === 9 ? '2026-12-20' : null,
    });
  });
  // Kedatangan: GF bagasi dan transportasi, L1 kuliner dan layanan.
  aGf.units.forEach((unit, i) => {
    if (i < 6) {
      v.location(unit, service, cats.baggage, `Ban Bagasi ${i + 1}`, { hours: always });
      return;
    }
    const transport = ['Taksi Bandara', 'Bus Damri Kota', 'Kereta Bandara', 'Sewa Mobil'];
    const pick = transport[i - 6];
    if (pick) {
      v.location(unit, service, cats.transport, pick, { hours: always });
      return;
    }
    v.location(unit, service, cats.help, i % 2 ? 'Barang Hilang' : `Informasi Kedatangan ${i}`, {
      hours: always,
    });
  });
  aL1.units.forEach((unit, i) => {
    if (i % 4 === 0) {
      v.location(unit, service, cats.help, `Penukaran Uang ${i / 4 + 1}`, { hours: shopHours });
      return;
    }
    v.location(unit, food, i % 2 ? cats.cafe : cats.restaurant, `${FOOD[i % FOOD.length]} ${i}`, {
      hours: shopHours,
    });
  });

  // Area Luar: jalan antar-terminal, taman, dan parkir.
  const dDoor = v.door(departures, dGf);
  const aDoor = v.door(arrivals, aGf);
  v.outdoorPath('antar-terminal', dDoor, aDoor, v.pos(-20, -20), 220);
  v.outdoorArea('jalan', 'road', -170, -10, 340, 14);
  v.outdoorArea('taman', 'garden', -40, -50, 60, 30);
  v.outdoorArea('parkir', 'parking', -170, -80, 110, 50);
  v.originPoint(departures, dGf, 'Pintu Masuk Keberangkatan', 'b7b2c3d4e5f6');
  v.originPoint(departures, dL1, 'Ruang Tunggu Utama', 'b7b2c3d4e5f7');
  v.originPoint(arrivals, aGf, 'Pintu Keluar Kedatangan', 'b7b2c3d4e5f8');
  v.infoPoint(dGf, 'Info Keberangkatan', 'BDR-BERANGKAT');
  v.infoPoint(aGf, 'Info Kedatangan', 'BDR-DATANG');
  v.alias('category', cats.baggage, 'koper');
  v.alias('category', cats.transport, 'taksi');
  v.alias('category', cats.domestic, 'gate');
  v.alias('facility_type', prayer, 'mushola');
  return v.source;
}
