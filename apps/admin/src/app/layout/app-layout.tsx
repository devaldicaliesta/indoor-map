import type { Profile } from '@indoor/domain';
import { cn } from '@indoor/ui';
import { Outlet } from 'react-router';
import { useIdleSignOut } from '../../features/auth/idle-sign-out';
import { LicenseNotice } from '../../features/license/license-notice';
import {
  HostedTrialEnded,
  HostedTrialNotice,
  useHostedTrial,
} from '../../features/trial/hosted-trial';
import { AccountMenu } from './account-menu';
import { NarrowScreenNotice } from './narrow-screen-notice';
import { Sidebar } from './sidebar';
import { useSidebar } from './sidebar-store';
import { VenuePicker } from './venue-picker';

export function AppLayout({ profile }: { profile: Profile }) {
  useIdleSignOut();
  const collapsed = useSidebar((s) => s.collapsed);
  const trial = useHostedTrial(!profile.allVenues).data ?? null;
  return (
    <div
      className={cn(
        'grid h-dvh grid-rows-[auto_1fr] transition-[grid-template-columns] duration-150',
        // minmax(0, …): isi kolom utama tidak boleh melebarkan halaman di HP (Penutupan).
        collapsed ? 'grid-cols-[56px_minmax(0,1fr)]' : 'grid-cols-[240px_minmax(0,1fr)]',
      )}
    >
      <Sidebar user={profile} />
      <header className="flex h-14 min-w-0 items-center justify-between gap-4 border-line border-b bg-surface px-4">
        <VenuePicker />
        <AccountMenu profile={profile} />
      </header>
      <main className="min-h-0 overflow-auto">
        {trial?.locked ? (
          <HostedTrialEnded trial={trial} />
        ) : (
          <>
            <NarrowScreenNotice />
            <LicenseNotice />
            {trial ? <HostedTrialNotice trial={trial} /> : null}
            <Outlet />
          </>
        )}
      </main>
    </div>
  );
}
