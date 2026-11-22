import type { AdminTour } from '../../app/tour';

export const INTEGRATIONS_TOUR: AdminTour = {
  id: 'integrations',
  version: 1,
  steps: [
    {
      title: 'Integrasi',
      description:
        'Hubungkan SIMRS, sistem akademik, atau sistem lain: mereka mengubah jam dan penutupan lewat API, dan menerima kabar lewat webhook.',
    },
    {
      target: 'integrations-tabs',
      title: 'Kunci, webhook, dan log',
      description:
        'Kunci API untuk sistem yang mengirim perubahan, webhook untuk sistem yang ingin diberi tahu, dan log setiap pengiriman webhook.',
      side: 'bottom',
    },
    {
      target: 'integrations-new-key',
      requires: 'integration.manage',
      title: 'Satu kunci per sistem',
      description:
        'Pilih izin seperlunya, misalnya hanya mengubah jam. Kunci tampil sekali; bila bocor, cabut dan buat yang baru.',
      side: 'left',
    },
    {
      target: 'integrations-docs',
      title: 'Dokumentasi API',
      description: 'Berikan alamat API dan dokumen OpenAPI ini kepada tim TI sistem klien.',
      side: 'top',
    },
  ],
};
