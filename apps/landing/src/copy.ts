/** Teks landing page dalam dua bahasa; bentuk EN harus sama persis dengan ID. */
const id = {
  meta: {
    title: 'PanduArah — Navigasi dalam gedung untuk mal, rumah sakit, kampus, dan event',
    description:
      'Peta interaktif 2D/3D dan petunjuk arah langkah demi langkah untuk gedung Anda. Dipasang di server sendiri.',
  },
  nav: {
    features: 'Fitur',
    demo: 'Demo 3D',
    how: 'Cara kerja',
    license: 'Lisensi',
    trial: 'Coba gratis',
    contact: 'Hubungi kami',
    language: 'Bahasa',
    menu: 'Menu',
    skip: 'Langsung ke isi',
    theme: 'Mode gelap',
  },
  hero: {
    title: 'Pengunjung tidak lagi tersesat di gedung Anda.',
    lead: 'PanduArah membuat peta interaktif 2D dan 3D serta petunjuk arah langkah demi langkah untuk mal, rumah sakit, kampus, bandara, kawasan industri, dan event. Semua berjalan di server Anda sendiri.',
    primary: 'Coba gratis 17 hari',
    secondary: 'Lihat demo',
    videoLabel: 'Video animasi PanduArah: denah gedung menjadi peta 3D dengan rute dan pengunjung',
    play: 'Putar video',
    pause: 'Jeda video',
    facts: [
      ['QR & tautan', 'tanpa pasang aplikasi'],
      ['2D & 3D', 'peta bertingkat'],
      ['ID / EN', 'dua bahasa'],
      ['On-premise', 'data di server Anda'],
    ],
  },
  buildings: {
    title: 'Untuk gedung yang ramai dan rumit',
    lead: 'Satu sistem untuk berbagai jenis tempat. Denah bebas bentuk: atrium bundar, stadion oval, koridor bercabang.',
    items: [
      ['Mal & pusat belanja', 'Cari toko, promo per kategori, rute ke parkir dan toilet.'],
      ['Rumah sakit', 'Rute ke poli, IGD, dan radiologi; jalur kursi roda lewat lift.'],
      ['Kampus & sekolah', 'Gedung, ruang kelas, dan rute antargedung lewat area luar.'],
      ['Perkantoran', 'Lantai, ruang rapat, dan lobi; QR di setiap lift.'],
      ['Bandara & terminal', 'Gerbang, konter, dan fasilitas dengan Info Point layar sentuh.'],
      ['Kawasan industri', 'Gudang, pintu darurat, dan titik kumpul untuk tamu dan pekerja.'],
      ['Event & konser', 'Zona festival, tribun, gerbang, dan booth di peta yang bisa dibagikan.'],
    ],
  },
  features: {
    title: 'Fitur utama',
    items: [
      ['Peta 2D dan 3D', 'Lantai bertingkat dengan warna kategori, ikon fasilitas, dan rotasi.'],
      [
        'Rute langkah demi langkah',
        'Rute tercepat atau aksesibel (lift, tanpa tangga) antar lantai dan gedung.',
      ],
      ['QR "Anda di sini"', 'Pindai QR di lokasi, peta langsung tahu posisi dan arah hadap.'],
      ['Info Point', 'Layar sentuh di lobi dengan keyboard di layar dan QR "lanjutkan di HP".'],
      ['Cari dan kategori', 'Salah ketik tetap ketemu, alias, kode unit, dan direktori A–Z.'],
      ['Penutupan langsung', 'Tutup lift atau koridor; rute pengunjung langsung menghindarinya.'],
      ['Editor peta', 'Gambar dari denah gambar, PDF, atau DXF; validasi sebelum publish.'],
      ['Tanpa internet pun jalan', 'Dipasang on-premise; peta dasar jalan opsional.'],
    ],
  },
  demo: {
    title: 'Coba peta 3D interaktif',
    lead: 'Geser, putar, ganti lantai, lalu klik lokasi untuk melihat rutenya. Orang mini hanya ilustrasi keramaian.',
    concert: 'Konser stadion',
    hospital: 'Rumah sakit',
    floors: 'Lantai',
    people: 'Ilustrasi orang',
    mode2d: '2D',
    mode3d: '3D',
    full: 'Buka demo lengkap',
    load: 'Muat peta 3D',
    loading: 'Memuat peta…',
    failed: 'Peta tidak bisa dimuat di peramban ini (butuh WebGL).',
    note: 'Data demo, bukan gedung nyata.',
    canvas: 'Peta demo. Seret untuk menggeser, dua jari atau tombol kanan untuk memutar.',
    zoomIn: 'Perbesar',
    zoomOut: 'Perkecil',
    resetNorth: 'Arahkan ke utara',
    destination: 'Tujuan',
    choose: 'Pilih tujuan…',
    hint: 'Klik lokasi di peta atau pilih tujuan untuk melihat rute dari {origin}.',
    routeTitle: 'Rute',
    routeFrom: 'Dari',
    distance: '± {m} m',
    clearRoute: 'Hapus rute',
    noRoute: 'Rute ke lokasi ini tidak ditemukan.',
  },
  how: {
    title: 'Cara kerja',
    steps: [
      [
        'Pasang di server Anda',
        'Paket Docker siap pakai: satu perintah instalasi, backup harian, dan upgrade otomatis.',
      ],
      ['Gambar peta', 'Unggah denah, tempatkan di peta, gambar ruang, jalur, lift, dan pintu.'],
      ['Isi lokasi dan QR', 'Nama toko atau poli, kategori, jam buka, lalu cetak QR titik asal.'],
      ['Publish', 'Pengunjung membuka peta lewat QR atau tautan, tanpa memasang aplikasi.'],
    ],
  },
  license: {
    title: 'On-premise dan lisensi',
    lead: 'Data gedung dan pengunjung tetap di server Anda. Lisensi tahunan per paket.',
    items: [
      [
        'Data milik Anda',
        'Server, database, dan backup di lingkungan Anda sendiri. Bisa berjalan tanpa internet.',
      ],
      [
        'Lisensi per paket',
        'Jumlah venue, gedung, lantai, dan Info Point sesuai kebutuhan; fitur 3D dan impor CAD per paket.',
      ],
      [
        'Pendampingan',
        'Kami bantu instalasi di server Anda dan menjawab pertanyaan admin lewat email.',
      ],
    ],
  },
  screens: {
    title: 'Tangkapan layar',
    items: [
      [
        'visitor-mall',
        'Peta mal di HP: kategori berwarna dan rute antarlantai',
        'Pengunjung memindai QR, mencari toko, dan mengikuti rute lewat lift ke lantai lain.',
      ],
      [
        'visitor-concert',
        'Konser stadion dalam 3D: zona festival, tribun, dan booth',
        'Peta bertingkat bisa diputar dan dimiringkan; warna kategori membuat setiap zona mudah dikenali.',
      ],
      [
        'admin-editor',
        'Editor peta Admin: gambar ruang, jalur, dan konektor',
        'Pengelola menggambar ruang di atas denah, lalu peta diperiksa otomatis sebelum publish.',
      ],
      [
        'info-point',
        'Info Point layar sentuh di lobi',
        'Layar sentuh menampilkan "Anda di sini" dan QR untuk melanjutkan rute di HP.',
      ],
    ],
  },
  contact: {
    title: 'Hubungi kami',
    lead: 'Ingin membeli lisensi, memasang PanduArah di server Anda sendiri, atau punya pertanyaan? Kirim email berisi nama gedung, jenis gedung, dan perkiraan luasnya. Kami membalas dalam satu hari kerja.',
    email: 'Kirim email',
  },
  footer: {
    tagline: 'Indoor Navigation',
    contact: 'Kontak',
    privacy: 'Kebijakan privasi',
    rights: 'Hak cipta dilindungi.',
  },
  privacy: {
    title: 'Kebijakan privasi',
    back: 'Kembali ke beranda',
    updated: 'Diperbarui 12 Oktober 2026',
    sections: [
      [
        'Data yang kami kumpulkan',
        'Form trial meminta nama, instansi, jabatan, email, telepon, serta jenis dan perkiraan luas gedung, dan mencatat alamat IP pengirim untuk mencegah penyalahgunaan. Bila Anda mengirim email ke kami, kami menerima alamat email, nama, dan isi pesan yang Anda tulis.',
      ],
      [
        'Untuk apa',
        'Untuk membuat dan menjalankan ruang kerja trial Anda, mengirim email tentang trial (verifikasi, akses, pengingat), membalas pertanyaan, membantu instalasi, dan menghubungi Anda tentang PanduArah. Kami tidak menjual data dan tidak memakainya untuk iklan pihak lain.',
      ],
      [
        'Penyimpanan',
        'Ruang kerja trial, berkasnya, dan akun trial dihapus otomatis 7 hari setelah trial berakhir. Isian form trial dan email disimpan paling lama 12 bulan, kecuali Anda menjadi klien. Landing page ini tidak memakai cookie pelacak; pilihan bahasa dan tema terang/gelap disimpan di peramban Anda sendiri.',
      ],
      [
        'Hak Anda',
        'Sesuai UU Pelindungan Data Pribadi, Anda bisa meminta salinan, perbaikan, atau penghapusan data dengan mengirim email ke alamat di bawah.',
      ],
      [
        'Data pengunjung gedung',
        'Aplikasi PanduArah di gedung klien berjalan di server klien; pengelola gedung adalah pengendali data pengunjungnya dan vendor tidak menerimanya. Visitor trial dan demo yang berjalan di server vendor tidak meminta login dan tidak mengumpulkan data pribadi pengunjung.',
      ],
    ],
    contact: 'Pertanyaan tentang privasi:',
  },
};

export type Copy = typeof id;

const en: Copy = {
  meta: {
    title: 'PanduArah — Indoor navigation for malls, hospitals, campuses, and events',
    description:
      'Interactive 2D/3D maps and step-by-step directions inside your building. Runs on your own server.',
  },
  nav: {
    features: 'Features',
    demo: '3D demo',
    how: 'How it works',
    license: 'Licensing',
    trial: 'Free trial',
    contact: 'Contact us',
    language: 'Language',
    menu: 'Menu',
    skip: 'Skip to content',
    theme: 'Dark mode',
  },
  hero: {
    title: 'Visitors never get lost in your building again.',
    lead: 'PanduArah creates interactive 2D and 3D maps with step-by-step directions for malls, hospitals, campuses, airports, industrial estates, and events. Everything runs on your own server.',
    primary: 'Try free for 17 days',
    secondary: 'See the demo',
    videoLabel: 'PanduArah animation: a floor plan becomes a 3D map with a route and visitors',
    play: 'Play video',
    pause: 'Pause video',
    facts: [
      ['QR & link', 'no app to install'],
      ['2D & 3D', 'multi-floor maps'],
      ['ID / EN', 'two languages'],
      ['On-premise', 'data on your server'],
    ],
  },
  buildings: {
    title: 'For busy, complex buildings',
    lead: 'One system for many kinds of venues. Free-form floor plans: round atriums, oval stadiums, branching corridors.',
    items: [
      [
        'Malls & shopping centres',
        'Find stores, browse by category, route to parking and toilets.',
      ],
      ['Hospitals', 'Routes to clinics, ER, and radiology; wheelchair paths via lifts.'],
      ['Campuses & schools', 'Buildings, classrooms, and routes between buildings outdoors.'],
      ['Offices', 'Floors, meeting rooms, and lobbies; a QR code at every lift.'],
      ['Airports & terminals', 'Gates, counters, and facilities with touch-screen Info Points.'],
      [
        'Industrial estates',
        'Warehouses, emergency exits, and assembly points for guests and staff.',
      ],
      ['Events & concerts', 'Festival zones, stands, gates, and booths on a shareable map.'],
    ],
  },
  features: {
    title: 'Key features',
    items: [
      ['2D and 3D maps', 'Multi-floor maps with category colours, facility icons, and rotation.'],
      [
        'Step-by-step routes',
        'Fastest or accessible routes (lifts, no stairs) across floors and buildings.',
      ],
      ['"You are here" QR', 'Scan a QR code on site and the map knows your position and heading.'],
      ['Info Point', 'Lobby touch screens with an on-screen keyboard and "continue on phone" QR.'],
      ['Search and categories', 'Typo-tolerant search, aliases, unit codes, and an A–Z directory.'],
      ['Live closures', 'Close a lift or corridor; visitor routes avoid it immediately.'],
      ['Map editor', 'Draw from image, PDF, or DXF plans; validated before publishing.'],
      ['Works offline', 'Installed on-premise; the street basemap is optional.'],
    ],
  },
  demo: {
    title: 'Try the interactive 3D map',
    lead: 'Pan, rotate, switch floors, then click a place to see the route. The mini people only illustrate a crowd.',
    concert: 'Stadium concert',
    hospital: 'Hospital',
    floors: 'Floors',
    people: 'People illustration',
    mode2d: '2D',
    mode3d: '3D',
    full: 'Open the full demo',
    load: 'Load 3D map',
    loading: 'Loading map…',
    failed: 'The map cannot load in this browser (WebGL required).',
    note: 'Demo data, not a real building.',
    canvas: 'Demo map. Drag to pan; use two fingers or right-drag to rotate.',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetNorth: 'Reset to north',
    destination: 'Destination',
    choose: 'Choose a destination…',
    hint: 'Click a place on the map or choose a destination to see the route from {origin}.',
    routeTitle: 'Route',
    routeFrom: 'From',
    distance: '≈ {m} m',
    clearRoute: 'Clear route',
    noRoute: 'No route to this place was found.',
  },
  how: {
    title: 'How it works',
    steps: [
      [
        'Install on your server',
        'A ready Docker package: one install command, daily backups, and automatic upgrades.',
      ],
      [
        'Draw the map',
        'Upload a floor plan, place it on the map, draw rooms, paths, lifts, and doors.',
      ],
      [
        'Add places and QR codes',
        'Store or clinic names, categories, opening hours, then print origin QR codes.',
      ],
      ['Publish', 'Visitors open the map via QR code or link, no app to install.'],
    ],
  },
  license: {
    title: 'On-premise and licensing',
    lead: 'Building and visitor data stay on your server. Annual license per plan.',
    items: [
      [
        'Your data',
        'Server, database, and backups in your own environment. Runs without internet.',
      ],
      [
        'License per plan',
        'Venues, buildings, floors, and Info Points as needed; 3D and CAD import per plan.',
      ],
      ['Support', 'We help install on your server and answer admin questions by email.'],
    ],
  },
  screens: {
    title: 'Screenshots',
    items: [
      [
        'visitor-mall',
        'Mall map on a phone: coloured categories and a multi-floor route',
        'Visitors scan a QR code, search for a store, and follow the route by lift to another floor.',
      ],
      [
        'visitor-concert',
        'Stadium concert in 3D: festival zones, stands, and booths',
        'Rotate and tilt the multi-floor map; category colours make every zone easy to spot.',
      ],
      [
        'admin-editor',
        'Admin map editor: draw rooms, paths, and connectors',
        'Managers draw rooms over the floor plan, and the map is checked automatically before publishing.',
      ],
      [
        'info-point',
        'Touch-screen Info Point in a lobby',
        'The touch screen shows "You are here" and a QR code to continue the route on a phone.',
      ],
    ],
  },
  contact: {
    title: 'Contact us',
    lead: 'Want to buy a licence, install PanduArah on your own server, or have a question? Email us your building name, type, and approximate size. We reply within one business day.',
    email: 'Send an email',
  },
  footer: {
    tagline: 'Indoor Navigation',
    contact: 'Contact',
    privacy: 'Privacy policy',
    rights: 'All rights reserved.',
  },
  privacy: {
    title: 'Privacy policy',
    back: 'Back to home',
    updated: 'Updated 12 October 2026',
    sections: [
      [
        'Data we collect',
        'The trial form asks for your name, organisation, job title, email, phone, and building type and approximate size, and records the sender IP address to prevent abuse. If you email us, we receive your email address, name, and the message you write.',
      ],
      [
        'Why',
        'To create and run your trial workspace, send trial emails (verification, access, reminders), answer your questions, help with installation, and contact you about PanduArah. We do not sell your data or use it for third-party advertising.',
      ],
      [
        'Retention',
        'Trial workspaces, their files, and trial accounts are deleted automatically 7 days after the trial ends. Trial form entries and emails are kept for at most 12 months unless you become a client. This site uses no tracking cookies; your language and light/dark theme choices are stored in your own browser.',
      ],
      [
        'Your rights',
        "Under Indonesia's Personal Data Protection Law you may request a copy, correction, or deletion of your data by emailing the address below.",
      ],
      [
        'Building visitor data',
        "PanduArah at a client building runs on the client's server; the building operator controls its visitor data and the vendor does not receive it. Trial and demo Visitors running on the vendor's server require no sign-in and collect no personal visitor data.",
      ],
    ],
    contact: 'Privacy questions:',
  },
};

export const COPY = { id, en } as const;
export type Language = keyof typeof COPY;
