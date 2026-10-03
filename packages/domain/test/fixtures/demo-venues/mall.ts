import type { SnapshotSource } from '../../../src';
import { type BuiltFloor, dailyHours, VenueBuilder } from './builder';

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

/** Mal tiga lantai, ±150 unit, lift, eskalator naik/turun, tangga, fasilitas lengkap. */
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

  const toiletM = v.facilityType('toilet-male', 'Toilet Pria', 'toilet-male');
  const toiletF = v.facilityType('toilet-female', 'Toilet Wanita', 'toilet-female');
  const toiletA = v.facilityType('toilet-accessible', 'Toilet Difabel', 'toilet-accessible');
  const prayer = v.facilityType('prayer', 'Musala', 'prayer-room');
  const atm = v.facilityType('atm', 'ATM', 'atm');
  const info = v.facilityType('info', 'Informasi', 'information');
  const apar = v.facilityType('apar', 'APAR', 'fire-extinguisher', true);

  const building = v.building({
    key: 'main',
    name: 'Gedung Utama',
    code: 'MS',
    x: -110,
    y: -20,
    width: 220,
    depth: 40,
    unitWidth: 8,
    unitDepth: 14,
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
      { name: 'L2', level: 2 },
    ],
  });
  const [gf, l1, l2] = building.floors as [BuiltFloor, BuiltFloor, BuiltFloor];
  v.connector(building, 'elevator', 'Lift Utama', 'west', building.floors);
  v.connector(building, 'stairs', 'Tangga Barat', 'west', building.floors, { offset: -6 });
  v.connector(building, 'escalator', 'Eskalator GF naik', 'east', [gf, l1], {
    direction: 'up',
    offset: 5,
  });
  v.connector(building, 'escalator', 'Eskalator L1 turun', 'east', [l1, gf], {
    direction: 'down',
    offset: -5,
  });
  v.connector(building, 'escalator', 'Eskalator L1 naik', 'east', [l1, l2], {
    direction: 'up',
    offset: 9,
  });
  v.connector(building, 'escalator', 'Eskalator L2 turun', 'east', [l2, l1], {
    direction: 'down',
    offset: -9,
  });
  for (const floor of building.floors) {
    v.facility(building, floor, toiletM, 'west', 0);
    v.facility(building, floor, toiletF, 'west', 1);
    v.facility(building, floor, toiletA, 'west', 2);
    v.facility(building, floor, apar, 'west', 3);
    v.facility(building, floor, floor === gf ? info : prayer, 'east', 0);
    v.facility(building, floor, atm, 'east', 1);
  }

  let n = 0;
  for (const floor of building.floors) {
    for (const unit of floor.units) {
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
  v.originPoint(building, gf, 'Lobi Barat', 'a1b2c3d4e5f6');
  v.originPoint(building, l2, 'Food Court Barat', 'a1b2c3d4e5f7');
  v.infoPoint(gf, 'Info Lobi', 'MAL-LOBI');
  v.alias('category', categories[8]?.id ?? '', 'makan');
  v.alias('category', categories[9]?.id ?? '', 'ngopi');
  v.alias('facility_type', toiletM, 'WC');
  v.alias('facility_type', prayer, 'mushola');
  return v.source;
}
