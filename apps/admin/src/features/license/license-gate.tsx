import { Skeleton } from '@indoor/ui';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { RouteError } from '../../app/route-error';
import { useLicenseStatus } from './queries';

/**
 * Halaman Admin hanya terbuka dengan lisensi berlaku dan Super Admin yang sudah ada; selain
 * itu diarahkan ke /aktivasi. Ini hanya pengarahan: server menolak perubahan tanpa lisensi.
 * `allowWithoutLicense` untuk halaman masuk: Super Admin perlu masuk untuk memperbarui lisensi.
 */
export function LicenseGate({
  children,
  allowWithoutLicense = false,
}: {
  children: ReactNode;
  allowWithoutLicense?: boolean;
}) {
  const status = useLicenseStatus();
  if (status.isPending) return <Skeleton className="m-4 h-24" />;
  if (status.error) return <RouteError error={status.error} />;
  const { state, needsAdmin } = status.data;
  if (needsAdmin) return <Navigate to="/aktivasi" replace />;
  // Masa tenggang: Admin tetap terbuka hanya-baca (server menolak penulisan) dengan banner.
  if (state !== 'active' && state !== 'grace' && !allowWithoutLicense) {
    return <Navigate to="/aktivasi" replace />;
  }
  return children;
}
