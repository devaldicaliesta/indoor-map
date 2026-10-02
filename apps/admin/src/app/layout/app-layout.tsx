import type { Profile } from '@indoor/domain';
import { cn } from '@indoor/ui';
import { Outlet } from 'react-router';
import { useIdleSignOut } from '../../features/auth/idle-sign-out';
import { AccountMenu } from './account-menu';
import { NarrowScreenNotice } from './narrow-screen-notice';
import { Sidebar } from './sidebar';
import { useSidebar } from './sidebar-store';
import { VenuePicker } from './venue-picker';

export function AppLayout({ profile }: { profile: Profile }) {
  useIdleSignOut();
  const collapsed = useSidebar((s) => s.collapsed);
  return (
    <div
      className={cn(
        'grid h-dvh grid-rows-[auto_1fr] transition-[grid-template-columns] duration-150',
        collapsed ? 'grid-cols-[56px_1fr]' : 'grid-cols-[240px_1fr]',
      )}
    >
      <Sidebar role={profile.role} />
      <header className="flex h-14 items-center justify-between gap-4 border-line border-b bg-surface px-4">
        <VenuePicker />
        <AccountMenu profile={profile} />
      </header>
      <main className="min-h-0 overflow-auto">
        <NarrowScreenNotice />
        <Outlet />
      </main>
    </div>
  );
}
