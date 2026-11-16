import { normalizeSearchText } from './search';

export const PICTOGRAM_CATEGORIES = [
  'umum',
  'transportasi',
  'makanan',
  'belanja',
  'kesehatan',
  'pendidikan',
  'kantor',
  'keselamatan',
  'aksesibilitas',
  'hiburan',
  'gedung',
] as const;
export type PictogramCategory = (typeof PICTOGRAM_CATEGORIES)[number];

export const PICTOGRAM_CATEGORY_LABELS: Record<PictogramCategory, string> = {
  umum: 'Layanan umum',
  transportasi: 'Transportasi dan parkir',
  makanan: 'Makanan dan minuman',
  belanja: 'Belanja',
  kesehatan: 'Kesehatan',
  pendidikan: 'Pendidikan',
  kantor: 'Kantor',
  keselamatan: 'Keselamatan',
  aksesibilitas: 'Aksesibilitas',
  hiburan: 'Hiburan dan olahraga',
  gedung: 'Fasilitas gedung',
};

export const PICTOGRAM_SECTORS = [
  'kesehatan',
  'pendidikan',
  'perkantoran',
  'transportasi',
  'industri',
  'ritel',
] as const;
export type PictogramSector = (typeof PICTOGRAM_SECTORS)[number];

export interface PictogramInfo {
  category: PictogramCategory;
  id: string;
  en: string;
  aliases: readonly string[];
  sectors: readonly PictogramSector[];
}

type Entry = readonly [
  category: PictogramCategory,
  id: string,
  en: string,
  aliases?: string,
  sectors?: string,
];

const ENTRIES = {
  'toilet-male': ['umum', 'Toilet pria', "Men's toilet", 'wc pria, kamar kecil, restroom'],
  'toilet-female': ['umum', 'Toilet wanita', "Women's toilet", 'wc wanita, kamar kecil, restroom'],
  'toilet-accessible': [
    'aksesibilitas',
    'Toilet difabel',
    'Accessible toilet',
    'wc difabel, disabilitas, kursi roda',
  ],
  'prayer-room': ['umum', 'Musala', 'Prayer room', 'mushola, masjid, salat, ibadah'],
  atm: ['umum', 'ATM', 'ATM', 'tarik tunai, bank, cash'],
  'first-aid': ['keselamatan', 'P3K', 'First aid', 'pertolongan pertama, medis, klinik'],
  information: ['umum', 'Informasi', 'Information', 'info, bantuan, help desk'],
  'fire-extinguisher': ['keselamatan', 'APAR', 'Fire extinguisher', 'pemadam api, kebakaran'],
  'assembly-point': ['keselamatan', 'Titik kumpul', 'Assembly point', 'evakuasi, muster'],
  'emergency-exit': ['keselamatan', 'Pintu darurat', 'Emergency exit', 'evakuasi, keluar darurat'],
  elevator: ['gedung', 'Lift', 'Elevator', 'elevator, lift barang'],
  escalator: ['gedung', 'Eskalator', 'Escalator', 'tangga berjalan'],
  stairs: ['gedung', 'Tangga', 'Stairs', 'anak tangga, staircase'],
  parking: ['transportasi', 'Parkir', 'Parking', 'parkir mobil, car park'],

  wifi: ['umum', 'Wi-Fi', 'Wi-Fi', 'internet, hotspot, wifi gratis'],
  'phone-charging': ['umum', 'Isi daya ponsel', 'Phone charging', 'charger, cas, colokan hp'],
  'customer-service': ['umum', 'Layanan pelanggan', 'Customer service', 'cs, pengaduan, keluhan'],
  help: ['umum', 'Bantuan', 'Help', 'tanya, pertanyaan, faq'],
  'lost-and-found': ['umum', 'Barang hilang', 'Lost and found', 'kehilangan, barang temuan'],
  lockers: ['umum', 'Loker', 'Lockers', 'locker, penitipan barang'],
  'nursing-room': ['umum', 'Ruang laktasi', 'Nursing room', 'menyusui, asi, ibu dan bayi'],
  'drinking-water': ['umum', 'Air minum', 'Drinking water', 'dispenser, isi ulang, keran minum'],
  trash: ['umum', 'Tempat sampah', 'Trash bin', 'sampah, buang sampah'],
  recycling: ['umum', 'Daur ulang', 'Recycling', 'sampah terpilah, bank sampah'],
  'smoking-area': ['umum', 'Area merokok', 'Smoking area', 'rokok, smoking room'],
  shower: ['umum', 'Shower', 'Shower', 'bilas, mandi'],
  'post-office': ['umum', 'Pos', 'Post office', 'kantor pos, surat, ruang surat'],
  'money-changer': ['umum', 'Penukaran uang', 'Money changer', 'valas, kurs, currency exchange'],
  bank: ['umum', 'Bank', 'Bank', 'perbankan, teller'],
  cashier: ['umum', 'Kasir', 'Cashier', 'bayar, pembayaran, payment'],
  'ticket-office': ['umum', 'Loket tiket', 'Ticket office', 'tiket, karcis, loket'],
  directory: ['umum', 'Peta direktori', 'Directory', 'denah, peta, papan petunjuk'],
  'meeting-point': ['umum', 'Titik temu', 'Meeting point', 'tempat janjian, kumpul'],
  reception: ['umum', 'Resepsionis', 'Reception', 'front desk, lobi, concierge'],
  chapel: ['umum', 'Kapel', 'Chapel', 'gereja, ibadah, church'],
  'umbrella-storage': ['umum', 'Penitipan payung', 'Umbrella storage', 'payung, hujan'],
  printing: [
    'umum',
    'Cetak dan fotokopi',
    'Printing',
    'fotokopi, print, printer',
    'pendidikan, perkantoran',
  ],
  'opening-hours': ['umum', 'Jam layanan', 'Opening hours', 'jam buka, jadwal, waktu'],
  'waiting-area': ['umum', 'Ruang tunggu', 'Waiting area', 'lounge, tempat duduk, tunggu'],
  telephone: ['umum', 'Telepon', 'Telephone', 'telepon umum, phone booth'],
  hotel: ['umum', 'Hotel', 'Hotel', 'penginapan, menginap'],
  laundry: ['umum', 'Binatu', 'Laundry', 'cuci baju, dry cleaning'],

  'bicycle-parking': ['transportasi', 'Parkir sepeda', 'Bicycle parking', 'sepeda, bike'],
  'motorcycle-parking': [
    'transportasi',
    'Parkir motor',
    'Motorcycle parking',
    'motor, sepeda motor',
  ],
  car: ['transportasi', 'Mobil', 'Car', 'kendaraan, rental mobil'],
  'drop-off': [
    'transportasi',
    'Turun penumpang',
    'Drop-off',
    'antar jemput, penjemputan, pick up',
    'transportasi',
  ],
  taxi: ['transportasi', 'Taksi', 'Taxi', 'taksi online, ojek, ride hailing', 'transportasi'],
  bus: ['transportasi', 'Halte bus', 'Bus stop', 'busway, transjakarta, bis', 'transportasi'],
  shuttle: ['transportasi', 'Shuttle', 'Shuttle bus', 'antar jemput, bus bandara', 'transportasi'],
  train: ['transportasi', 'Kereta', 'Train', 'stasiun, krl, mrt, commuter line', 'transportasi'],
  tram: ['transportasi', 'LRT dan trem', 'Light rail', 'lrt, trem, tram', 'transportasi'],
  departures: [
    'transportasi',
    'Keberangkatan',
    'Departures',
    'berangkat, check-in, boarding',
    'transportasi',
  ],
  arrivals: ['transportasi', 'Kedatangan', 'Arrivals', 'datang, penjemputan', 'transportasi'],
  airport: ['transportasi', 'Bandara', 'Airport', 'pesawat, terminal, penerbangan', 'transportasi'],
  ferry: ['transportasi', 'Pelabuhan', 'Ferry terminal', 'kapal, feri, dermaga', 'transportasi'],
  'baggage-claim': [
    'transportasi',
    'Pengambilan bagasi',
    'Baggage claim',
    'bagasi, koper',
    'transportasi',
  ],
  luggage: [
    'transportasi',
    'Penitipan bagasi',
    'Left luggage',
    'koper, tas, titip barang',
    'transportasi',
  ],
  'fuel-station': ['transportasi', 'SPBU', 'Fuel station', 'bensin, bbm, pom bensin'],
  'ev-charging': [
    'transportasi',
    'Pengisian kendaraan listrik',
    'EV charging',
    'spklu, mobil listrik, charging',
  ],
  'loading-dock': [
    'transportasi',
    'Bongkar muat',
    'Loading dock',
    'truk, logistik, ekspedisi',
    'industri, ritel',
  ],
  immigration: [
    'transportasi',
    'Imigrasi',
    'Passport control',
    'paspor, imigrasi, cap paspor',
    'transportasi',
  ],
  'security-check': [
    'transportasi',
    'Pemeriksaan keamanan',
    'Security check',
    'x-ray, screening, pemindaian',
    'transportasi',
  ],

  restaurant: ['makanan', 'Restoran', 'Restaurant', 'rumah makan, tempat makan, kuliner'],
  'food-court': ['makanan', 'Pujasera', 'Food court', 'kantin, foodcourt, kuliner'],
  cafe: ['makanan', 'Kafe', 'Café', 'kopi, coffee shop, kedai kopi'],
  drinks: ['makanan', 'Minuman', 'Drinks', 'jus, es teh, minuman dingin, boba'],
  bakery: ['makanan', 'Roti', 'Bakery', 'toko roti, pastry'],
  'ice-cream': ['makanan', 'Es krim', 'Ice cream', 'dessert, pencuci mulut, gelato'],
  'cake-shop': ['makanan', 'Toko kue', 'Cake shop', 'kue, cake, dessert'],
  'fast-food': ['makanan', 'Makanan cepat saji', 'Fast food', 'burger, sandwich, cepat saji'],
  pizza: ['makanan', 'Pizza', 'Pizza', 'italia'],
  noodles: ['makanan', 'Mi dan sup', 'Noodles and soup', 'bakso, mie, ramen, soto'],
  'healthy-food': ['makanan', 'Makanan sehat', 'Healthy food', 'salad, vegetarian, vegan'],
  chicken: ['makanan', 'Ayam', 'Chicken', 'ayam goreng, fried chicken'],
  seafood: ['makanan', 'Hidangan laut', 'Seafood', 'ikan, udang'],
  snacks: ['makanan', 'Camilan', 'Snacks', 'jajanan, popcorn, kudapan'],
  fruit: ['makanan', 'Buah', 'Fruit', 'jus buah, buah segar'],
  breakfast: ['makanan', 'Sarapan', 'Breakfast', 'telur, pagi'],
  kitchen: ['makanan', 'Dapur', 'Kitchen', 'masak, chef'],

  shop: ['belanja', 'Toko', 'Shop', 'gerai, tenant, store', 'ritel'],
  shopping: ['belanja', 'Belanja', 'Shopping', 'mal, tas belanja', 'ritel'],
  supermarket: ['belanja', 'Supermarket', 'Supermarket', 'swalayan, troli, grocery', 'ritel'],
  minimarket: ['belanja', 'Minimarket', 'Convenience store', 'warung, toko kelontong', 'ritel'],
  fashion: ['belanja', 'Pakaian', 'Fashion', 'baju, busana, butik', 'ritel'],
  jewelry: ['belanja', 'Perhiasan', 'Jewelry', 'emas, berlian, toko emas', 'ritel'],
  watches: ['belanja', 'Jam tangan', 'Watches', 'arloji', 'ritel'],
  optician: ['belanja', 'Optik', 'Optician', 'kacamata, lensa', 'ritel'],
  electronics: ['belanja', 'Elektronik', 'Electronics', 'komputer, laptop, gadget', 'ritel'],
  'mobile-phones': ['belanja', 'Ponsel', 'Mobile phones', 'hp, handphone, gadget, pulsa', 'ritel'],
  bookstore: ['belanja', 'Toko buku', 'Bookstore', 'buku, alat tulis', 'ritel'],
  gifts: ['belanja', 'Hadiah', 'Gifts', 'kado, suvenir, oleh-oleh', 'ritel'],
  florist: ['belanja', 'Toko bunga', 'Florist', 'bunga, karangan bunga', 'ritel'],
  beauty: ['belanja', 'Kecantikan', 'Beauty', 'kosmetik, skincare, makeup', 'ritel'],
  salon: ['belanja', 'Salon', 'Hair salon', 'potong rambut, barbershop, pangkas', 'ritel'],
  toys: ['belanja', 'Mainan', 'Toys', 'mainan anak, hobi', 'ritel'],
  furniture: ['belanja', 'Furnitur', 'Furniture', 'mebel, perabot, sofa', 'ritel'],
  hardware: ['belanja', 'Perkakas', 'Hardware store', 'bangunan, alat, tukang', 'ritel'],
  promotion: ['belanja', 'Promo', 'Sale', 'diskon, promo, potongan harga', 'ritel'],

  hospital: ['kesehatan', 'Rumah sakit', 'Hospital', 'rs, klinik', 'kesehatan'],
  clinic: [
    'kesehatan',
    'Poliklinik',
    'Outpatient clinic',
    'dokter, poli, rawat jalan',
    'kesehatan',
  ],
  pharmacy: ['kesehatan', 'Apotek', 'Pharmacy', 'obat, farmasi, drugstore', 'kesehatan'],
  'emergency-room': [
    'kesehatan',
    'IGD',
    'Emergency room',
    'gawat darurat, ugd, ambulans',
    'kesehatan',
  ],
  laboratory: ['kesehatan', 'Laboratorium', 'Laboratory', 'lab, cek darah, patologi', 'kesehatan'],
  'sample-collection': [
    'kesehatan',
    'Pengambilan sampel',
    'Sample collection',
    'ambil darah, sampel, urine',
    'kesehatan',
  ],
  radiology: ['kesehatan', 'Radiologi', 'Radiology', 'rontgen, x-ray, ct scan, mri', 'kesehatan'],
  vaccination: ['kesehatan', 'Vaksinasi', 'Vaccination', 'suntik, imunisasi, injeksi', 'kesehatan'],
  cardiology: ['kesehatan', 'Jantung', 'Cardiology', 'kardiologi, ekg', 'kesehatan'],
  pediatrics: ['kesehatan', 'Anak', 'Pediatrics', 'poli anak, kia, bayi', 'kesehatan'],
  neurology: ['kesehatan', 'Saraf', 'Neurology', 'neurologi, otak', 'kesehatan'],
  ophthalmology: ['kesehatan', 'Mata', 'Eye clinic', 'poli mata, oftalmologi', 'kesehatan'],
  ent: ['kesehatan', 'THT', 'ENT', 'telinga hidung tenggorokan', 'kesehatan'],
  dental: ['kesehatan', 'Gigi', 'Dental clinic', 'poli gigi, dokter gigi', 'kesehatan'],
  orthopedics: ['kesehatan', 'Ortopedi', 'Orthopedics', 'tulang, patah tulang', 'kesehatan'],
  inpatient: [
    'kesehatan',
    'Rawat inap',
    'Inpatient ward',
    'kamar pasien, bangsal, ranap',
    'kesehatan',
  ],
  'patient-registration': [
    'kesehatan',
    'Pendaftaran pasien',
    'Patient registration',
    'admisi, daftar, rekam medis',
    'kesehatan',
  ],
  'blood-donation': ['kesehatan', 'Donor darah', 'Blood donation', 'pmi, bank darah', 'kesehatan'],
  dialysis: ['kesehatan', 'Hemodialisis', 'Dialysis', 'cuci darah', 'kesehatan'],
  'temperature-check': [
    'kesehatan',
    'Pemeriksaan suhu',
    'Temperature check',
    'suhu tubuh, demam, termometer',
  ],
  physiotherapy: [
    'kesehatan',
    'Fisioterapi',
    'Physiotherapy',
    'rehabilitasi medik, terapi',
    'kesehatan',
  ],
  stethoscope: [
    'kesehatan',
    'Pemeriksaan kesehatan',
    'Health check',
    'medical check up, mcu, cek kesehatan',
  ],

  classroom: [
    'pendidikan',
    'Ruang kelas',
    'Classroom',
    'kelas, kuliah, ruang kuliah',
    'pendidikan',
  ],
  library: ['pendidikan', 'Perpustakaan', 'Library', 'pustaka, buku', 'pendidikan'],
  'academic-office': [
    'pendidikan',
    'Akademik',
    'Academic office',
    'bak, wisuda, administrasi akademik',
    'pendidikan',
  ],
  school: ['pendidikan', 'Sekolah', 'School', 'sd, smp, sma', 'pendidikan'],
  'science-lab': [
    'pendidikan',
    'Lab sains',
    'Science lab',
    'kimia, praktikum, laboratorium',
    'pendidikan',
  ],
  'computer-lab': [
    'pendidikan',
    'Lab komputer',
    'Computer lab',
    'komputer, pc, ruang komputer',
    'pendidikan',
  ],
  'art-studio': ['pendidikan', 'Studio seni', 'Art studio', 'seni rupa, menggambar', 'pendidikan'],
  'music-room': ['pendidikan', 'Ruang musik', 'Music room', 'musik, band', 'pendidikan'],
  'study-room': [
    'pendidikan',
    'Ruang belajar',
    'Study room',
    'diskusi, belajar kelompok',
    'pendidikan',
  ],
  'faculty-office': [
    'pendidikan',
    'Ruang dosen',
    'Faculty office',
    'guru, dosen, ruang guru',
    'pendidikan',
  ],
  auditorium: [
    'pendidikan',
    'Aula',
    'Auditorium',
    'auditorium, seminar, gedung serbaguna',
    'pendidikan',
  ],

  office: ['kantor', 'Kantor', 'Office', 'ruang kerja, kantor pengelola', 'perkantoran'],
  'meeting-room': ['kantor', 'Ruang rapat', 'Meeting room', 'rapat, meeting', 'perkantoran'],
  'video-conference': [
    'kantor',
    'Konferensi video',
    'Video conference',
    'vicon, zoom, webinar',
    'perkantoran',
  ],
  workspace: [
    'kantor',
    'Area kerja',
    'Workspace',
    'coworking, meja kerja, hot desk',
    'perkantoran',
  ],
  pantry: ['kantor', 'Pantri', 'Pantry', 'dapur kecil, kulkas', 'perkantoran'],
  archive: ['kantor', 'Arsip', 'Archive', 'dokumen, gudang arsip', 'perkantoran'],
  'server-room': ['kantor', 'Ruang server', 'Server room', 'data center, it', 'perkantoran'],
  administration: [
    'kantor',
    'Administrasi',
    'Administration',
    'tata usaha, tu, dokumen',
    'perkantoran',
  ],
  finance: ['kantor', 'Keuangan', 'Finance', 'akuntansi, accounting', 'perkantoran'],
  'human-resources': ['kantor', 'SDM', 'Human resources', 'hrd, personalia', 'perkantoran'],
  'guest-room': ['kantor', 'Ruang tamu', 'Guest room', 'tamu, klien, visitor', 'perkantoran'],
  'office-building': [
    'kantor',
    'Gedung kantor',
    'Office building',
    'tower, menara, gedung',
    'perkantoran',
  ],
  'access-card': [
    'kantor',
    'Kartu akses',
    'Access card',
    'id card, badge, kartu tamu',
    'perkantoran',
  ],

  'fire-alarm': ['keselamatan', 'Alarm kebakaran', 'Fire alarm', 'sirene, alarm'],
  'smoke-detector': ['keselamatan', 'Detektor asap', 'Smoke detector', 'sensor asap'],
  'fire-hazard': ['keselamatan', 'Bahaya kebakaran', 'Fire hazard', 'api, mudah terbakar'],
  'security-post': ['keselamatan', 'Pos keamanan', 'Security post', 'satpam, security, sekuriti'],
  cctv: ['keselamatan', 'CCTV', 'CCTV', 'kamera pengawas'],
  ppe: ['keselamatan', 'Wajib APD', 'PPE required', 'helm, apd, k3, safety', 'industri'],
  warning: ['keselamatan', 'Peringatan', 'Warning', 'awas, hati-hati, bahaya'],
  'high-voltage': [
    'keselamatan',
    'Tegangan tinggi',
    'High voltage',
    'listrik, setrum, panel listrik',
    'industri',
  ],
  biohazard: [
    'keselamatan',
    'Bahaya biologis',
    'Biohazard',
    'limbah medis, infeksius',
    'kesehatan, industri',
  ],
  'no-smoking': ['keselamatan', 'Dilarang merokok', 'No smoking', 'tanpa rokok'],
  'no-entry': ['keselamatan', 'Dilarang masuk', 'No entry', 'terlarang, tutup'],
  'restricted-area': [
    'keselamatan',
    'Area terbatas',
    'Restricted area',
    'staf saja, khusus karyawan',
  ],
  'emergency-phone': ['keselamatan', 'Telepon darurat', 'Emergency phone', 'darurat, hotline'],
  aed: ['keselamatan', 'AED', 'Defibrillator', 'defibrilator, henti jantung'],
  construction: [
    'keselamatan',
    'Area konstruksi',
    'Construction area',
    'renovasi, perbaikan, proyek',
  ],
  'life-buoy': ['keselamatan', 'Pelampung', 'Life buoy', 'penyelamat, kolam'],
  'evacuation-route': [
    'keselamatan',
    'Jalur evakuasi',
    'Evacuation route',
    'rute evakuasi, jalur darurat',
  ],

  wheelchair: [
    'aksesibilitas',
    'Akses kursi roda',
    'Wheelchair access',
    'difabel, disabilitas, ramp',
  ],
  'hearing-loop': ['aksesibilitas', 'Alat bantu dengar', 'Hearing loop', 'induction loop, audio'],
  deaf: ['aksesibilitas', 'Layanan tunarungu', 'Deaf services', 'tuli, rungu'],
  blind: ['aksesibilitas', 'Layanan tunanetra', 'Blind services', 'netra, braille, buta'],
  'sign-language': [
    'aksesibilitas',
    'Bahasa isyarat',
    'Sign language',
    'bisindo, juru bahasa isyarat',
  ],
  priority: ['aksesibilitas', 'Prioritas', 'Priority', 'lansia, ibu hamil, kursi prioritas'],
  'guide-dog': ['aksesibilitas', 'Anjing pemandu', 'Guide dog', 'hewan pemandu'],
  assistance: ['aksesibilitas', 'Bantuan pendamping', 'Assistance', 'pendamping, pemandu, porter'],

  cinema: ['hiburan', 'Bioskop', 'Cinema', 'film, movie, xxi'],
  arcade: ['hiburan', 'Arena permainan', 'Game arcade', 'game, timezone, permainan'],
  karaoke: ['hiburan', 'Karaoke', 'Karaoke', 'nyanyi, ktv'],
  gym: ['hiburan', 'Pusat kebugaran', 'Gym', 'fitness, olahraga, angkat beban'],
  'swimming-pool': ['hiburan', 'Kolam renang', 'Swimming pool', 'renang, kolam'],
  playground: ['hiburan', 'Area bermain anak', 'Playground', 'anak, kids, taman bermain'],
  park: ['hiburan', 'Taman', 'Park', 'ruang terbuka hijau, rth, pohon'],
  garden: ['hiburan', 'Taman bunga', 'Garden', 'kebun, bunga'],
  theater: ['hiburan', 'Teater', 'Theater', 'pertunjukan, panggung, drama'],
  gallery: ['hiburan', 'Galeri', 'Gallery', 'pameran, museum, eksibisi'],
  'photo-spot': ['hiburan', 'Spot foto', 'Photo spot', 'selfie, foto'],
  event: ['hiburan', 'Acara', 'Event', 'pesta, perayaan, event hall'],
  'sports-field': [
    'hiburan',
    'Lapangan olahraga',
    'Sports field',
    'lapangan, voli, futsal, basket',
  ],
  'live-music': ['hiburan', 'Panggung musik', 'Live music', 'konser, musik, band'],
  'pet-area': [
    'hiburan',
    'Area hewan peliharaan',
    'Pet area',
    'hewan, anjing, kucing, pet friendly',
  ],
  'amusement-ride': ['hiburan', 'Wahana', 'Amusement ride', 'bianglala, taman hiburan'],

  entrance: ['gedung', 'Pintu masuk', 'Entrance', 'masuk, lobi, gerbang'],
  exit: ['gedung', 'Pintu keluar', 'Exit', 'keluar'],
  door: ['gedung', 'Pintu', 'Door', 'pintu ruangan'],
  warehouse: ['gedung', 'Gudang', 'Warehouse', 'penyimpanan, storage', 'industri, ritel'],
  'production-area': [
    'gedung',
    'Area produksi',
    'Production area',
    'pabrik, manufaktur, factory',
    'industri',
  ],
  forklift: ['gedung', 'Jalur forklift', 'Forklift area', 'forklift, alat angkat', 'industri'],
  container: [
    'gedung',
    'Kontainer',
    'Container',
    'peti kemas, container yard',
    'industri, transportasi',
  ],
  parcels: ['gedung', 'Penerimaan paket', 'Parcels', 'kurir, paket, barang masuk'],
  'power-outlet': ['gedung', 'Stopkontak', 'Power outlet', 'colokan, listrik'],
  ventilation: ['gedung', 'Ventilasi', 'Ventilation', 'ac, kipas, sirkulasi udara'],
  maintenance: ['gedung', 'Teknisi', 'Maintenance', 'perbaikan, engineering, bengkel'],
  'utility-room': ['gedung', 'Ruang utilitas', 'Utility room', 'ruang mesin, panel, mep'],
  bathroom: ['gedung', 'Kamar mandi', 'Bathroom', 'bak mandi, bathtub'],
  'key-handover': ['gedung', 'Serah terima kunci', 'Key handover', 'kunci, kunci kamar'],
  mailbox: ['gedung', 'Kotak surat', 'Mailbox', 'surat masuk'],
  'outdoor-area': ['gedung', 'Area terbuka', 'Outdoor area', 'outdoor, rooftop, teras'],
  building: ['gedung', 'Gedung', 'Building', 'bangunan, blok'],
  directions: ['gedung', 'Petunjuk arah', 'Directions', 'rambu, signage, papan arah'],
} as const satisfies Record<string, Entry>;

export type PictogramKey = keyof typeof ENTRIES;

export const PICTOGRAM_KEYS = Object.keys(ENTRIES) as PictogramKey[];

const KEY_SET: ReadonlySet<string> = new Set(PICTOGRAM_KEYS);

export const isPictogramKey = (value: string): value is PictogramKey => KEY_SET.has(value);

const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

function info(entry: Entry): PictogramInfo {
  const [category, id, en, aliases, sectors] = entry;
  return {
    category,
    id,
    en,
    aliases: list(aliases),
    sectors: list(sectors) as PictogramSector[],
  };
}

export const PICTOGRAMS: Record<PictogramKey, PictogramInfo> = Object.fromEntries(
  Object.entries(ENTRIES).map(([key, entry]) => [key, info(entry as Entry)]),
) as Record<PictogramKey, PictogramInfo>;

export const pictogramLabel = (key: PictogramKey): string => PICTOGRAMS[key].id;

const searchText = (value: string) =>
  normalizeSearchText(value)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const HAYSTACKS = new Map<PictogramKey, string>(
  PICTOGRAM_KEYS.map((key) => {
    const { id, en, aliases } = PICTOGRAMS[key];
    return [key, ` ${searchText([key, id, en, ...aliases].join(' '))} `];
  }),
);

export interface PictogramFilter {
  query?: string;
  category?: PictogramCategory | null;
  sector?: PictogramSector | null;
}

export function searchPictograms({ query = '', category, sector }: PictogramFilter = {}) {
  const words = searchText(query).split(' ').filter(Boolean);
  return PICTOGRAM_KEYS.filter((key) => {
    const entry = PICTOGRAMS[key];
    if (category && entry.category !== category) return false;
    if (sector && entry.sectors.length > 0 && !entry.sectors.includes(sector)) return false;
    const haystack = HAYSTACKS.get(key) ?? '';
    return words.every((word) => haystack.includes(` ${word}`));
  });
}
