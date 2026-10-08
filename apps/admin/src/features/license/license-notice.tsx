import { licenseNotice } from '@indoor/domain';
import { TriangleAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useCheckinOverdueSince, useLicenseStatus, useLicenseValidUntil } from './queries';
import { VendorEmail } from './vendor-email';

const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function Banner({ children }: { children: ReactNode }) {
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
      <span>{children}</span>
    </p>
  );
}

/** Trial: sisa hari selalu tampil; lalu pengingat H-30/H-7/H-1 dan masa tenggang. */
function ValidityNotice() {
  const validUntil = useLicenseValidUntil();
  const status = useLicenseStatus();
  if (!validUntil.data) return null;
  const notice = licenseNotice(validUntil.data, new Date(), {
    trial: status.data?.isTrial ?? false,
  });
  if (!notice) return null;
  const ends = date.format(new Date(validUntil.data));
  if (notice.kind === 'trial') {
    return (
      <Banner>
        <strong>Trial — sisa {notice.days} hari</strong> (berakhir {ends}). Batas data trial
        berlaku; lihat pemakaiannya di{' '}
        <Link to="/license" className="font-bold underline underline-offset-4">
          halaman Lisensi
        </Link>
        . Pasang lisensi berbayar untuk mengangkat batas tanpa kehilangan data; hubungi{' '}
        <VendorEmail />.
      </Banner>
    );
  }
  if (notice.kind === 'grace') {
    return (
      <Banner>
        Lisensi berakhir {ends}. Masa tenggang sampai {date.format(new Date(notice.graceEndsAt))}:
        Admin hanya-baca, Visitor tetap berjalan. Setelah itu peta Visitor dihentikan. Hubungi
        vendor di <VendorEmail /> untuk perpanjangan.
      </Banner>
    );
  }
  return (
    <Banner>
      Lisensi berakhir dalam {notice.days} hari ({ends}). Hubungi vendor di <VendorEmail /> untuk
      perpanjangan agar Admin tidak menjadi hanya-baca.
    </Banner>
  );
}

/** Banner saat check-in lisensi ke vendor gagal lebih dari 7 hari; sistem tetap berjalan. */
function CheckinNotice() {
  const overdue = useCheckinOverdueSince();
  if (!overdue.data) return null;
  return (
    <Banner>
      Lisensi belum berhasil diperiksa ke server vendor sejak {date.format(new Date(overdue.data))}.
      Sistem tetap berjalan dengan lisensi saat ini, tetapi perpanjangan tidak diterima otomatis.
      Pastikan server bisa menghubungi server vendor.
    </Banner>
  );
}

export function LicenseNotice() {
  return (
    <>
      <ValidityNotice />
      <CheckinNotice />
    </>
  );
}
