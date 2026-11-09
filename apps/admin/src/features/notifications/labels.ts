import type { NotificationKind } from '@indoor/domain';

export const NOTIFICATION_LABELS: Record<NotificationKind, { label: string; hint: string }> = {
  license_reminder: {
    label: 'Pengingat lisensi',
    hint: '30, 7, dan 1 hari sebelum lisensi berakhir.',
  },
  publish: {
    label: 'Peta diterbitkan',
    hint: 'Saat pengguna lain menerbitkan atau mengembalikan peta venue Anda.',
  },
  closure_created: {
    label: 'Penutupan baru',
    hint: 'Saat pengguna lain menambahkan penutupan sementara di venue Anda.',
  },
};
