// Naskah konsep "Untuk Pengelola Gedung": kalimat dubber, teks kinetik, dan teks UI per bahasa.
// Semua nama tempat fiktif.
import type { Lang } from '../shared/stage';

export const BPM = 105;

/** Enam adegan; panjang bawaan dalam ketukan (88 ketukan ≈ 50,3 detik). */
export const SCENES = [
  { id: 'resepsionis', beats: 12, leadBeats: 0 },
  { id: 'editor', beats: 16, leadBeats: 1 },
  { id: 'qr', beats: 16, leadBeats: 1 },
  { id: 'penutupan', beats: 16, leadBeats: 1 },
  { id: 'on-premise', beats: 16, leadBeats: 1 },
  { id: 'penutup', beats: 12, leadBeats: 4 },
] as const;

export interface Copy {
  lines: string[];
  headlines: string[];
  questionsToday: string;
  admin: {
    nav: string[];
    collapse: string;
    account: string;
    venue: string;
    building: string;
    noReference: string;
    geometryValid: string;
    draftSaved: string;
    tabs: [string, string, string];
    features: string;
    search: string;
    groups: [string, number][];
    snap: string;
    statusUnits: [string, string];
    selectHint: string;
    planFile: string;
    validate: string;
    publish: string;
    validationTitle: string;
    checks: string[];
    published: string;
    live: string;
    closures: string;
    target: string;
    targetPlaceholder: string;
    closeTemp: string;
    liftA: string;
    closureOptions: string[];
    pastClosure: [string, string, string, string];
    reasonLabel: string;
    reason: string;
    starts: string;
    startsValue: string;
    ends: string;
    endsValue: string;
    impact: string;
    impactNone: string;
    dialogNote: string;
    cancel: string;
    saveClosure: string;
    closureSaved: string;
    table: string[];
    activeStatus: string;
    untilEnded: string;
  };
  visitor: {
    search: string;
    scanLabel: string;
    youAreHere: string;
    from: string;
    to: string;
    destination: string;
    destinations: [string, string, string];
    closedNotice: string;
    steps: string[];
    stepsDetour: string[];
    closed: string;
    noInstall: string;
  };
  onPrem: string[];
  buildingTypes: string[];
  cta: string;
  url: string;
}

const ID: Copy = {
  lines: [
    'Setiap hari, staf Anda menjawab pertanyaan yang sama: "Ruangan ini di mana?"',
    'Dengan PanduArah, tim Anda menggambar peta dari denah yang sudah ada.',
    'Pasang QR di setiap lantai. Pengunjung langsung dapat rute, tanpa aplikasi.',
    'Lift sedang perbaikan? Tutup dari Admin, semua rute langsung menyesuaikan.',
    'Semua berjalan di server Anda sendiri. Data tetap milik Anda.',
    'PanduArah. Coba gratis tujuh belas hari.',
  ],
  headlines: [
    'Ruangan ini **di mana?**',
    'Dari **denah** yang sudah ada.',
    '**Tanpa aplikasi.**',
    'Satu klik, **semua rute** menyesuaikan.',
    'Data **tetap milik Anda.**',
    '',
  ],
  questionsToday: 'pertanyaan hari ini',
  admin: {
    collapse: 'Ciutkan',
    account: 'Tim Fasilitas',
    nav: [
      'Venue',
      'Editor Peta',
      'Lokasi',
      'Penutupan',
      'Titik Asal',
      'Publish',
      'Pengaturan',
      'Pengguna',
      'Lisensi',
    ],
    venue: 'Menara Sinergi',
    building: 'Gedung Utama',
    noReference: 'Tanpa lantai acuan',
    geometryValid: 'Geometri valid',
    draftSaved: 'Draft tersimpan',
    tabs: ['Fitur', 'Titik masuk', 'Uji rute'],
    features: 'Fitur L1',
    search: 'Cari kode, nama, atau jenis',
    groups: [
      ['Unit', 10],
      ['Koridor', 2],
      ['Lift', 2],
      ['Eskalator', 1],
      ['Tangga', 1],
      ['Fasilitas', 5],
    ],
    snap: 'Snap: aktif',
    statusUnits: ['fitur', 'edge jalur'],
    selectHint: 'Pilih fitur, node, atau edge jalur di peta untuk melihat propertinya.',
    planFile: 'denah-L1.pdf',
    validate: 'Validasi',
    publish: 'Terbitkan',
    validationTitle: 'Validasi draft',
    checks: [
      'Geometri valid',
      'Graf jalur terhubung',
      'Setiap lokasi punya unit',
      'Konektor antar-lantai',
    ],
    published: 'Versi 4 diterbitkan',
    live: 'Versi 4 aktif',
    closures: 'Penutupan',
    target: 'Konektor atau area',
    targetPlaceholder: 'Pilih yang ditutup',
    closeTemp: 'Tutup sementara',
    liftA: 'Lift A',
    closureOptions: ['Eskalator 1', 'Lift A', 'Lift B', 'Tangga Timur'],
    pastClosure: ['Tangga Timur', 'Pengecatan', 'Selesai', 'Sen, 07.00'],
    reasonLabel: 'Alasan',
    reason: 'Perbaikan',
    starts: 'Mulai',
    startsValue: 'Hari ini, 08.30',
    ends: 'Selesai (opsional)',
    endsValue: 'Sampai diakhiri',
    impact: 'Dampak',
    impactNone: 'Semua lantai tetap bisa dicapai.',
    dialogNote: 'Lift A. Berlaku langsung di Visitor tanpa publish.',
    cancel: 'Batal',
    saveClosure: 'Simpan penutupan',
    closureSaved: 'Penutupan disimpan',
    table: ['Yang ditutup', 'Alasan', 'Status', 'Mulai'],
    activeStatus: 'Sedang berlaku',
    untilEnded: 'Sampai diakhiri',
  },
  visitor: {
    search: 'Cari lokasi…',
    scanLabel: 'QR · Lobi L1',
    youAreHere: 'Anda di sini',
    from: 'Dari',
    to: 'Ke',
    destination: 'Ruang Rapat 3.02',
    destinations: ['Ruang Rapat 3.02', 'Ruang Pelatihan 3.05', 'Kantin L3'],
    closedNotice: 'Lift A ditutup · Perbaikan',
    steps: ['Jalan lurus 12 m', 'Naik lift A ke L3', 'Belok kanan'],
    stepsDetour: ['Jalan lurus 20 m', 'Naik lift B ke L3', 'Belok kiri'],
    closed: 'Ditutup',
    noInstall: 'Tanpa install aplikasi',
  },
  onPrem: ['On-premise', 'Backup harian', 'Lisensi per paket'],
  buildingTypes: ['Rumah sakit', 'Kampus', 'Perkantoran', 'Bandara', 'Pabrik', 'Mal'],
  cta: 'Coba gratis 17 hari',
  url: 'panduarah.my.id',
};

const EN: Copy = {
  lines: [
    'Every day, your staff answers the same question: "Where is this room?"',
    'With PanduArah, your team builds the map from the floor plans you already have.',
    'Place QR codes on every floor. Visitors get directions instantly, no app needed.',
    'Elevator under repair? Close it from Admin, and every route adjusts.',
    'Everything runs on your own server. Your data stays yours.',
    'PanduArah. Start your 17-day free trial.',
  ],
  headlines: [
    'Where is **this room?**',
    'From **existing** floor plans.',
    '**No app** needed.',
    'One click, **every route** adapts.',
    'Your data **stays yours.**',
    '',
  ],
  questionsToday: 'questions today',
  admin: {
    collapse: 'Collapse',
    account: 'Facilities Team',
    nav: [
      'Venue',
      'Map Editor',
      'Locations',
      'Closures',
      'Origin Points',
      'Publish',
      'Settings',
      'Users',
      'License',
    ],
    venue: 'Sinergi Tower',
    building: 'Main Building',
    noReference: 'No reference floor',
    geometryValid: 'Geometry valid',
    draftSaved: 'Draft saved',
    tabs: ['Features', 'Entrances', 'Test route'],
    features: 'Features L1',
    search: 'Search code, name, or kind',
    groups: [
      ['Units', 10],
      ['Corridors', 2],
      ['Elevators', 2],
      ['Escalators', 1],
      ['Stairs', 1],
      ['Facilities', 5],
    ],
    snap: 'Snap: on',
    statusUnits: ['features', 'path edges'],
    selectHint: 'Select a feature, node, or path edge on the map to see its properties.',
    planFile: 'floor-plan-L1.pdf',
    validate: 'Validate',
    publish: 'Publish',
    validationTitle: 'Draft validation',
    checks: [
      'Geometry valid',
      'Path graph connected',
      'Every location has a unit',
      'Floor connectors',
    ],
    published: 'Version 4 published',
    live: 'Version 4 live',
    closures: 'Closures',
    target: 'Connector or area',
    targetPlaceholder: 'Choose what to close',
    closeTemp: 'Close temporarily',
    liftA: 'Elevator A',
    closureOptions: ['Escalator 1', 'Elevator A', 'Elevator B', 'East stairs'],
    pastClosure: ['East stairs', 'Repainting', 'Ended', 'Mon, 07:00'],
    reasonLabel: 'Reason',
    reason: 'Repair',
    starts: 'Starts',
    startsValue: 'Today, 08:30',
    ends: 'Ends (optional)',
    endsValue: 'Until ended',
    impact: 'Impact',
    impactNone: 'Every floor is still reachable.',
    dialogNote: 'Elevator A. Applies in Visitor right away, no publish needed.',
    cancel: 'Cancel',
    saveClosure: 'Save closure',
    closureSaved: 'Closure saved',
    table: ['Closed', 'Reason', 'Status', 'Starts'],
    activeStatus: 'In effect',
    untilEnded: 'Until ended',
  },
  visitor: {
    search: 'Search locations…',
    scanLabel: 'QR · L1 lobby',
    youAreHere: 'You are here',
    from: 'From',
    to: 'To',
    destination: 'Meeting Room 3.02',
    destinations: ['Meeting Room 3.02', 'Training Room 3.05', 'L3 Canteen'],
    closedNotice: 'Elevator A closed · Repair',
    steps: ['Go straight 12 m', 'Take elevator A to L3', 'Turn right'],
    stepsDetour: ['Go straight 20 m', 'Take elevator B to L3', 'Turn left'],
    closed: 'Closed',
    noInstall: 'Nothing to install',
  },
  onPrem: ['On-premise', 'Daily backups', 'License per plan'],
  buildingTypes: ['Hospital', 'Campus', 'Office', 'Airport', 'Factory', 'Mall'],
  cta: 'Try free for 17 days',
  url: 'panduarah.my.id',
};

export const COPY: Record<Lang, Copy> = { id: ID, en: EN };
