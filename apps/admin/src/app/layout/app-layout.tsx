import type { Profile } from '@indoor/domain';
import { Outlet } from 'react-router';
import { useIdleSignOut } from '../../features/auth/idle-sign-out';
import { AccountMenu } from './account-menu';
import { NarrowScreenNotice } from './narrow-screen-notice';
import { Sidebar } from './sidebar';
import { VenuePicker } from './venue-picker';

export function AppLayout({ profile }: { profile: Profile }) {
  useIdleSignOut();
  return (
    <div className="grid h-dvh grid-cols-[240px_1fr] grid-rows-[auto_1fr]">
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
