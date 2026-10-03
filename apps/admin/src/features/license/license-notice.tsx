import { TriangleAlertIcon } from 'lucide-react';
import { useCheckinOverdueSince } from './queries';

const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

/** Banner saat check-in lisensi ke vendor gagal lebih dari 7 hari; sistem tetap berjalan. */
export function LicenseNotice() {
  const overdue = useCheckinOverdueSince();
  if (!overdue.data) return null;
  return (
    <p
      role="status"
      className="flex items-start gap-2 border-line border-b bg-surface px-4 py-2 text-sm"
    >
      <TriangleAlertIcon
        aria-hidden="true"
        strokeWidth={1.75}
        className="mt-0.5 size-4 shrink-0 text-warn"
      />
      <span>
        Lisensi belum berhasil diperiksa ke server vendor sejak{' '}
        {date.format(new Date(overdue.data))}. Sistem tetap berjalan dengan lisensi saat ini, tetapi
        perpanjangan tidak diterima otomatis. Pastikan server bisa menghubungi server vendor.
      </span>
    </p>
  );
}
