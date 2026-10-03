import type { SnapshotSource } from '../../../src';
import { dailyHours, VenueBuilder } from './builder';

/** Kampus dua gedung bertingkat yang dihubungkan jalur Area Luar (taman, jalan, parkir). */
export function campusVenue(): SnapshotSource {
  const v = new VenueBuilder('demo-campus', 'Kampus Demo Cendekia', [106.8272, -6.3628]);
  const classroom = v.locationType('class', 'Ruang Kelas', '#3b6fb6');
  const lab = v.locationType('lab', 'Laboratorium', '#7a5cc4');
  const office = v.locationType('office', 'Kantor', '#6b7280');
  const publicType = v.locationType('public', 'Fasilitas Umum', '#d9822b');
  const cats = {
    class: v.category(classroom, 'kelas', 'Kelas'),
    hall: v.category(classroom, 'aula', 'Aula'),
    comp: v.category(lab, 'komputer', 'Lab Komputer'),
    chem: v.category(lab, 'kimia', 'Lab Kimia'),
    faculty: v.category(office, 'fakultas', 'Fakultas'),
    admin: v.category(office, 'akademik', 'Administrasi Akademik'),
    canteen: v.category(publicType, 'kantin', 'Kantin'),
    library: v.category(publicType, 'perpustakaan', 'Perpustakaan'),
  };
  const toilet = v.facilityType('toilet', 'Toilet', 'toilet-accessible');
  const prayer = v.facilityType('prayer', 'Musala', 'prayer-room');
  const parking = v.facilityType('parking', 'Parkir', 'parking');

  const rektorat = v.building({
    key: 'rektorat',
    name: 'Gedung Rektorat',
    code: 'GR',
    x: -110,
    y: 10,
    width: 90,
    depth: 30,
    unitWidth: 9,
    unitDepth: 11,
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
      { name: 'L2', level: 2 },
    ],
  });
  const kuliah = v.building({
    key: 'kuliah',
    name: 'Gedung Kuliah Bersama',
    code: 'GK',
    x: 20,
    y: -40,
    width: 108,
    depth: 30,
    unitWidth: 9,
    unitDepth: 11,
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
    ],
  });
  for (const b of [rektorat, kuliah]) {
    v.connector(b, 'elevator', `Lift ${b.spec.code}`, 'east', b.floors);
    v.connector(b, 'stairs', `Tangga ${b.spec.code}`, 'east', b.floors, { offset: -6 });
    for (const floor of b.floors) {
      v.facility(b, floor, toilet, 'west', 1);
      v.facility(b, floor, prayer, 'west', 2);
    }
  }

  let n = 0;
  const assign = (
    b: typeof rektorat,
    plan: (floorIndex: number, i: number) => [string, string, string],
  ) => {
    b.floors.forEach((floor, fi) => {
      floor.units.forEach((unit, i) => {
        n += 1;
        const [type, cat, name] = plan(fi, i);
        v.location(unit, type, cat, name, {
          hours: dailyHours('07:00', '18:00', [0, 1, 2, 3, 4, 5]),
        });
      });
    });
  };
  assign(rektorat, (fi, i) =>
    fi === 0 && i < 4
      ? [publicType, cats.library, `Perpustakaan ${i + 1}`]
      : fi === 0
        ? [office, cats.admin, `Layanan Akademik ${i - 3}`]
        : [office, cats.faculty, `Ruang Dosen ${fi}${String(i + 1).padStart(2, '0')}`],
  );
  assign(kuliah, (fi, i) =>
    fi === 0 && i < 3
      ? [publicType, cats.canteen, `Kantin ${String.fromCharCode(65 + i)}`]
      : fi === 0 && i === 3
        ? [classroom, cats.hall, 'Aula Utama']
        : i % 6 === 0
          ? [
              lab,
              i % 12 === 0 ? cats.chem : cats.comp,
              `Lab ${fi}${String(i + 1).padStart(2, '0')}`,
            ]
          : [
              classroom,
              cats.class,
              `Kelas ${kuliah.spec.code}${fi}${String(i + 1).padStart(2, '0')}`,
            ],
  );

  // Area Luar: jalan penghubung, taman, dan parkir; jalur dari pintu gedung ke pintu gedung.
  const [rGround] = rektorat.floors;
  const [kGround] = kuliah.floors;
  if (!rGround || !kGround) throw new Error('lantai dasar tidak ada');
  const rDoor = v.door(rektorat, rGround);
  const kDoor = v.door(kuliah, kGround);
  v.outdoorPath('antar-gedung', rDoor, kDoor, v.pos(-60, -25), 140);
  v.outdoorArea('jalan', 'road', -130, -5, 20, 50);
  v.outdoorArea('taman', 'garden', -20, 0, 35, 35);
  v.outdoorArea('parkir', 'parking', 20, 0, 60, 30);
  void parking;
  v.originPoint(rektorat, rGround, 'Lobi Rektorat', 'c1b2c3d4e5f6');
  v.originPoint(kuliah, kGround, 'Lobi Gedung Kuliah', 'c1b2c3d4e5f7');
  v.alias('category', cats.canteen, 'makan');
  v.alias('category', cats.library, 'pustaka');
  void n;
  return v.source;
}
