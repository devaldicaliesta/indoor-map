import type { SnapshotSource } from '../../../src';
import { type BuiltFloor, dailyHours, VenueBuilder } from './builder';

/**
 * Kawasan pabrik tiga gedung (produksi, gudang, kantor) yang dihubungkan jalur Area Luar; lini
 * produksi, gudang bahan dan barang jadi, kantor, kantin, klinik, dan fasilitas keselamatan.
 */
export function factoryVenue(): SnapshotSource {
  const v = new VenueBuilder('demo-factory', 'Kawasan Demo Industri Prima', [107.15, -6.3]);
  const production = v.locationType('production', 'Area Produksi', '#3b6fb6');
  const storage = v.locationType('storage', 'Gudang', '#9a6b3f');
  const office = v.locationType('office', 'Kantor', '#6b7280');
  const staff = v.locationType('staff', 'Fasilitas Karyawan', '#2f8f6b');
  const cats = {
    assembly: v.category(production, 'perakitan', 'Lini Perakitan', '#2f7fc1'),
    painting: v.category(production, 'pengecatan', 'Pengecatan', '#7b61c9'),
    packing: v.category(production, 'pengemasan', 'Pengemasan', '#3d9a8b'),
    qc: v.category(production, 'qc', 'Kendali Mutu', '#d0558a'),
    raw: v.category(storage, 'bahan-baku', 'Bahan Baku', '#9a6b3f'),
    finished: v.category(storage, 'barang-jadi', 'Barang Jadi', '#b8962e'),
    spare: v.category(storage, 'suku-cadang', 'Suku Cadang', '#e0742a'),
    management: v.category(office, 'manajemen', 'Manajemen', '#4b5563'),
    hr: v.category(office, 'sdm', 'SDM dan Pelatihan', '#6b7280'),
    canteen: v.category(staff, 'kantin', 'Kantin', '#d9822b'),
    clinic: v.category(staff, 'klinik', 'Klinik Perusahaan', '#c8321e'),
    locker: v.category(staff, 'loker', 'Ruang Loker', '#2f8f6b'),
  };

  const toilet = v.facilityType('toilet', 'Toilet', 'toilet-accessible');
  const prayer = v.facilityType('prayer', 'Musala', 'prayer-room');
  const firstAid = v.facilityType('first-aid', 'Kotak P3K', 'first-aid');
  const apar = v.facilityType('apar', 'APAR', 'fire-extinguisher', true);
  const exit = v.facilityType('exit', 'Pintu Darurat', 'emergency-exit', true);

  const plant = v.building({
    key: 'plant',
    name: 'Gedung Produksi',
    code: 'GP',
    x: -140,
    y: 10,
    width: 160,
    depth: 44,
    unitWidth: 16,
    unitDepth: 18,
    floors: [
      { name: 'GF', level: 0 },
      { name: 'L1', level: 1 },
    ],
  });
  const warehouse = v.building({
    key: 'warehouse',
    name: 'Gudang Utama',
    code: 'GU',
    x: 40,
    y: 10,
    width: 120,
    depth: 40,
    unitWidth: 20,
    unitDepth: 16,
    floors: [{ name: 'GF', level: 0 }],
  });
  const head = v.building({
    key: 'office',
    name: 'Kantor dan Kantin',
    code: 'KK',
    x: -60,
    y: -70,
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
  const [pGf, pL1] = plant.floors as [BuiltFloor, BuiltFloor];
  const [wGf] = warehouse.floors as [BuiltFloor];
  const [hGf] = head.floors as [BuiltFloor];
  v.connector(plant, 'elevator', 'Lift Barang Produksi', 'east', plant.floors);
  v.connector(plant, 'stairs', 'Tangga Produksi', 'west', plant.floors);
  v.connector(head, 'elevator', 'Lift Kantor', 'east', head.floors);
  v.connector(head, 'stairs', 'Tangga Kantor', 'east', head.floors, { offset: -6 });
  for (const [b, floors] of [
    [plant, plant.floors],
    [warehouse, warehouse.floors],
    [head, head.floors],
  ] as const) {
    for (const floor of floors) {
      v.facility(b, floor, apar, 'west', 0);
      v.facility(b, floor, exit, 'west', 1);
      v.facility(b, floor, toilet, 'east', 0);
      v.facility(b, floor, b === head ? prayer : firstAid, 'east', 1);
    }
  }

  const shifts = dailyHours('07:00', '23:00', [0, 1, 2, 3, 4, 5]);
  const officeHours = dailyHours('08:00', '17:00', [0, 1, 2, 3, 4]);
  pGf.units.forEach((unit, i) => {
    const line = i + 1;
    const pick =
      i % 4 === 3
        ? ([cats.painting, `Bilik Pengecatan ${Math.ceil(line / 4)}`] as const)
        : ([cats.assembly, `Lini Perakitan ${line}`] as const);
    v.location(unit, production, pick[0], pick[1], {
      hours: shifts,
      // Satu lini sedang dirawat agar status nonaktif sementara terlihat di tabel.
      status: line === 3 ? 'inactive_temporary' : 'active',
      customFields: { telepon: `ext. ${300 + line}` },
    });
  });
  pL1.units.forEach((unit, i) => {
    const qc = i % 3 === 0;
    v.location(
      unit,
      production,
      qc ? cats.qc : cats.packing,
      qc ? `Lab Kendali Mutu ${i / 3 + 1}` : `Stasiun Pengemasan ${i + 1}`,
      { hours: shifts },
    );
  });
  wGf.units.forEach((unit, i) => {
    const kinds = [
      [cats.raw, 'Rak Bahan Baku'],
      [cats.finished, 'Zona Barang Jadi'],
      [cats.spare, 'Gudang Suku Cadang'],
    ] as const;
    const [category, name] = kinds[i % kinds.length] ?? kinds[0];
    const status = i === wGf.units.length - 1 ? 'coming_soon' : 'active';
    v.location(unit, storage, category, `${name} ${String.fromCharCode(65 + (i % 26))}`, {
      hours: dailyHours('00:00', '00:00'),
      status,
      openingDate: status === 'coming_soon' ? '2027-02-01' : null,
    });
  });
  head.floors.forEach((floor, fi) => {
    floor.units.forEach((unit, i) => {
      if (fi === 0) {
        const ground = [
          [staff, cats.canteen, 'Kantin Karyawan'],
          [staff, cats.canteen, 'Kantin Sehat'],
          [staff, cats.clinic, 'Klinik Perusahaan'],
          [staff, cats.locker, 'Ruang Loker Pria'],
          [staff, cats.locker, 'Ruang Loker Wanita'],
        ] as const;
        const [type, category, name] = ground[i] ?? [office, cats.hr, `Ruang Pelatihan ${i - 4}`];
        v.location(unit, type, category, name, {
          hours: category === cats.canteen ? dailyHours('06:00', '22:00') : officeHours,
        });
        return;
      }
      const management = fi === 2;
      v.location(
        unit,
        office,
        management ? cats.management : cats.hr,
        management
          ? ['Direksi', 'Keuangan', 'Pengadaan', 'Perencanaan Produksi', 'Hukum'][i % 5] +
              ` ${Math.floor(i / 5) + 1}`
          : `Ruang SDM ${i + 1}`,
        { hours: officeHours },
      );
    });
  });

  // Area Luar: jalan kawasan, taman, dan parkir; jalur pintu ke pintu antar-gedung.
  const pDoor = v.door(plant, pGf);
  const wDoor = v.door(warehouse, wGf);
  const hDoor = v.door(head, hGf);
  v.outdoorPath('produksi-gudang', pDoor, wDoor, v.pos(-20, 0), 200);
  v.outdoorPath('produksi-kantor', pDoor, hDoor, v.pos(-120, -40), 120);
  v.outdoorArea('jalan', 'road', -160, -10, 340, 12);
  v.outdoorArea('taman', 'garden', 50, -60, 50, 40);
  v.outdoorArea('parkir', 'parking', -160, -90, 80, 50);
  v.originPoint(plant, pGf, 'Pos Masuk Produksi', 'd9b2c3d4e5f6');
  v.originPoint(head, hGf, 'Lobi Kantor', 'd9b2c3d4e5f7');
  v.infoPoint(hGf, 'Info Tamu Kawasan', 'PABRIK-LOBI');
  v.alias('category', cats.clinic, 'P3K');
  v.alias('category', cats.canteen, 'makan');
  v.alias('category', cats.qc, 'QC');
  v.alias('facility_type', apar, 'pemadam');
  return v.source;
}
