import type { AdminTour } from '../../app/tour';

export const MEDIA_TOUR: AdminTour = {
  id: 'media',
  version: 1,
  steps: [
    {
      title: 'Pustaka media',
      description:
        'Semua logo, foto lokasi, ikon unggahan, gambar event, dan denah venue ini di satu tempat, lengkap dengan pemakaiannya.',
    },
    {
      target: 'table-toolbar',
      title: 'Cari dan saring',
      description:
        'Cari nama berkas atau nama pemakainya, lalu saring per jenis atau aset yang tidak terpakai.',
      side: 'bottom',
    },
    {
      target: 'media-upload',
      requires: 'media.edit',
      title: 'Unggah gambar',
      description:
        'Gambar yang diunggah di sini bisa dipilih sebagai logo atau foto di formulir lokasi, untuk banyak lokasi sekaligus.',
      side: 'left',
    },
    {
      target: 'tour-button',
      title: 'Ulangi tur',
      description:
        'Aset yang masih dipakai tidak bisa dihapus. Buka tur ini kapan saja lewat tombol Tur halaman.',
      side: 'bottom',
    },
  ],
};
