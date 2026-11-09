import { DataError } from '@indoor/data';
import { mfaGateStep } from '@indoor/domain';
import { Skeleton } from '@indoor/ui';
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { setLoginNotice } from '../../features/auth/navigation-notice';
import { MfaGate, RecoveryCodesScreen } from '../../features/mfa/mfa-gate';
import { useMfa, useRefreshMfa } from '../../features/mfa/queries';
import { AppLayout } from '../layout/app-layout';
import { RouteError } from '../route-error';
import { useAuthSync, useCurrentProfile } from './current-profile';

/** Halaman Admin hanya untuk pengguna yang masuk; tanpa sesi diarahkan ke /login. */
export function RequireAuth() {
  useAuthSync();
  const location = useLocation();
  const profile = useCurrentProfile();
  const mfa = useMfa(Boolean(profile.data));
  const refreshMfa = useRefreshMfa();
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);

  if (profile.isPending || (profile.data && mfa.isPending)) {
    return (
      <div className="grid h-dvh grid-cols-[240px_1fr] gap-4 p-4">
        <Skeleton className="h-full" />
        <Skeleton className="h-14" />
      </div>
    );
  }
  if (profile.error instanceof DataError && profile.error.code === 'account_inactive') {
    setLoginNotice(profile.error.message);
    return <Navigate to="/login" replace />;
  }
  if (profile.error) return <RouteError error={profile.error} />;
  if (!profile.data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (mfa.error) return <RouteError error={mfa.error} />;
  if (freshCodes) {
    const done = () => void refreshMfa().finally(() => setFreshCodes(null));
    return <RecoveryCodesScreen codes={freshCodes} onDone={done} />;
  }
  if (mfa.data) {
    const step = mfaGateStep(mfa.data.state);
    if (step !== 'ok') {
      return <MfaGate step={step} factorId={mfa.data.factorId} onRecoveryCodes={setFreshCodes} />;
    }
  }
  return <AppLayout profile={profile.data} />;
}
