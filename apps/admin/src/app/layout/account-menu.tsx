import { notificationKindsFor, type Profile } from '@indoor/domain';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from '@indoor/ui';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, LogOutIcon, MailIcon, ShieldCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AccountSecurityDialog } from '../../features/mfa/account-security-dialog';
import { NotificationsDialog } from '../../features/notifications/notifications-dialog';
import { data } from '../data-client';
import { ROLE_LABELS } from '../navigation';

export function AccountMenu({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [security, setSecurity] = useState(false);
  const [notifications, setNotifications] = useState(false);

  async function signOut() {
    try {
      await data.auth.signOut();
      queryClient.clear();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Gagal keluar', { description: error instanceof Error ? error.message : '' });
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="shrink-0 gap-3">
            {/* Di layar sempit (Penutupan dari HP) nama hanya untuk pembaca layar. */}
            <span className="max-sm:sr-only text-right">
              <span className="block leading-tight">{profile.fullName}</span>
              <span className="block font-normal text-ink-muted text-xs leading-tight">
                {ROLE_LABELS[profile.role]}
              </span>
            </span>
            <ChevronDownIcon strokeWidth={1.75} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <span className="block font-bold">{profile.fullName}</span>
            <span className="block text-ink-muted text-xs">{profile.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notificationKindsFor(profile.role).length > 0 ? (
            <DropdownMenuItem onSelect={() => setNotifications(true)}>
              <MailIcon strokeWidth={1.75} />
              Notifikasi email
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => setSecurity(true)}>
            <ShieldCheckIcon strokeWidth={1.75} />
            Keamanan akun
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void signOut()}>
            <LogOutIcon strokeWidth={1.75} />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {security ? <AccountSecurityDialog onClose={() => setSecurity(false)} /> : null}
      {notifications ? (
        <NotificationsDialog role={profile.role} onClose={() => setNotifications(false)} />
      ) : null}
    </>
  );
}
