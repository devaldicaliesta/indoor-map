import type { SnapshotSource } from '../../../src';
import { type BuiltFloor, dailyHours, VenueBuilder } from './builder';

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

/** Gedung perkantoran enam lantai: penyewa, ruang rapat, layanan gedung, dan fasilitas karyawan. */
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

  const tower = v.building({
    key: 'tower',
    name: 'Menara Sinergi',
    code: 'MS',
    x: -60,
    y: -18,
    width: 120,
    depth: 36,
    unitWidth: 10,
    unitDepth: 13,
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
      { name: 'L2', level: 2 },
      { name: 'L3', level: 3 },
      { name: 'L5', level: 4 },
      { name: 'L6', level: 5 },
    ],
  });
  const [gf, l1] = tower.floors as [BuiltFloor, BuiltFloor];
  v.connector(tower, 'elevator', 'Lift Penumpang A', 'west', tower.floors);
  v.connector(tower, 'elevator', 'Lift Penumpang B', 'east', tower.floors);
  v.connector(tower, 'elevator', 'Lift Barang', 'east', tower.floors, { offset: 6 });
  v.connector(tower, 'stairs', 'Tangga Darurat Barat', 'west', tower.floors, { offset: -6 });
  v.connector(tower, 'escalator', 'Eskalator Lobi naik', 'west', [gf, l1], {
    direction: 'up',
    offset: 6,
  });
  v.connector(tower, 'escalator', 'Eskalator Lobi turun', 'west', [l1, gf], {
    direction: 'down',
    offset: 9,
  });
  for (const floor of tower.floors) {
    v.facility(tower, floor, toiletM, 'west', 0);
    v.facility(tower, floor, toiletF, 'west', 1);
    v.facility(tower, floor, toiletA, 'west', 2);
    v.facility(tower, floor, exit, 'east', 0);
    v.facility(tower, floor, floor === gf ? info : prayer, 'east', 1);
    if (floor === gf) v.facility(tower, floor, atm, 'east', 2);
  }

  const sectors = Object.keys(COMPANIES) as (keyof typeof COMPANIES & keyof typeof sector)[];
  let n = 0;
  tower.floors.forEach((floor, fi) => {
    floor.units.forEach((unit, i) => {
      n += 1;
      const hours = dailyHours('08:00', '18:00', [0, 1, 2, 3, 4]);
      if (floor === gf) {
        // Lantai dasar: lobi layanan gedung, kafetaria, dan kedai kopi.
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
  v.originPoint(tower, gf, 'Lobi Utama Menara', 'f1b2c3d4e5f6');
  v.originPoint(tower, l1, 'Lobi Lift L1', 'f1b2c3d4e5f7');
  v.infoPoint(gf, 'Info Resepsionis', 'MENARA-LOBI');
  v.alias('category', care.management, 'resepsionis');
  v.alias('category', eat.coffee, 'ngopi');
  v.alias('category', room.small, 'meeting');
  v.alias('facility_type', prayer, 'mushola');
  return v.source;
}
