import { daysRemaining, type HostedTrialStatus, hostedTrialDeleteAt } from '@indoor/domain';
import { EmptyState } from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { ClockIcon } from 'lucide-react';
import { data } from '../../app/data-client';
import { VendorEmail } from '../license/vendor-email';

const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Trial ter-hosting pengguna yang masuk (F2-K). Hanya ditanyakan untuk pengguna yang tidak
 * menjangkau semua venue — on-premise dan staf vendor tidak pernah punya trial. Dibaca ulang tiap
 * jam: siklus hidup mengunci trial di server tanpa memberi tahu Admin yang sedang terbuka.
 */
export function useHostedTrial(enabled: boolean) {
  return useQuery({
    queryKey: ['trial', 'status'],
    queryFn: () => data.trial.status(),
    enabled,
    staleTime: 15 * 60_000,
    refetchInterval: 60 * 60_000,
  });
}

/** Banner "Trial — sisa N hari" di seluruh Admin selama trial berjalan (FR-HT-08). */
export function HostedTrialNotice({ trial }: { trial: HostedTrialStatus }) {
  const days = daysRemaining(trial.endsAt, new Date());
  return (
    <p
      role="status"
      className="flex items-start gap-2 border-line border-b bg-surface px-4 py-2 text-sm"
    >
      <ClockIcon aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-4 shrink-0" />
      <span>
        <strong>Trial — sisa {days} hari</strong> (berakhir {date.format(new Date(trial.endsAt))}).
        Batas data trial berlaku. Ingin melanjutkan setelah trial? Hubungi <VendorEmail />.
      </span>
    </p>
  );
}

/**
 * Pengganti isi Admin setelah trial terkunci (FR-HT-09). Server sudah menolak semua tulis
 * (0045); layar ini hanya menjelaskan keadaannya. Menu akun tetap ada untuk keluar.
 */
export function HostedTrialEnded({ trial }: { trial: HostedTrialStatus }) {
  return (
    <div className="grid min-h-full place-items-center p-6">
      <EmptyState
        title="Trial berakhir"
        description={
          <>
            Masa trial PanduArah berakhir {date.format(new Date(trial.endsAt))}. Admin dan Visitor
            kini terkunci, dan ruang kerja beserta datanya dihapus pada{' '}
            {date.format(new Date(hostedTrialDeleteAt(trial.endsAt)))}. Untuk melanjutkan, hubungi
            kami di <VendorEmail />.
          </>
        }
      />
    </div>
  );
}
