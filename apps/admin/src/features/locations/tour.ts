import type { AdminTour } from '../../app/tour';

export const LOCATIONS_TOUR: AdminTour = {
  id: 'locations',
  version: 1,
  steps: [
    {
      title: 'Halaman Lokasi',
      description:
        'Lokasi adalah tempat yang dicari pengunjung, misalnya ruangan, kantor, atau layanan. Setiap lokasi ditautkan ke unit yang digambar di Editor Peta.',
    },
    {
      target: 'locations-tabs',
      title: 'Lokasi dan tipe lokasi',
      description:
        'Tab Tipe lokasi mengatur tipe, kolom isian tambahan, dan kategori yang dipakai pencarian di Visitor.',
      side: 'bottom',
    },
    {
      target: 'table-toolbar',
      title: 'Cari dan saring',
      description:
        'Cari nama, kode lokasi, atau kode unit, lalu saring per kategori, gedung, lantai, atau status. Pencarian dan filter tersimpan di alamat halaman.',
      side: 'bottom',
    },
    {
      target: 'locations-add',
      requires: 'location.edit',
      title: 'Tambah lokasi',
      description: 'Isi nama, tipe, status, dan jam buka, lalu tautkan lokasi ke unit di peta.',
      side: 'left',
    },
    {
      target: 'locations-import',
      requires: 'location.edit',
      title: 'Import',
      description:
        'Masukkan banyak lokasi sekaligus dari CSV atau Excel. Template berkasnya bisa diunduh di dialog Import.',
      side: 'left',
    },
    {
      target: 'table-pagination',
      title: 'Halaman tabel',
      description: 'Atur jumlah baris per halaman dan pindah halaman.',
      side: 'top',
    },
    {
      target: 'tour-button',
      title: 'Ulangi tur',
      description: 'Tur ini tidak muncul otomatis lagi. Buka kapan saja lewat tombol Tur halaman.',
      side: 'bottom',
    },
  ],
};
