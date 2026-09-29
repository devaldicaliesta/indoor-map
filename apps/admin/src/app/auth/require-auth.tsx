import { Skeleton } from '@indoor/ui';
import { Navigate, useLocation } from 'react-router';
import { AppLayout } from '../layout/app-layout';
import { RouteError } from '../route-error';
import { useAuthSync, useCurrentProfile } from './current-profile';

/** Halaman Admin hanya untuk pengguna yang masuk; tanpa sesi diarahkan ke /login. */
export function RequireAuth() {
  useAuthSync();
  const location = useLocation();
  const profile = useCurrentProfile();

  if (profile.isPending) {
    return (
      <div className="grid h-dvh grid-cols-[240px_1fr] gap-4 p-4">
        <Skeleton className="h-full" />
        <Skeleton className="h-14" />
      </div>
    );
  }
  if (profile.error) return <RouteError error={profile.error} />;
  if (!profile.data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <AppLayout profile={profile.data} />;
}
