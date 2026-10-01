import { type AdminAction, type AppRole, can } from '@indoor/domain';
import type { ReactNode } from 'react';
import { useCurrentProfile } from './current-profile';

export function useRole(): AppRole | null {
  return useCurrentProfile().data?.role ?? null;
}

/** Menyembunyikan aksi yang tidak boleh dilakukan role ini. Server tetap menegakkan lewat RLS. */
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
  return <>{role && can(role, action) ? children : fallback}</>;
}
