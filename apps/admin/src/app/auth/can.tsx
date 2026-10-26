import { type AdminAction, type AppRole, can, licenseAllows } from '@indoor/domain';
import type { ReactNode } from 'react';
import { useLicenseStatus } from '../../features/license/queries';
import { useCurrentProfile } from './current-profile';

export const GRACE_READ_ONLY_HINT = 'Masa tenggang lisensi: Admin hanya-baca.';

export function useRole(): AppRole | null {
  return useCurrentProfile().data?.role ?? null;
}

/**
 * Lisensi tidak berlaku tetapi Admin masih terbuka (masa tenggang). Selama status belum terbaca
 * dianggap berlaku agar tombol tidak berkedip; server tetap menolak penulisan.
 */
export function useLicenseReadOnly(): boolean {
  const state = useLicenseStatus().data?.state;
  return state !== undefined && state !== 'active';
}

/** Role boleh melakukan aksi ini dan lisensi tidak menguncinya. */
export function useCan(action: AdminAction): boolean {
  const role = useRole();
  const readOnly = useLicenseReadOnly();
  return role !== null && can(role, action) && licenseAllows(action, !readOnly);
}

/**
 * Menyembunyikan aksi yang tidak boleh dilakukan role ini. Selama masa tenggang, aksi tulis
 * tetap tampil tetapi nonaktif dengan keterangan. Server tetap menegakkan lewat RLS.
 */
export function Can({
  action,
  children,
  fallback = null,
}: {
  action: AdminAction;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const role = useRole();
  const readOnly = useLicenseReadOnly();
  if (!role || !can(role, action)) return <>{fallback}</>;
  if (licenseAllows(action, !readOnly)) return <>{children}</>;
  return (
    <fieldset disabled className="contents" title={GRACE_READ_ONLY_HINT} data-license-locked="">
      {children}
    </fieldset>
  );
}
