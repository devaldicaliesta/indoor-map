// Teks trial ter-hosting (T-616) dalam dua bahasa; bentuk EN harus sama persis dengan ID.
// Lama trial dan batasnya mengikuti `23-trial-hosting.md` §1.
import type { BuildingSize, BuildingType } from '@indoor/domain/trial-request';
import type { Language } from '../copy';

const id = {
  form: {
    title: 'Coba gratis 17 hari',
    lead: 'Isi form, klik tautan di email, dan dalam satu menit Anda punya Admin dan Visitor sendiri berisi contoh sesuai jenis gedung. Tanpa kartu kredit, tanpa pasang server.',
    points: [
      'Admin: gambar peta, kelola lokasi, publish',
      'Visitor dengan alamat sendiri, langsung bisa dibuka dari HP',
      '3D dan Info Point aktif; 1 gedung, 3 lantai, 100 lokasi',
    ],
    labels: {
      name: 'Nama lengkap',
      institution: 'Nama instansi atau gedung',
      title: 'Jabatan',
      email: 'Email kantor',
      phone: 'Telepon / WhatsApp',
    },
    buildingType: 'Jenis gedung',
    buildingSize: 'Perkiraan luas lantai total',
    choose: 'Pilih…',
    consentBefore:
      'Saya setuju data ini dipakai untuk membuat ruang kerja trial dan menghubungi saya tentang PanduArah, sesuai ',
    consentLink: 'kebijakan privasi',
    submit: 'Minta trial',
    sending: 'Mengirim…',
    honeypot: 'Jangan diisi',
    problems: {
      required: 'Wajib diisi.',
      too_long: 'Terlalu panjang.',
      invalid: 'Format belum benar.',
      out_of_range: 'Di luar rentang.',
    },
    failed: 'Permintaan belum terkirim. Coba lagi sebentar lagi, atau kirim email ke kami.',
    rateLimited: 'Terlalu banyak kiriman dari jaringan ini. Coba lagi sebentar lagi.',
    sentTitle: 'Cek email Anda',
    sentBody:
      'Kami mengirim tautan ke {email}. Klik tautan itu dalam 24 jam untuk membuat ruang kerja trial. Tidak ada di kotak masuk? Periksa folder spam atau promosi.',
    demo: 'Lihat demo dulu',
  },
  buildingTypes: {
    mall: 'Mal / pusat belanja',
    hospital: 'Rumah sakit',
    campus: 'Kampus / sekolah',
    office: 'Perkantoran',
    airport: 'Bandara / terminal',
    industrial: 'Kawasan industri / pabrik',
    event: 'Event / konser / pameran',
    other: 'Lainnya',
  } satisfies Record<BuildingType, string>,
  buildingSizes: {
    lt5k: 'Di bawah 5.000 m²',
    '5k-20k': '5.000–20.000 m²',
    '20k-50k': '20.000–50.000 m²',
    gt50k: 'Di atas 50.000 m²',
  } satisfies Record<BuildingSize, string>,
  verify: {
    title: 'Verifikasi trial',
    checking: 'Memeriksa tautan dan menyiapkan ruang kerja…',
    active: 'Ruang kerja Anda siap',
    activeBody:
      'Kami mengirim email berisi tautan untuk membuat password. Setelah itu masuk ke Admin dan ganti data contoh dengan gedung Anda.',
    admin: 'Buka Admin',
    visitor: 'Lihat Visitor',
    queued: 'Anda dalam antrean',
    queuedBody:
      'Semua ruang kerja trial sedang terpakai. Kami mengirim email begitu ruang kerja Anda siap — tidak perlu mengajukan lagi.',
    rejected: 'Trial tidak bisa diberikan',
    rejectedBody:
      'Alamat email atau instansi ini sudah pernah memakai trial PanduArah. Hubungi kami untuk melanjutkan.',
    expired: 'Tautan kedaluwarsa',
    expiredBody:
      'Tautan verifikasi berlaku 24 jam. Isi form trial lagi untuk mendapat tautan baru.',
    invalid: 'Tautan tidak berlaku',
    invalidBody:
      'Tautan ini tidak dikenal atau sudah dipakai. Bila ruang kerja Anda sudah dibuat, cari email "Trial PanduArah Anda siap".',
    failed: 'Verifikasi belum bisa diproses',
    failedBody: 'Coba muat ulang halaman ini sebentar lagi.',
    again: 'Isi form trial',
    retry: 'Coba lagi',
    home: 'Kembali ke beranda',
  },
};

export type TrialCopy = typeof id;

const en: TrialCopy = {
  form: {
    title: 'Try it free for 17 days',
    lead: 'Fill in the form, click the link in your email, and within a minute you have your own Admin and Visitor with sample data for your building type. No credit card, no server to install.',
    points: [
      'Admin: draw the map, manage locations, publish',
      'Visitor at its own address, ready to open on a phone',
      '3D and Info Point included; 1 building, 3 floors, 100 locations',
    ],
    labels: {
      name: 'Full name',
      institution: 'Organisation or building name',
      title: 'Job title',
      email: 'Work email',
      phone: 'Phone / WhatsApp',
    },
    buildingType: 'Building type',
    buildingSize: 'Approximate total floor area',
    choose: 'Choose…',
    consentBefore:
      'I agree that this data is used to create a trial workspace and to contact me about PanduArah, as described in the ',
    consentLink: 'privacy policy',
    submit: 'Request a trial',
    sending: 'Sending…',
    honeypot: 'Leave empty',
    problems: {
      required: 'Required.',
      too_long: 'Too long.',
      invalid: 'Check the format.',
      out_of_range: 'Out of range.',
    },
    failed: 'Your request was not sent. Try again shortly, or email us.',
    rateLimited: 'Too many requests from this network. Try again shortly.',
    sentTitle: 'Check your email',
    sentBody:
      'We sent a link to {email}. Click it within 24 hours to create your trial workspace. Not in your inbox? Check your spam or promotions folder.',
    demo: 'See the demo first',
  },
  buildingTypes: {
    mall: 'Mall / shopping centre',
    hospital: 'Hospital',
    campus: 'Campus / school',
    office: 'Office building',
    airport: 'Airport / terminal',
    industrial: 'Industrial estate / factory',
    event: 'Event / concert / exhibition',
    other: 'Other',
  },
  buildingSizes: {
    lt5k: 'Under 5,000 m²',
    '5k-20k': '5,000–20,000 m²',
    '20k-50k': '20,000–50,000 m²',
    gt50k: 'Over 50,000 m²',
  },
  verify: {
    title: 'Trial verification',
    checking: 'Checking your link and preparing your workspace…',
    active: 'Your workspace is ready',
    activeBody:
      'We emailed you a link to create your password. Then sign in to Admin and replace the sample data with your own building.',
    admin: 'Open Admin',
    visitor: 'View Visitor',
    queued: "You're in the queue",
    queuedBody:
      'All trial workspaces are currently in use. We will email you as soon as yours is ready — no need to apply again.',
    rejected: 'A trial cannot be provided',
    rejectedBody:
      'This email address or organisation has already used a PanduArah trial. Contact us to continue.',
    expired: 'Link expired',
    expiredBody:
      'Verification links are valid for 24 hours. Fill in the trial form again to get a new one.',
    invalid: 'Link not valid',
    invalidBody:
      'This link is unknown or has already been used. If your workspace was created, look for the email "Your PanduArah trial is ready".',
    failed: 'Verification could not be processed',
    failedBody: 'Try reloading this page shortly.',
    again: 'Fill in the trial form',
    retry: 'Try again',
    home: 'Back to home',
  },
};

export const TRIAL_COPY: Record<Language, TrialCopy> = { id, en };
