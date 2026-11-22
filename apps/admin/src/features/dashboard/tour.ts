import type { AdminTour } from '../../app/tour';

export const DASHBOARD_TOUR: AdminTour = {
  id: 'dashboard',
  version: 1,
  steps: [
    {
      title: 'Dasbor venue',
      description:
        'Ringkasan venue yang dipilih, dihitung langsung dari data draft setiap halaman ini dibuka.',
    },
    {
      target: 'dashboard-locations',
      title: 'Lokasi per status',
      description: 'Klik salah satu status untuk membuka tabel Lokasi yang sudah tersaring.',
      side: 'right',
    },
    {
      target: 'dashboard-completeness',
      title: 'Kelengkapan data',
      description:
        'Lokasi yang belum tertaut unit dan unit peta yang belum punya lokasi. Keduanya perlu dilengkapi sebelum publish.',
      side: 'bottom',
    },
    {
      target: 'dashboard-validation',
      requires: 'publish.validate',
      title: 'Validasi publish',
      description: 'Jumlah Error dan Peringatan dari validasi yang sama dengan halaman Publish.',
      side: 'left',
    },
    {
      target: 'tour-button',
      title: 'Ulangi tur',
      description: 'Tur ini tidak muncul otomatis lagi. Buka kapan saja lewat tombol Tur halaman.',
      side: 'bottom',
    },
  ],
};
